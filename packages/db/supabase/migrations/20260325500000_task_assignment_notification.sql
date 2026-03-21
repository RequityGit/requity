-- ============================================================
-- Trigger: Send notification when a task is assigned to someone
-- Fires on INSERT or UPDATE of ops_tasks when assigned_to changes
-- ============================================================

-- First, insert the notification type if it doesn't exist
INSERT INTO notification_types (id, slug, label, description, default_channel, is_active)
VALUES (
  gen_random_uuid(),
  'task-assigned',
  'Task Assigned',
  'When a task is assigned to you',
  'in_app',
  true
)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION handle_task_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_type_id UUID;
  v_creator_name TEXT;
  v_title_text TEXT;
BEGIN
  -- Only fire when assigned_to is set and is different from before (or is new)
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if assigned_to didn't change on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
    RETURN NEW;
  END IF;

  -- Don't notify if assigning to yourself
  IF NEW.assigned_to = COALESCE(NEW.created_by, (SELECT auth.uid())) THEN
    RETURN NEW;
  END IF;

  -- Look up notification type
  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE slug = 'task-assigned'
  LIMIT 1;

  -- Get the name of the person who created/assigned the task
  SELECT COALESCE(full_name, email, 'Someone') INTO v_creator_name
  FROM profiles
  WHERE id = COALESCE(NEW.created_by, (SELECT auth.uid()))
  LIMIT 1;

  IF v_creator_name IS NULL THEN
    v_creator_name := 'Someone';
  END IF;

  v_title_text := v_creator_name || ' assigned you a task: "' || left(NEW.title, 80) || '"';

  INSERT INTO notifications (
    id, user_id, notification_type_id, notification_slug,
    title, body, priority, entity_type, entity_id, entity_label,
    action_url, email_sent
  ) VALUES (
    gen_random_uuid(),
    NEW.assigned_to,
    v_notification_type_id,
    'task-assigned',
    v_title_text,
    COALESCE(left(NEW.description, 200), ''),
    CASE WHEN NEW.priority = 'High' THEN 'high' ELSE 'normal' END,
    'task',
    NEW.id,
    NEW.title,
    '/tasks',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_task_assignment_notification
  AFTER INSERT OR UPDATE OF assigned_to ON ops_tasks
  FOR EACH ROW EXECUTE FUNCTION handle_task_assignment_notification();
