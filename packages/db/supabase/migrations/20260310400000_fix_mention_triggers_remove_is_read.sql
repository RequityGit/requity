-- Fix: handle_note_mention_notification() and handle_comment_mention_notification()
-- both INSERT into notifications with is_read and is_archived columns that were
-- dropped in migration 20260305500000_notifications_active_archived_model.sql.
-- This migration recreates both functions with corrected INSERT statements.

-- ============================================================
-- 1. Fix handle_note_mention_notification()
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_note_mention_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_uid uuid;
  v_notification_slug text := 'note_mention';
  v_notification_type_id uuid;
  v_title text;
  v_body text;
  v_action_url text;
  v_entity_type text;
  v_entity_id uuid;
  v_entity_label text;
  v_label_name text;
BEGIN
  -- Skip if no mentions
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up notification type
  SELECT id INTO v_notification_type_id
  FROM public.notification_types
  WHERE slug = v_notification_slug
  LIMIT 1;

  -- Determine entity context from the note's FK columns (first match wins)
  IF NEW.contact_id IS NOT NULL THEN
    v_entity_type := 'contact';
    v_entity_id := NEW.contact_id;
    SELECT COALESCE(first_name || ' ' || last_name, first_name, last_name, 'a contact')
      INTO v_label_name
      FROM public.crm_contacts WHERE id = NEW.contact_id;
    v_entity_label := COALESCE(v_label_name, 'Contact');
    v_action_url := '/admin/crm/' || NEW.contact_id::text || '?tab=notes';

  ELSIF NEW.company_id IS NOT NULL THEN
    v_entity_type := 'company';
    v_entity_id := NEW.company_id;
    SELECT name INTO v_label_name FROM public.crm_companies WHERE id = NEW.company_id;
    v_entity_label := COALESCE(v_label_name, 'Company');
    v_action_url := '/admin/crm/companies/' || NEW.company_id::text || '?tab=notes';

  ELSIF NEW.deal_id IS NOT NULL THEN
    v_entity_type := 'loan';
    v_entity_id := NEW.deal_id;
    SELECT deal_name INTO v_label_name FROM public.unified_deals WHERE id = NEW.deal_id;
    v_entity_label := COALESCE(v_label_name, 'Deal');
    v_action_url := '/admin/pipeline-v2/' || NEW.deal_id::text || '?tab=notes';

  ELSIF NEW.loan_id IS NOT NULL THEN
    v_entity_type := 'loan';
    v_entity_id := NEW.loan_id;
    SELECT loan_number INTO v_label_name FROM public.loans WHERE id = NEW.loan_id;
    v_entity_label := COALESCE(v_label_name, 'Loan');
    v_action_url := '/admin/servicing/' || NEW.loan_id::text || '?tab=notes';

  ELSIF NEW.opportunity_id IS NOT NULL THEN
    v_entity_type := 'loan';
    v_entity_id := NEW.opportunity_id;
    v_entity_label := 'Opportunity';
    v_action_url := '/admin/pipeline-v2/' || NEW.opportunity_id::text || '?tab=notes';

  ELSIF NEW.task_id IS NOT NULL THEN
    v_entity_type := 'task';
    v_entity_id := NEW.task_id;
    v_entity_label := 'Task';
    v_action_url := '/admin/operations?task=' || NEW.task_id::text;

  ELSIF NEW.project_id IS NOT NULL THEN
    v_entity_type := 'project';
    v_entity_id := NEW.project_id;
    v_entity_label := 'Project';
    v_action_url := '/admin/operations?project=' || NEW.project_id::text;

  ELSIF NEW.approval_id IS NOT NULL THEN
    v_entity_type := 'task';
    v_entity_id := NEW.approval_id;
    v_entity_label := 'Approval';
    v_action_url := '/admin/operations';

  ELSIF NEW.condition_id IS NOT NULL THEN
    v_entity_type := 'condition';
    v_entity_id := NEW.condition_id;
    v_entity_label := 'Condition';
    v_action_url := '/admin/servicing/' || COALESCE(NEW.loan_id::text, '') || '?condition=' || NEW.condition_id::text;

  ELSIF NEW.unified_condition_id IS NOT NULL THEN
    v_entity_type := 'condition';
    v_entity_id := NEW.unified_condition_id;
    v_entity_label := 'Condition';
    v_action_url := '/admin/pipeline-v2/' || COALESCE(NEW.deal_id::text, '') || '?condition=' || NEW.unified_condition_id::text;

  ELSE
    -- No recognizable entity, still create notification but with minimal context
    v_entity_type := NULL;
    v_entity_id := NULL;
    v_entity_label := NULL;
    v_action_url := NULL;
  END IF;

  -- Build title
  v_title := COALESCE(NEW.author_name, 'Someone') || ' mentioned you in a note';
  IF v_entity_label IS NOT NULL THEN
    v_title := v_title || ' on ' || v_entity_label;
  END IF;

  -- Body is a preview of the note content
  v_body := left(NEW.body, 200);

  -- Create a notification for each mentioned user
  FOREACH mentioned_uid IN ARRAY NEW.mentions
  LOOP
    -- Self-mentions allowed (consistent with loan comment trigger)
    INSERT INTO public.notifications (
      id, user_id, notification_type_id, notification_slug,
      title, body, priority, entity_type, entity_id, entity_label,
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), mentioned_uid, v_notification_type_id, v_notification_slug,
      v_title, v_body, 'normal',
      v_entity_type, v_entity_id, v_entity_label,
      v_action_url, false
    );
  END LOOP;

  -- Mark note_mentions as notification_sent
  UPDATE public.note_mentions
  SET notification_sent = true
  WHERE note_id = NEW.id
    AND notification_sent IS DISTINCT FROM true;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Fix handle_comment_mention_notification()
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
      action_url, email_sent
    ) VALUES (
      gen_random_uuid(), mentioned_uid, v_notification_type_id, v_notification_slug,
      v_title, v_body, 'normal', v_entity_type, v_entity_id, v_entity_label,
      v_action_url, false
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
