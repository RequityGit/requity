-- ============================================================
-- Remove priority from ops_tasks, ops_projects, and
-- recurring_task_templates. Priority is unnecessary clutter.
-- Notification triggers that referenced task.priority now
-- default to 'normal'.
-- ============================================================

-- 1. Drop CHECK constraints first
ALTER TABLE ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_priority_check;
ALTER TABLE ops_projects DROP CONSTRAINT IF EXISTS ops_projects_priority_check;

-- 2. Drop priority columns
ALTER TABLE ops_tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE ops_projects DROP COLUMN IF EXISTS priority;
ALTER TABLE recurring_task_templates DROP COLUMN IF EXISTS priority;

-- 3. Rebuild generate_next_recurring_task RPC without priority
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

-- 4c. Task assignment notification
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
