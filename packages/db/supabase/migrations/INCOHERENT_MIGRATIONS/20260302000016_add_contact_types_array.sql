-- =============================================================================
-- Add contact_types text[] array column to crm_contacts
-- =============================================================================
-- Replaces the single-value contact_type enum with a multi-value array,
-- allowing a contact to be both a borrower AND an investor simultaneously.
-- The old contact_type column is kept for backward compatibility but deprecated.
-- =============================================================================

-- Add the new array column
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS contact_types text[] NOT NULL DEFAULT '{}';

-- Migrate existing contact_type values into the new array column
UPDATE public.crm_contacts
SET contact_types = ARRAY[contact_type::text]
WHERE contact_type IS NOT NULL
  AND (contact_types IS NULL OR contact_types = '{}');

-- For contacts linked to both borrower and investor, ensure both types are present
UPDATE public.crm_contacts
SET contact_types = ARRAY(
  SELECT DISTINCT unnest
  FROM unnest(contact_types || ARRAY['borrower']) AS unnest
)
WHERE borrower_id IS NOT NULL
  AND NOT ('borrower' = ANY(contact_types));

UPDATE public.crm_contacts
SET contact_types = ARRAY(
  SELECT DISTINCT unnest
  FROM unnest(contact_types || ARRAY['investor']) AS unnest
)
WHERE linked_investor_id IS NOT NULL
  AND NOT ('investor' = ANY(contact_types));

-- Index for array contains queries (GIN)
CREATE INDEX IF NOT EXISTS idx_crm_contacts_contact_types
  ON public.crm_contacts USING GIN (contact_types);

-- Mark old column as deprecated
COMMENT ON COLUMN public.crm_contacts.contact_type
  IS 'DEPRECATED — use contact_types text[] array instead. Kept for backward compatibility.';

COMMENT ON COLUMN public.crm_contacts.contact_types
  IS 'Array of contact type labels (e.g., borrower, investor, lead, vendor). Replaces single contact_type enum.';

-- Recreate the view to pick up the new column
CREATE OR REPLACE VIEW public.crm_contacts_active AS
SELECT *
FROM public.crm_contacts
WHERE deleted_at IS NULL;
