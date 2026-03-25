-- ============================================================
-- Remove priority from ops_tasks, ops_projects, and
-- recurring_task_templates. Priority is unnecessary clutter.
-- Notification triggers that referenced task.priority now
-- default to 'normal'.
-- ============================================================

-- 1. Drop dependent views that reference ops_tasks.priority / ops_projects.priority
DROP VIEW IF EXISTS crm_contact_timeline CASCADE;
DROP VIEW IF EXISTS crm_upcoming_items CASCADE;
DROP MATERIALIZED VIEW IF EXISTS search_index CASCADE;

-- 2. Drop CHECK constraints
ALTER TABLE ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_priority_check;
ALTER TABLE ops_projects DROP CONSTRAINT IF EXISTS ops_projects_priority_check;

-- 3. Drop priority columns
ALTER TABLE ops_tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE ops_projects DROP COLUMN IF EXISTS priority;
ALTER TABLE recurring_task_templates DROP COLUMN IF EXISTS priority;

-- 4. Rebuild generate_next_recurring_task RPC without priority
DROP FUNCTION IF EXISTS generate_next_recurring_task(uuid);
CREATE OR REPLACE FUNCTION generate_next_recurring_task(p_task_id UUID)
RETURNS JSONB AS $$
DECLARE
  src RECORD;
  next_due DATE;
  new_id UUID;
  series_id UUID;
BEGIN
  SELECT * INTO src FROM ops_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Task not found');
  END IF;

  IF src.recurrence_pattern IS NULL THEN
    RETURN jsonb_build_object('error', 'Not a recurring task');
  END IF;

  IF src.is_active_recurrence IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Recurrence is inactive');
  END IF;

  -- Calculate next due date based on pattern
  next_due := CASE src.recurrence_pattern
    WHEN 'daily' THEN COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '1 day'
    WHEN 'weekly' THEN COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '1 week'
    WHEN 'biweekly' THEN COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '2 weeks'
    WHEN 'monthly' THEN COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '1 month'
    WHEN 'quarterly' THEN COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '3 months'
    WHEN 'annually' THEN COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '1 year'
    ELSE COALESCE(src.due_date, CURRENT_DATE) + INTERVAL '1 month'
  END;

  -- Check end date
  IF src.recurrence_end_date IS NOT NULL AND next_due > src.recurrence_end_date THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Past recurrence end date');
  END IF;

  series_id := COALESCE(src.recurring_series_id, src.id);

  -- Duplicate prevention
  IF EXISTS (
    SELECT 1 FROM ops_tasks
    WHERE recurring_series_id = series_id
      AND due_date = next_due
      AND status != 'Complete'
  ) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Task for this date already exists');
  END IF;

  new_id := gen_random_uuid();

  INSERT INTO ops_tasks (
    id, title, description, status,
    assigned_to, assigned_to_name, project_id, due_date,
    category, linked_entity_type, linked_entity_id, linked_entity_label,
    is_recurring, recurrence_pattern, recurrence_end_date,
    is_active_recurrence, recurring_series_id, source_task_id,
    created_by, created_at
  ) VALUES (
    new_id,
    src.title,
    src.description,
    'To Do',
    src.assigned_to,
    src.assigned_to_name,
    src.project_id,
    next_due,
    src.category,
    src.linked_entity_type,
    src.linked_entity_id,
    src.linked_entity_label,
    true,
    src.recurrence_pattern,
    src.recurrence_end_date,
    src.is_active_recurrence,
    series_id,
    src.id,
    src.created_by,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_task_id', new_id,
    'next_due_date', next_due::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Rebuild notification triggers to use 'normal' instead of NEW.priority

-- 4a. Task status change notification
CREATE OR REPLACE FUNCTION handle_task_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_type_id UUID;
  v_actor_name TEXT;
  v_actor_id UUID;
  v_title_text TEXT;
  v_body_text TEXT;
BEGIN
  IF TG_OP != 'UPDATE' THEN RETURN NEW; END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  v_actor_id := (SELECT auth.uid());

  SELECT id INTO v_notification_type_id
  FROM notification_types WHERE slug = 'task_status_changed' LIMIT 1;

  SELECT COALESCE(full_name, email, 'Someone') INTO v_actor_name
  FROM profiles WHERE id = v_actor_id LIMIT 1;
  IF v_actor_name IS NULL THEN v_actor_name := 'Someone'; END IF;

  v_title_text := v_actor_name || ' changed status to "' || NEW.status || '" on "' || left(NEW.title, 60) || '"';
  v_body_text := 'Status changed from ' || OLD.status || ' to ' || NEW.status;

  -- Notify assignee (if not the actor)
  IF NEW.assigned_to IS NOT NULL AND NEW.assigned_to != v_actor_id THEN
    INSERT INTO notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), NEW.assigned_to, v_notification_type_id,
      'task_status_changed', v_title_text, v_body_text,
      'normal', 'task', NEW.id, NEW.title, '/tasks?task=' || NEW.id, false
    );
  END IF;

  -- Notify creator (if different from assignee and actor)
  IF NEW.created_by IS NOT NULL
     AND NEW.created_by != v_actor_id
     AND NEW.created_by IS DISTINCT FROM NEW.assigned_to
  THEN
    INSERT INTO notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), NEW.created_by, v_notification_type_id,
      'task_status_changed', v_title_text, v_body_text,
      'normal', 'task', NEW.id, NEW.title, '/tasks?task=' || NEW.id, false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4b. Task comment notification
