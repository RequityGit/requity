-- =============================================================================
-- Create link_contact_to_user(contact_email text) function
-- =============================================================================
-- Finds matching profiles and crm_contacts by email and links them.
-- Sets crm_contacts.user_id to the matching profile's id.
-- Returns the linked records for verification.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.link_contact_to_user(contact_email text)
RETURNS TABLE (
  contact_id uuid,
  contact_name text,
  profile_id uuid,
  profile_email text,
  already_linked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH matched AS (
    SELECT
      c.id AS c_id,
      (c.first_name || ' ' || c.last_name) AS c_name,
      p.id AS p_id,
      p.email AS p_email,
      (c.user_id IS NOT NULL) AS was_linked
    FROM public.crm_contacts c
    INNER JOIN public.profiles p
      ON lower(c.email) = lower(p.email)
    WHERE lower(c.email) = lower(contact_email)
      AND c.deleted_at IS NULL
  ),
  updated AS (
    UPDATE public.crm_contacts c
    SET
      user_id = m.p_id,
      updated_at = now()
    FROM matched m
    WHERE c.id = m.c_id
      AND c.user_id IS NULL
    RETURNING c.id
  )
  SELECT
    m.c_id AS contact_id,
    m.c_name AS contact_name,
    m.p_id AS profile_id,
    m.p_email AS profile_email,
    m.was_linked AS already_linked
  FROM matched m;
END;
$$;

COMMENT ON FUNCTION public.link_contact_to_user(text)
  IS 'Links crm_contacts to profiles by matching email. Sets user_id on contacts. Returns linked records for verification.';
