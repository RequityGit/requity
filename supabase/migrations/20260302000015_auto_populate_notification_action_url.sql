-- Auto-populate action_url on notifications when not provided.
-- Also backfills existing rows that have entity_type + entity_id but null action_url.

-- 1. Helper function: generate action_url from entity_type + entity_id
--    Returns admin-prefixed URLs; the frontend getNotificationRoute() adapts
--    these to the correct role prefix at render time.
CREATE OR REPLACE FUNCTION public.generate_notification_action_url(
  p_entity_type text,
  p_entity_id uuid
)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_loan_id uuid;
BEGIN
  IF p_entity_type IS NULL OR p_entity_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_entity_type = 'loan' THEN
    RETURN '/admin/loans/' || p_entity_id::text;

  ELSIF p_entity_type = 'borrower' THEN
    RETURN '/admin/borrowers/' || p_entity_id::text;

  ELSIF p_entity_type = 'investor' THEN
    RETURN '/admin/investors/' || p_entity_id::text;

  ELSIF p_entity_type = 'fund' THEN
    RETURN '/admin/funds/' || p_entity_id::text;

  ELSIF p_entity_type = 'condition' THEN
    -- Resolve the parent loan for a richer URL
    SELECT loan_id INTO v_loan_id
    FROM public.loan_conditions
    WHERE id = p_entity_id
    LIMIT 1;

    IF v_loan_id IS NOT NULL THEN
      RETURN '/admin/loans/' || v_loan_id::text || '?condition=' || p_entity_id::text;
    END IF;
    RETURN '/admin/conditions';

  ELSIF p_entity_type = 'draw_request' THEN
    RETURN '/admin/servicing';

  ELSIF p_entity_type = 'payment' THEN
    RETURN '/admin/servicing';

  ELSIF p_entity_type IN ('task', 'project') THEN
    RETURN '/admin/operations';

  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- 2. Trigger function: auto-set action_url on INSERT when null
CREATE OR REPLACE FUNCTION public.set_notification_action_url()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.action_url IS NULL AND NEW.entity_type IS NOT NULL AND NEW.entity_id IS NOT NULL THEN
    NEW.action_url := public.generate_notification_action_url(NEW.entity_type, NEW.entity_id::uuid);
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Attach trigger (BEFORE INSERT so it fills the column before the row is written)
DROP TRIGGER IF EXISTS trg_set_notification_action_url ON public.notifications;
CREATE TRIGGER trg_set_notification_action_url
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_notification_action_url();

-- 4. Backfill existing notifications that have entity data but null action_url
UPDATE public.notifications
SET action_url = public.generate_notification_action_url(entity_type, entity_id::uuid)
WHERE action_url IS NULL
  AND entity_type IS NOT NULL
  AND entity_id IS NOT NULL;