CREATE OR REPLACE FUNCTION handle_task_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_type_id UUID;
  v_author_name TEXT;
  v_task RECORD;
  v_title_text TEXT;
  v_body_text TEXT;
BEGIN
  IF NEW.task_id IS NULL THEN RETURN NEW; END IF;

  SELECT id INTO v_notification_type_id
  FROM notification_types WHERE slug = 'task_comment' LIMIT 1;

  SELECT COALESCE(full_name, email, 'Someone') INTO v_author_name
  FROM profiles WHERE id = NEW.author_id LIMIT 1;
  IF v_author_name IS NULL THEN v_author_name := 'Someone'; END IF;

  SELECT id, title, assigned_to, created_by
  INTO v_task
  FROM ops_tasks WHERE id = NEW.task_id LIMIT 1;

  IF v_task.id IS NULL THEN RETURN NEW; END IF;

  v_title_text := v_author_name || ' commented on "' || left(v_task.title, 60) || '"';
  v_body_text := left(NEW.body, 200);

  IF v_task.assigned_to IS NOT NULL AND v_task.assigned_to != NEW.author_id THEN
    INSERT INTO notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), v_task.assigned_to, v_notification_type_id,
      'task_comment', v_title_text, v_body_text,
      'normal', 'task', v_task.id, v_task.title, '/tasks?task=' || v_task.id, false
    );
  END IF;

  IF v_task.created_by IS NOT NULL
     AND v_task.created_by != NEW.author_id
     AND v_task.created_by IS DISTINCT FROM v_task.assigned_to
  THEN
    INSERT INTO notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), v_task.created_by, v_notification_type_id,
      'task_comment', v_title_text, v_body_text,
      'normal', 'task', v_task.id, v_task.title, '/tasks?task=' || v_task.id, false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4c. Task assignment notification (also handles INSERT)
CREATE OR REPLACE FUNCTION handle_task_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_type_id UUID;
  v_creator_name TEXT;
  v_title_text TEXT;
