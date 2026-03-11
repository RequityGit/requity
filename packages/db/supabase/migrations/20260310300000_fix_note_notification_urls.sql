-- Fix incorrect action_url values in the note-mention notification trigger.
-- The previous trigger used /admin/pipeline/{id} and /admin/loans/{id} which
-- do not exist. The correct routes are:
--   Deals/opportunities -> /admin/pipeline-v2/{id}?tab=notes
--   Funded loans        -> /admin/servicing/{id}?tab=notes
--   Conditions (loan)   -> /admin/servicing/{loanId}?condition={id}
--   Conditions (deal)   -> /admin/pipeline-v2/{dealId}?condition={id}

-- 1. Update the trigger function with corrected URLs
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
      action_url, is_read, is_archived, email_sent
    ) VALUES (
      gen_random_uuid(), mentioned_uid, v_notification_type_id, v_notification_slug,
      v_title, v_body, 'normal',
      v_entity_type, v_entity_id, v_entity_label,
      v_action_url, false, false, false
    );
  END LOOP;

  -- Mark note_mentions as notification_sent (they may be inserted after
  -- this trigger fires, but for rows that already exist this is useful)
  UPDATE public.note_mentions
  SET notification_sent = true
  WHERE note_id = NEW.id
    AND notification_sent IS DISTINCT FROM true;

  RETURN NEW;
END;
$$;

-- 2. Fix existing notification rows that have stale action_url values
UPDATE public.notifications
SET action_url = replace(action_url, '/admin/pipeline/', '/admin/pipeline-v2/')
WHERE action_url LIKE '/admin/pipeline/%'
  AND notification_slug = 'note_mention';

UPDATE public.notifications
SET action_url = replace(action_url, '/admin/loans/', '/admin/servicing/')
WHERE action_url LIKE '/admin/loans/%'
  AND notification_slug = 'note_mention';
