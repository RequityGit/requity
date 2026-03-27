-- Fix: Add 'system' (plus 'text_message', 'deal_update') to crm_activities activity_type CHECK constraint
-- and backfill system activities for existing form-sourced soft commitments.
--
-- Root cause: PR #878 inserted activity_type='system' but the CHECK constraint rejected it silently.

-- 1. Drop and recreate the CHECK constraint to include system, text_message, deal_update
ALTER TABLE public.crm_activities DROP CONSTRAINT IF EXISTS crm_activities_activity_type_check;
ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_activity_type_check
  CHECK (activity_type = ANY (ARRAY[
    'call','email','meeting','note','follow_up','status_change','conversion',
    'system','text_message','deal_update'
  ]));

-- 2. Backfill "Soft commitment placed" for every form-sourced soft commitment with a contact_id
INSERT INTO crm_activities (contact_id, activity_type, subject, description, performed_by_name, metadata, created_at)
SELECT
  sc.contact_id,
  'system',
  'Soft commitment placed',
  'Placed a $' || trim(to_char(sc.commitment_amount, 'FM999,999,999')) || ' soft commitment via investment form.',
  'System',
  jsonb_build_object('soft_commitment_id', sc.id),
  sc.created_at
FROM soft_commitments sc
WHERE sc.contact_id IS NOT NULL
  AND sc.source = 'form'
  AND NOT EXISTS (
    SELECT 1 FROM crm_activities ca
    WHERE ca.contact_id = sc.contact_id
      AND ca.activity_type = 'system'
      AND ca.subject = 'Soft commitment placed'
      AND ca.metadata->>'soft_commitment_id' = sc.id::text
  );

-- 3. Backfill "Contact created" for contacts created via form submission
--    (contact created_at within 5 seconds of a form-sourced soft commitment)
INSERT INTO crm_activities (contact_id, activity_type, subject, description, performed_by_name, created_at)
SELECT DISTINCT ON (c.id)
  c.id,
  'system',
  'Contact created',
  'Contact was created via Soft Commitment Form submission.',
  'System',
  c.created_at
FROM crm_contacts c
JOIN soft_commitments sc ON sc.contact_id = c.id AND sc.source = 'form'
WHERE ABS(EXTRACT(EPOCH FROM (c.created_at - sc.created_at))) < 5
  AND NOT EXISTS (
    SELECT 1 FROM crm_activities ca
    WHERE ca.contact_id = c.id
      AND ca.activity_type = 'system'
      AND ca.subject = 'Contact created'
  )
ORDER BY c.id, sc.created_at ASC;
