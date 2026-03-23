-- Fix: Notification body stores raw @[Name](uuid) mention markup which
-- appears in email notifications as ugly raw text. Strip it to @Name
-- before storing in the body column. The in-app notification list already
-- calls stripMentionMarkup() on the client, but emails and any other
-- consumers of the body column should not need to know about this format.
--
-- Affects three trigger functions:
--   1. handle_note_mention_notification()   (notes with @mentions)
--   2. handle_task_comment_notification()    (task comment notifications)
--   3. handle_comment_mention_notification() (loan/condition comment mentions)

-- ============================================================
-- Helper: strip @[Display Name](uuid) -> @Display Name
-- ============================================================
CREATE OR REPLACE FUNCTION public.strip_mention_markup(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(input, '@\[([^\]]+)\]\([a-f0-9-]+\)', '@\1', 'g');
$$;

-- ============================================================
-- 1. Fix handle_note_mention_notification()
-- ============================================================
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
        strip_mention_markup(left(NEW.body, 200)),
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

-- ============================================================
-- 2. Fix handle_task_comment_notification()
-- ============================================================
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
  v_body_text := strip_mention_markup(left(NEW.body, 200));

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

-- ============================================================
-- 3. Fix handle_comment_mention_notification()
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_comment_mention_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_uid uuid;
  v_loan_number text;
  v_condition_name text;
  v_condition_id uuid;
  v_comment_type text;
  v_notification_slug text;
  v_title text;
  v_body text;
  v_action_url text;
  v_entity_type text;
  v_entity_id uuid;
  v_entity_label text;
  v_notification_type_id uuid;
BEGIN
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'loan_comments' THEN
    v_comment_type := 'loan';
    v_notification_slug := 'loan_comment_mention';
    v_entity_type := 'loan';
    v_entity_id := NEW.loan_id;
    SELECT loan_number INTO v_loan_number FROM public.loans WHERE id = NEW.loan_id;
    v_entity_label := COALESCE(v_loan_number, 'Loan');
    v_title := COALESCE(NEW.author_name, 'Someone') || ' mentioned you in a comment on ' || COALESCE(v_loan_number, 'a loan');
    v_body := strip_mention_markup(left(NEW.comment, 200));
    v_action_url := '/admin/loans/' || NEW.loan_id::text;
  ELSIF TG_TABLE_NAME = 'loan_condition_comments' THEN
    v_comment_type := 'condition';
    v_notification_slug := 'condition_comment_mention';
    v_entity_type := 'condition';
    v_condition_id := NEW.condition_id;
    v_entity_id := v_condition_id;
    SELECT loan_number INTO v_loan_number FROM public.loans WHERE id = NEW.loan_id;
    SELECT condition_name INTO v_condition_name FROM public.loan_conditions WHERE id = v_condition_id;
    v_entity_label := COALESCE(v_condition_name, 'Condition');
    v_title := COALESCE(NEW.author_name, 'Someone') || ' mentioned you in a condition comment on ' || COALESCE(v_loan_number, 'a loan');
    v_body := strip_mention_markup(left(NEW.comment, 200));
    v_action_url := '/admin/loans/' || NEW.loan_id::text || '?condition=' || v_condition_id::text;
  ELSE
    RETURN NEW;
  END IF;

  SELECT id INTO v_notification_type_id FROM public.notification_types WHERE slug = v_notification_slug LIMIT 1;

  FOREACH mentioned_uid IN ARRAY NEW.mentions
  LOOP
    INSERT INTO public.notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, is_read, is_archived, email_sent
    ) VALUES (
      gen_random_uuid(), mentioned_uid, v_notification_type_id, v_notification_slug,
      v_title, v_body, 'normal', v_entity_type, v_entity_id, v_entity_label,
      v_action_url, false, false, false
    );

    INSERT INTO public.comment_mentions (
      comment_type, comment_id, mentioned_user_id, loan_id,
      condition_id, notification_sent
    ) VALUES (
      v_comment_type, NEW.id, mentioned_uid, NEW.loan_id,
      v_condition_id,
      true
    );
  END LOOP;

  RETURN NEW;
END;
$$;
