-- =============================================================================
-- Fix CRM Contacts: RLS Policies + Auto-Sync Triggers
-- =============================================================================
-- Fixes three data integrity issues:
--   1. RLS policies used profiles.role = 'admin' instead of is_admin()
--   2. No ongoing sync — investors/borrowers added after initial migration
--      would never appear in CRM
--   3. Re-syncs any investors/borrowers that are currently missing
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. FIX RLS POLICIES — use is_admin() instead of profiles.role check
-- ---------------------------------------------------------------------------

-- Drop old policies that check profiles.role directly
DROP POLICY IF EXISTS "Admins can select crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Admins can insert crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Admins can update crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Admins can delete crm_contacts" ON public.crm_contacts;

DROP POLICY IF EXISTS "Admins can select crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Admins can insert crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Admins can update crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Admins can delete crm_activities" ON public.crm_activities;

-- Recreate with is_admin() which checks user_roles table
CREATE POLICY "Admins can select crm_contacts"
  ON public.crm_contacts FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert crm_contacts"
  ON public.crm_contacts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update crm_contacts"
  ON public.crm_contacts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete crm_contacts"
  ON public.crm_contacts FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can select crm_activities"
  ON public.crm_activities FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert crm_activities"
  ON public.crm_activities FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update crm_activities"
  ON public.crm_activities FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete crm_activities"
  ON public.crm_activities FOR DELETE
  TO authenticated
  USING (is_admin());


-- ---------------------------------------------------------------------------
-- 2. CREATE SYNC TRIGGERS — auto-create/update CRM contacts when
--    investors or borrowers are inserted or updated
-- ---------------------------------------------------------------------------

-- Trigger function: sync investor → crm_contacts
CREATE OR REPLACE FUNCTION public.sync_investor_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: create a CRM contact if one doesn't already exist
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_contacts (
      first_name, last_name, email, phone, contact_type, status,
      linked_investor_id, notes
    )
    VALUES (
      NEW.first_name, NEW.last_name, NEW.email, NEW.phone,
      'investor'::crm_contact_type, 'active'::crm_contact_status,
      NEW.id, 'Auto-synced from investors table'
    )
    ON CONFLICT DO NOTHING;

  -- On UPDATE: update the matching CRM contact
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.crm_contacts
    SET
      first_name = NEW.first_name,
      last_name = NEW.last_name,
      email = NEW.email,
      phone = NEW.phone,
      updated_at = now()
    WHERE linked_investor_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function: sync borrower → crm_contacts
CREATE OR REPLACE FUNCTION public.sync_borrower_to_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: create a CRM contact if one doesn't already exist
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_contacts (
      first_name, last_name, email, phone, contact_type, status,
      borrower_id, notes
    )
    VALUES (
      NEW.first_name, NEW.last_name, NEW.email, NEW.phone,
      'borrower'::crm_contact_type, 'active'::crm_contact_status,
      NEW.id, 'Auto-synced from borrowers table'
    )
    ON CONFLICT DO NOTHING;

  -- On UPDATE: update the matching CRM contact
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.crm_contacts
    SET
      first_name = NEW.first_name,
      last_name = NEW.last_name,
      email = NEW.email,
      phone = NEW.phone,
      updated_at = now()
    WHERE borrower_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers
DROP TRIGGER IF EXISTS trg_sync_investor_to_crm ON public.investors;
CREATE TRIGGER trg_sync_investor_to_crm
  AFTER INSERT OR UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION public.sync_investor_to_crm();

DROP TRIGGER IF EXISTS trg_sync_borrower_to_crm ON public.borrowers;
CREATE TRIGGER trg_sync_borrower_to_crm
  AFTER INSERT OR UPDATE ON public.borrowers
  FOR EACH ROW EXECUTE FUNCTION public.sync_borrower_to_crm();


-- ---------------------------------------------------------------------------
-- 3. RE-SYNC — insert any missing investors/borrowers into crm_contacts
-- ---------------------------------------------------------------------------

-- Sync investors that are missing from crm_contacts
INSERT INTO public.crm_contacts (
  first_name, last_name, email, phone, contact_type, status,
  linked_investor_id, notes
)
SELECT
  i.first_name, i.last_name, i.email, i.phone,
  'investor'::crm_contact_type, 'active'::crm_contact_status,
  i.id, 'Auto-synced from investors table'
FROM public.investors i
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_contacts c
  WHERE c.linked_investor_id = i.id
)
AND i.first_name IS NOT NULL
AND i.last_name IS NOT NULL;

-- Sync borrowers that are missing from crm_contacts
INSERT INTO public.crm_contacts (
  first_name, last_name, email, phone, contact_type, status,
  borrower_id, notes
)
SELECT
  b.first_name, b.last_name, b.email, b.phone,
  'borrower'::crm_contact_type, 'active'::crm_contact_status,
  b.id, 'Auto-synced from borrowers table'
FROM public.borrowers b
WHERE NOT EXISTS (
  SELECT 1 FROM public.crm_contacts c
  WHERE c.borrower_id = b.id
)
AND b.first_name IS NOT NULL
AND b.last_name IS NOT NULL;
