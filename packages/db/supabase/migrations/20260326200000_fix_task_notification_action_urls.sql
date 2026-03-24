-- ============================================================
-- Fix: Task notification action_url should include the task ID
-- so email "View in Portal" links open the specific task
-- ============================================================

-- 1. Fix the task assignment trigger to include task ID in action_url
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
    '/tasks?task=' || NEW.id::text,
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix the note mention trigger to use correct task URL
-- (previous migrations used /admin/operations?task= which is the old route)
CREATE OR REPLACE FUNCTION handle_note_mention_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_mentioned_id UUID;
  v_author_name TEXT;
  v_entity_type TEXT;
  v_entity_id UUID;
  v_entity_label TEXT;
  v_action_url TEXT;
  v_notification_type_id UUID;
BEGIN
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Someone') INTO v_author_name
  FROM profiles WHERE id = NEW.author_id LIMIT 1;

  -- Determine entity context
  IF NEW.task_id IS NOT NULL THEN
    v_entity_type := 'task';
    v_entity_id := NEW.task_id;
    SELECT title INTO v_entity_label FROM ops_tasks WHERE id = NEW.task_id LIMIT 1;
    v_action_url := '/tasks?task=' || NEW.task_id::text;
  ELSIF NEW.deal_id IS NOT NULL THEN
    v_entity_type := 'loan';
    v_entity_id := NEW.deal_id;
    v_action_url := '/pipeline/' || NEW.deal_id::text || '?tab=notes';
  ELSIF NEW.loan_id IS NOT NULL THEN
    v_entity_type := 'loan';
    v_entity_id := NEW.loan_id;
    v_action_url := '/pipeline/' || NEW.loan_id::text || '?tab=notes';
  ELSIF NEW.contact_id IS NOT NULL THEN
    v_entity_type := 'contact';
    v_entity_id := NEW.contact_id;
    v_action_url := '/contacts/' || NEW.contact_id::text || '?tab=notes';
  ELSIF NEW.company_id IS NOT NULL THEN
    v_entity_type := 'company';
    v_entity_id := NEW.company_id;
    v_action_url := '/companies/' || NEW.company_id::text || '?tab=notes';
  ELSE
    RETURN NEW;
  END IF;

  SELECT id INTO v_notification_type_id
  FROM notification_types
  WHERE slug = 'note_mention'
  LIMIT 1;

  FOREACH v_mentioned_id IN ARRAY NEW.mentions
  LOOP
    IF v_mentioned_id != NEW.author_id THEN
      INSERT INTO notifications (
        id, user_id, notification_type_id, notification_slug,
        title, body, priority, entity_type, entity_id, entity_label,
        action_url, email_sent
      ) VALUES (
        gen_random_uuid(),
        v_mentioned_id,
        v_notification_type_id,
        'note_mention',
        v_author_name || ' mentioned you in a note',
        left(NEW.body, 200),
        'normal',
        v_entity_type,
        v_entity_id,
        v_entity_label,
        v_action_url,
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill: Fix existing task notifications that have action_url = '/tasks'
-- so they link to the correct task when clicked from email history
UPDATE notifications
SET action_url = '/tasks?task=' || entity_id::text
WHERE entity_type = 'task'
  AND entity_id IS NOT NULL
  AND (action_url = '/tasks' OR action_url LIKE '/admin/operations%');
