-- =============================================================================
-- Update sync triggers to populate contact_types and user_id
-- =============================================================================
-- Updates the existing investor and borrower sync triggers to:
--   1. Set contact_types array in addition to legacy contact_type
--   2. Set user_id from the borrower/investor's user_id
-- =============================================================================

-- Updated trigger function: sync investor → crm_contacts
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
      first_name, last_name, email, phone,
      contact_type, contact_types, status,
      linked_investor_id, user_id, notes
    )
    VALUES (
      NEW.first_name, NEW.last_name, NEW.email, NEW.phone,
      'investor'::crm_contact_type, ARRAY['investor'],
      'active'::crm_contact_status,
      NEW.id, NEW.user_id, 'Auto-synced from investors table'
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
      user_id = COALESCE(crm_contacts.user_id, NEW.user_id),
      updated_at = now()
    WHERE linked_investor_id = NEW.id;

    -- Ensure 'investor' is in contact_types
    UPDATE public.crm_contacts
    SET contact_types = contact_types || ARRAY['investor']
    WHERE linked_investor_id = NEW.id
      AND NOT ('investor' = ANY(contact_types));
  END IF;

  RETURN NEW;
END;
$$;

-- Updated trigger function: sync borrower → crm_contacts
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
      first_name, last_name, email, phone,
      contact_type, contact_types, status,
      borrower_id, user_id, notes
    )
    VALUES (
      NEW.first_name, NEW.last_name, NEW.email, NEW.phone,
      'borrower'::crm_contact_type, ARRAY['borrower'],
      'active'::crm_contact_status,
      NEW.id, NEW.user_id, 'Auto-synced from borrowers table'
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
      user_id = COALESCE(crm_contacts.user_id, NEW.user_id),
      updated_at = now()
    WHERE borrower_id = NEW.id;

    -- Ensure 'borrower' is in contact_types
    UPDATE public.crm_contacts
    SET contact_types = contact_types || ARRAY['borrower']
    WHERE borrower_id = NEW.id
      AND NOT ('borrower' = ANY(contact_types));
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers are already attached (from migration 20250315); no need to recreate them
-- since CREATE OR REPLACE FUNCTION updates the function body in place.
