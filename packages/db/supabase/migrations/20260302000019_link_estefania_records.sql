-- =============================================================================
-- Data: Create borrower + investor records for Estefania and link CRM contact
-- =============================================================================
-- This migration creates the borrower and investor records for Estefania Espinal
-- and links them to her existing CRM contact and user profile.
--
-- NOTE: This is a data migration, not a schema change. It uses actual IDs
-- from the production database.
-- =============================================================================

-- Create borrower record for Estefania (if not already exists)
INSERT INTO public.borrowers (first_name, last_name, email, user_id)
VALUES (
  'Estefania',
  'Espinal',
  'ee@requitygroup.com',
  'f01d02c2-fd86-4a7b-9979-040ff6b0308d'
)
ON CONFLICT DO NOTHING;

-- Create investor record for Estefania (if not already exists)
INSERT INTO public.investors (first_name, last_name, email, user_id)
VALUES (
  'Estefania',
  'Espinal',
  'ee@requitygroup.com',
  'f01d02c2-fd86-4a7b-9979-040ff6b0308d'
)
ON CONFLICT DO NOTHING;

-- Update the CRM contact with all linkages
UPDATE public.crm_contacts
SET
  user_id = 'f01d02c2-fd86-4a7b-9979-040ff6b0308d',
  borrower_id = (
    SELECT id FROM public.borrowers
    WHERE user_id = 'f01d02c2-fd86-4a7b-9979-040ff6b0308d'
    LIMIT 1
  ),
  linked_investor_id = (
    SELECT id FROM public.investors
    WHERE user_id = 'f01d02c2-fd86-4a7b-9979-040ff6b0308d'
    LIMIT 1
  ),
  contact_types = ARRAY['borrower', 'investor'],
  updated_at = now()
WHERE id = '8ecf2089-b439-4104-be33-559c14adbc21';