BEGIN
  IF NEW.assigned_to IS NULL THEN RETURN NEW; END IF;

  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
    RETURN NEW;
  END IF;

  IF NEW.assigned_to = COALESCE(NEW.created_by, (SELECT auth.uid())) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_notification_type_id
  FROM notification_types WHERE slug = 'task-assigned' LIMIT 1;

  SELECT COALESCE(full_name, email, 'Someone') INTO v_creator_name
  FROM profiles WHERE id = COALESCE(NEW.created_by, (SELECT auth.uid())) LIMIT 1;
  IF v_creator_name IS NULL THEN v_creator_name := 'Someone'; END IF;

  v_title_text := v_creator_name || ' assigned you a task: "' || left(NEW.title, 80) || '"';

  INSERT INTO notifications (
    id, user_id, notification_type_id, notification_slug,
    title, body, priority, entity_type, entity_id, entity_label,
    action_url, email_sent
  ) VALUES (
    gen_random_uuid(), NEW.assigned_to, v_notification_type_id,
    'task-assigned', v_title_text, COALESCE(left(NEW.description, 200), ''),
    'normal', 'task', NEW.id, NEW.title, '/tasks?task=' || NEW.id::text, false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate crm_contact_timeline view (priority column now always NULL in task branch)
CREATE OR REPLACE VIEW crm_contact_timeline AS
 SELECT a.id, 'activity'::text AS item_type, a.activity_type AS sub_type, a.subject AS title,
    a.description AS body, a.contact_id, a.company_id, a.performed_by AS actor_id,
    p_actor.name AS actor_name, COALESCE(a.scheduled_at, a.created_at) AS occurred_at,
    a.created_at, a.is_completed, NULL::text AS priority, NULL::text AS task_status,
    (a.direction)::text AS direction, a.metadata
   FROM crm_activities a LEFT JOIN profiles p_actor ON a.performed_by = p_actor.id
  WHERE a.deleted_at IS NULL
UNION ALL
 SELECT ot.id, 'task'::text AS item_type, COALESCE(ot.category, 'general'::text) AS sub_type,
    ot.title, ot.description AS body,
    CASE WHEN ot.linked_entity_type = 'contact' THEN ot.linked_entity_id ELSE NULL::uuid END AS contact_id,
    CASE WHEN ot.linked_entity_type = 'company' THEN ot.linked_entity_id ELSE NULL::uuid END AS company_id,
    ot.assigned_to AS actor_id, p_assign.name AS actor_name,
    COALESCE(ot.due_date::timestamp with time zone, ot.created_at) AS occurred_at,
    ot.created_at, (ot.status = 'Complete') AS is_completed,
    NULL::text AS priority, ot.status AS task_status, NULL::text AS direction,
    jsonb_build_object('assigned_by', ot.created_by, 'completed_at', ot.completed_at) AS metadata
   FROM ops_tasks ot LEFT JOIN profiles p_assign ON ot.assigned_to = p_assign.id
  WHERE ot.linked_entity_type = ANY (ARRAY['contact', 'company'])
UNION ALL
 SELECT e.id, 'event'::text AS item_type, e.event_type::text AS sub_type, e.subject AS title,
    e.description AS body, e.contact_id, e.company_id, e.created_by AS actor_id,
    p_creator.name AS actor_name, e.start_at AS occurred_at, e.created_at,
    (e.end_at < now()) AS is_completed, NULL::text AS priority, NULL::text AS task_status,
    NULL::text AS direction,
    jsonb_build_object('location', e.location, 'end_at', e.end_at, 'is_all_day', e.is_all_day) AS metadata
   FROM crm_events e LEFT JOIN profiles p_creator ON e.created_by = p_creator.id
  WHERE e.deleted_at IS NULL
UNION ALL
 SELECT n.id, 'note'::text AS item_type,
    CASE WHEN n.is_pinned THEN 'pinned' ELSE 'post' END AS sub_type,
    NULL::text AS title, n.body, n.contact_id, n.company_id, n.author_id AS actor_id,
    p_author.name AS actor_name, n.created_at AS occurred_at, n.created_at,
    NULL::boolean AS is_completed, NULL::text AS priority, NULL::text AS task_status,
    NULL::text AS direction,
    jsonb_build_object('is_edited', n.is_edited, 'is_internal', n.is_internal, 'reply_count',
      (SELECT count(*) FROM notes r WHERE r.parent_note_id = n.id AND r.deleted_at IS NULL)) AS metadata
   FROM notes n LEFT JOIN profiles p_author ON n.author_id = p_author.id
  WHERE n.deleted_at IS NULL AND n.parent_note_id IS NULL;

-- 6. Recreate crm_upcoming_items view (priority column now always NULL)
CREATE OR REPLACE VIEW crm_upcoming_items AS
 SELECT ot.id, 'task'::text AS item_type, COALESCE(ot.category, 'general'::text) AS sub_type, ot.title,
    CASE WHEN ot.linked_entity_type = 'contact' THEN ot.linked_entity_id ELSE NULL::uuid END AS contact_id,
    CASE WHEN ot.linked_entity_type = 'company' THEN ot.linked_entity_id ELSE NULL::uuid END AS company_id,
    ot.assigned_to, p_assign.name AS assigned_to_name, NULL::text AS priority,
    ot.status AS task_status, ot.due_date::timestamp with time zone AS due_at,
    CASE
      WHEN ot.due_date < CURRENT_DATE THEN 'overdue'
      WHEN ot.due_date = CURRENT_DATE THEN 'due_today'
      WHEN ot.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_this_week'
      ELSE 'upcoming'
    END AS urgency,
    CASE WHEN ot.linked_entity_type = 'contact' THEN ot.linked_entity_label ELSE NULL::text END AS contact_name,
    CASE WHEN ot.linked_entity_type = 'company' THEN ot.linked_entity_label ELSE NULL::text END AS company_name
   FROM ops_tasks ot LEFT JOIN profiles p_assign ON ot.assigned_to = p_assign.id
  WHERE ot.status <> 'Complete' AND ot.due_date IS NOT NULL
    AND ot.linked_entity_type = ANY (ARRAY['contact', 'company'])
UNION ALL
 SELECT e.id, 'event'::text AS item_type, e.event_type::text AS sub_type, e.subject AS title,
    e.contact_id, e.company_id, e.created_by AS assigned_to, p_creator.name AS assigned_to_name,
    NULL::text AS priority, NULL::text AS task_status, e.start_at AS due_at,
    CASE
      WHEN e.start_at::date < CURRENT_DATE THEN 'past'
      WHEN e.start_at::date = CURRENT_DATE THEN 'today'
      WHEN e.start_at::date <= CURRENT_DATE + INTERVAL '7 days' THEN 'this_week'
      ELSE 'upcoming'
    END AS urgency,
    (c.first_name || ' ' || c.last_name) AS contact_name, comp.name AS company_name
   FROM crm_events e
     LEFT JOIN profiles p_creator ON e.created_by = p_creator.id
     LEFT JOIN crm_contacts c ON e.contact_id = c.id
     LEFT JOIN companies comp ON e.company_id = comp.id
  WHERE e.deleted_at IS NULL AND e.start_at >= now() - INTERVAL '1 day' AND e.start_at <= now() + INTERVAL '30 days';

-- 7. Recreate search_index materialized view (removed priority from task/project metadata)
CREATE MATERIALIZED VIEW search_index AS
 SELECT l.id, 'loan'::text AS entity_type,
    COALESCE(l.loan_number,'') || ' ' || COALESCE(l.property_address,'') || ' ' || COALESCE(l.property_address_line1,'') || ' ' || COALESCE(l.property_city,'') || ' ' || COALESCE(l.property_state,'') || ' ' || COALESCE(l.property_zip,'') || ' ' || COALESCE(lcc.first_name || ' ' || lcc.last_name,'') || ' ' || COALESCE(l.type::text,'') || ' ' || COALESCE(l.stage::text,'') || ' ' || COALESCE(l.originator,'') || ' ' || COALESCE(l.title_company_name,'') || ' ' || COALESCE(l.capital_partner,'') || ' ' || COALESCE(l.notes,'') AS search_text,
    jsonb_build_object('loan_number', l.loan_number, 'property_address', COALESCE(l.property_address, COALESCE(l.property_address_line1,'') || ', ' || COALESCE(l.property_city,'') || ' ' || COALESCE(l.property_state,'')), 'borrower_name', COALESCE(lcc.first_name || ' ' || lcc.last_name,''), 'borrower_id', l.borrower_id, 'loan_amount', l.loan_amount, 'stage', l.stage, 'type', l.type, 'priority', l.priority) AS metadata,
    l.updated_at, l.borrower_id AS owner_ref
   FROM loans l LEFT JOIN borrowers lb ON l.borrower_id = lb.id LEFT JOIN crm_contacts lcc ON lcc.id = lb.crm_contact_id AND lcc.deleted_at IS NULL
  WHERE l.deleted_at IS NULL
UNION ALL
 SELECT br.id, 'borrower'::text AS entity_type,
    COALESCE(cc.first_name,'') || ' ' || COALESCE(cc.last_name,'') || ' ' || COALESCE(cc.email,'') || ' ' || COALESCE(cc.phone,'') || ' ' || COALESCE(cc.city,'') || ' ' || COALESCE(cc.state,'') || ' ' || COALESCE(br.notes,'') AS search_text,
    jsonb_build_object('name', COALESCE(cc.first_name,'') || ' ' || COALESCE(cc.last_name,''), 'email', cc.email, 'phone', cc.phone, 'city', cc.city, 'state', cc.state, 'credit_score', br.credit_score, 'contact_number', cc.contact_number, 'contact_id', cc.id) AS metadata,
    br.updated_at, br.id AS owner_ref
   FROM borrowers br LEFT JOIN crm_contacts cc ON cc.id = br.crm_contact_id AND cc.deleted_at IS NULL
UNION ALL
 SELECT be.id, 'borrower_entity'::text AS entity_type,
    COALESCE(be.entity_name,'') || ' ' || COALESCE(be.entity_type,'') || ' ' || COALESCE(be.ein,'') || ' ' || COALESCE(be.state_of_formation,'') || ' ' || COALESCE(becc.first_name || ' ' || becc.last_name,'') AS search_text,
    jsonb_build_object('entity_name', be.entity_name, 'entity_type', be.entity_type, 'state_of_formation', be.state_of_formation, 'borrower_name', COALESCE(becc.first_name || ' ' || becc.last_name,''), 'borrower_id', be.borrower_id, 'contact_number', becc.contact_number, 'contact_id', becc.id) AS metadata,
    be.updated_at, be.borrower_id AS owner_ref
   FROM borrower_entities be LEFT JOIN borrowers beb ON be.borrower_id = beb.id LEFT JOIN crm_contacts becc ON becc.id = beb.crm_contact_id AND becc.deleted_at IS NULL
UNION ALL
 SELECT inv.id, 'investor'::text AS entity_type,
    COALESCE(icc.first_name,'') || ' ' || COALESCE(icc.last_name,'') || ' ' || COALESCE(icc.email,'') || ' ' || COALESCE(icc.phone,'') || ' ' || COALESCE(icc.city,'') || ' ' || COALESCE(icc.state,'') || ' ' || COALESCE(inv.notes,'') AS search_text,
    jsonb_build_object('name', COALESCE(icc.first_name,'') || ' ' || COALESCE(icc.last_name,''), 'email', icc.email, 'phone', icc.phone, 'accreditation_status', inv.accreditation_status, 'city', icc.city, 'state', icc.state) AS metadata,
    inv.updated_at, inv.id AS owner_ref
   FROM investors inv LEFT JOIN crm_contacts icc ON icc.id = inv.crm_contact_id AND icc.deleted_at IS NULL
UNION ALL
 SELECT ie.id, 'investing_entity'::text AS entity_type,
    COALESCE(ie.entity_name,'') || ' ' || COALESCE(ie.entity_type,'') || ' ' || COALESCE(ie.ein,'') || ' ' || COALESCE(ie.state_of_formation,'') || ' ' || COALESCE(iecc.first_name || ' ' || iecc.last_name,'') AS search_text,
    jsonb_build_object('entity_name', ie.entity_name, 'entity_type', ie.entity_type, 'investor_name', COALESCE(iecc.first_name || ' ' || iecc.last_name,''), 'investor_id', ie.investor_id) AS metadata,
    ie.updated_at, ie.investor_id AS owner_ref
   FROM investing_entities ie LEFT JOIN investors iei ON ie.investor_id = iei.id LEFT JOIN crm_contacts iecc ON iecc.id = iei.crm_contact_id AND iecc.deleted_at IS NULL
UNION ALL
 SELECT funds.id, 'fund'::text AS entity_type,
    COALESCE(funds.name,'') || ' ' || COALESCE(funds.fund_type,'') || ' ' || COALESCE(funds.strategy,'') || ' ' || COALESCE(funds.status,'') || ' ' || COALESCE(funds.notes,'') AS search_text,
    jsonb_build_object('name', funds.name, 'fund_type', funds.fund_type, 'current_aum', funds.current_aum, 'target_size', funds.target_size, 'status', funds.status, 'vintage_year', funds.vintage_year) AS metadata,
    funds.updated_at, NULL::uuid AS owner_ref
   FROM funds WHERE funds.deleted_at IS NULL
UNION ALL
 SELECT crm_contacts.id, 'crm_contact'::text AS entity_type,
    COALESCE(crm_contacts.first_name,'') || ' ' || COALESCE(crm_contacts.last_name,'') || ' ' || COALESCE(crm_contacts.name,'') || ' ' || COALESCE(crm_contacts.company_name,'') || ' ' || COALESCE(crm_contacts.email,'') || ' ' || COALESCE(crm_contacts.phone,'') || ' ' || COALESCE(crm_contacts.contact_type::text,'') || ' ' || COALESCE(crm_contacts.source::text,'') || ' ' || COALESCE(crm_contacts.notes,'') AS search_text,
    jsonb_build_object('name', COALESCE(crm_contacts.name, COALESCE(crm_contacts.first_name,'') || ' ' || COALESCE(crm_contacts.last_name,'')), 'company_name', crm_contacts.company_name, 'email', crm_contacts.email, 'contact_type', crm_contacts.contact_type, 'source', crm_contacts.source, 'status', crm_contacts.status) AS metadata,
    crm_contacts.updated_at, NULL::uuid AS owner_ref
   FROM crm_contacts WHERE crm_contacts.deleted_at IS NULL
UNION ALL
 SELECT documents.id, 'document'::text AS entity_type,
    COALESCE(documents.file_name,'') || ' ' || COALESCE(documents.document_type,'') || ' ' || COALESCE(documents.description,'') AS search_text,
    jsonb_build_object('file_name', documents.file_name, 'document_type', documents.document_type, 'loan_id', documents.loan_id, 'fund_id', documents.fund_id, 'file_url', documents.file_url) AS metadata,
    documents.updated_at, documents.owner_id AS owner_ref
   FROM documents
UNION ALL
 SELECT ld.id, 'loan_document'::text AS entity_type,
    COALESCE(ld.document_name,'') || ' ' || COALESCE(ld.document_type,'') || ' ' || COALESCE(ld.notes,'') || ' ' || COALESCE(l.loan_number,'') AS search_text,
    jsonb_build_object('document_name', ld.document_name, 'document_type', ld.document_type, 'loan_id', ld.loan_id, 'loan_number', l.loan_number, 'file_url', ld.file_url) AS metadata,
    ld.created_at AS updated_at, l.borrower_id AS owner_ref
   FROM loan_documents ld LEFT JOIN loans l ON ld.loan_id = l.id
UNION ALL
 SELECT ops_projects.id, 'project'::text AS entity_type,
    COALESCE(ops_projects.project_name,'') || ' ' || COALESCE(ops_projects.description,'') || ' ' || COALESCE(ops_projects.latest_update,'') || ' ' || COALESCE(ops_projects.category,'') || ' ' || COALESCE(ops_projects.owner,'') AS search_text,
    jsonb_build_object('project_name', ops_projects.project_name, 'category', ops_projects.category, 'status', ops_projects.status, 'owner', ops_projects.owner, 'due_date', ops_projects.due_date) AS metadata,
    ops_projects.updated_at, NULL::uuid AS owner_ref
   FROM ops_projects
UNION ALL
 SELECT ops_tasks.id, 'task'::text AS entity_type,
    COALESCE(ops_tasks.title,'') || ' ' || COALESCE(ops_tasks.description,'') || ' ' || COALESCE(ops_tasks.category,'') || ' ' || COALESCE(ops_tasks.assigned_to_name,'') || ' ' || COALESCE(ops_tasks.linked_entity_label,'') AS search_text,
    jsonb_build_object('title', ops_tasks.title, 'status', ops_tasks.status, 'assigned_to_name', ops_tasks.assigned_to_name, 'due_date', ops_tasks.due_date, 'category', ops_tasks.category, 'linked_entity_type', ops_tasks.linked_entity_type, 'linked_entity_label', ops_tasks.linked_entity_label) AS metadata,
    ops_tasks.updated_at, NULL::uuid AS owner_ref
   FROM ops_tasks;

-- 8. Refresh and notify
REFRESH MATERIALIZED VIEW search_index;
NOTIFY pgrst, 'reload schema';
