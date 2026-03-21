-- ============================================================
-- Add notification types for task events and DB trigger for
-- status change notifications
-- ============================================================

-- 1. Add missing notification types
INSERT INTO notification_types (
  id, slug, display_name, description, category,
  default_email_enabled, default_in_app_enabled,
  applicable_roles, default_priority,
  email_subject_template, email_body_template,
  is_active, sort_order
) VALUES
  (
    gen_random_uuid(),
    'task_comment',
    'Task Comment',
    'Someone commented on a task you are assigned to or watching',
    'operations',
    true, true,
    ARRAY['admin', 'super_admin'],
    'normal',
    '{{author_name}} commented on "{{task_title}}"',
    '{{comment_preview}}',
    true, 30
  ),
  (
    gen_random_uuid(),
    'task_status_changed',
    'Task Status Changed',
    'A task you are assigned to or watching changed status',
    'operations',
    false, true,
    ARRAY['admin', 'super_admin'],
    'normal',
    'Task status changed: "{{task_title}}"',
    'Status changed from {{old_status}} to {{new_status}}',
    true, 31
  ),
  (
    gen_random_uuid(),
    'task_overdue',
    'Task Overdue',
    'A task assigned to you is past its due date',
    'operations',
    true, true,
    ARRAY['admin', 'super_admin'],
    'high',
    'Task overdue: "{{task_title}}"',
    'This task was due on {{due_date}} and is now overdue.',
    true, 32
  )
ON CONFLICT (slug) DO NOTHING;

-- 2. Trigger function: notify assignee + creator on status change
CREATE OR REPLACE FUNCTION handle_task_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_type_id UUID;
  v_actor_name TEXT;
  v_actor_id UUID;
  v_title_text TEXT;
  v_body_text TEXT;
  v_recipient UUID;
BEGIN
  -- Only fire on UPDATE when status actually changes
  IF TG_OP != 'UPDATE' THEN RETURN NEW; END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  -- Determine who made the change (current auth user)
  v_actor_id := (SELECT auth.uid());

  -- Look up notification type
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE slug = 'task_status_changed'
  LIMIT 1;

  -- Get actor name
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
      CASE WHEN NEW.priority = 'High' THEN 'high' ELSE 'normal' END,
      'task', NEW.id, NEW.title, '/tasks?task=' || NEW.id, false
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
      CASE WHEN NEW.priority = 'High' THEN 'high' ELSE 'normal' END,
      'task', NEW.id, NEW.title, '/tasks?task=' || NEW.id, false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists to make idempotent)
DROP TRIGGER IF EXISTS trg_task_status_change_notification ON ops_tasks;
CREATE TRIGGER trg_task_status_change_notification
  AFTER UPDATE OF status ON ops_tasks
  FOR EACH ROW EXECUTE FUNCTION handle_task_status_change_notification();

-- 3. Trigger function: notify assignee + creator when a note is added to a task
-- This fires on INSERT into notes when task_id is set
CREATE OR REPLACE FUNCTION handle_task_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_type_id UUID;
  v_author_name TEXT;
  v_task RECORD;
  v_title_text TEXT;
  v_body_text TEXT;
  v_recipient UUID;
BEGIN
  -- Only fire for task notes
  IF NEW.task_id IS NULL THEN RETURN NEW; END IF;

  -- Look up notification type
  SELECT id INTO v_notification_type_id
  FROM notification_types WHERE slug = 'task_comment' LIMIT 1;

  -- Get author name
  SELECT COALESCE(full_name, email, 'Someone') INTO v_author_name
  FROM profiles WHERE id = NEW.author_id LIMIT 1;
  IF v_author_name IS NULL THEN v_author_name := 'Someone'; END IF;

  -- Get task details
  SELECT id, title, assigned_to, created_by, priority
  INTO v_task
  FROM ops_tasks WHERE id = NEW.task_id LIMIT 1;

  IF v_task.id IS NULL THEN RETURN NEW; END IF;

  v_title_text := v_author_name || ' commented on "' || left(v_task.title, 60) || '"';
  v_body_text := left(NEW.body, 200);

  -- Notify assignee (if not the comment author)
  IF v_task.assigned_to IS NOT NULL AND v_task.assigned_to != NEW.author_id THEN
    INSERT INTO notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), v_task.assigned_to, v_notification_type_id,
      'task_comment', v_title_text, v_body_text,
      CASE WHEN v_task.priority = 'High' THEN 'high' ELSE 'normal' END,
      'task', v_task.id, v_task.title, '/tasks?task=' || v_task.id, false
    );
  END IF;

  -- Notify creator (if different from assignee and comment author)
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
      CASE WHEN v_task.priority = 'High' THEN 'high' ELSE 'normal' END,
      'task', v_task.id, v_task.title, '/tasks?task=' || v_task.id, false
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_task_comment_notification ON notes;
CREATE TRIGGER trg_task_comment_notification
  AFTER INSERT ON notes
  FOR EACH ROW EXECUTE FUNCTION handle_task_comment_notification();
