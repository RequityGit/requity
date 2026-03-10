-- =============================================================================
-- Add user_id to crm_contacts
-- =============================================================================
-- Links a CRM contact record to their portal login (profiles/auth.users).
-- This enables direct contact ↔ user resolution without going through
-- borrowers or investors tables.
-- =============================================================================

-- Add the column
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_id
  ON public.crm_contacts(user_id);

-- Backfill user_id from linked borrowers and investors where possible
UPDATE public.crm_contacts c
SET user_id = b.user_id
FROM public.borrowers b
WHERE c.borrower_id = b.id
  AND b.user_id IS NOT NULL
  AND c.user_id IS NULL;

UPDATE public.crm_contacts c
SET user_id = i.user_id
FROM public.investors i
WHERE c.linked_investor_id = i.id
  AND i.user_id IS NOT NULL
  AND c.user_id IS NULL;

-- Recreate the crm_contacts_active view to include the new column
CREATE OR REPLACE VIEW public.crm_contacts_active AS
SELECT *
FROM public.crm_contacts
WHERE deleted_at IS NULL;
