-- Fix: NEW.condition_id reference in SQL CASE expression causes
-- "record 'new' has no field 'condition_id'" when trigger fires
-- from loan_comments table (which has no condition_id column).
-- Solution: use PL/pgSQL variable v_condition_id to avoid cross-table field reference.

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
    v_body := left(NEW.comment, 200);
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
    v_body := left(NEW.comment, 200);
    v_action_url := '/admin/loans/' || NEW.loan_id::text || '?condition=' || v_condition_id::text;
  ELSE
    RETURN NEW;
  END IF;

  SELECT id INTO v_notification_type_id FROM public.notification_types WHERE slug = v_notification_slug LIMIT 1;

  FOREACH mentioned_uid IN ARRAY NEW.mentions
  LOOP
    -- Allow self-mentions so users can tag themselves for testing and bookmarking

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
