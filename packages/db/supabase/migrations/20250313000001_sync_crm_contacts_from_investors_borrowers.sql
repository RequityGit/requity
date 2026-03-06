-- Sync existing investors into crm_contacts (skip those already linked)
INSERT INTO crm_contacts (
  first_name,
  last_name,
  email,
  phone,
  contact_type,
  status,
  linked_investor_id,
  notes
)
SELECT
  i.first_name,
  i.last_name,
  i.email,
  i.phone,
  'investor'::crm_contact_type,
  'active'::crm_contact_status,
  i.id,
  'Auto-synced from investors table'
FROM investors i
WHERE NOT EXISTS (
  SELECT 1 FROM crm_contacts c
  WHERE c.linked_investor_id = i.id
)
AND i.first_name IS NOT NULL
AND i.last_name IS NOT NULL;

-- Sync existing borrowers into crm_contacts (skip those already linked)
INSERT INTO crm_contacts (
  first_name,
  last_name,
  email,
  phone,
  contact_type,
  status,
  borrower_id,
  notes
)
SELECT
  b.first_name,
  b.last_name,
  b.email,
  b.phone,
  'borrower'::crm_contact_type,
  'active'::crm_contact_status,
  b.id,
  'Auto-synced from borrowers table'
FROM borrowers b
WHERE NOT EXISTS (
  SELECT 1 FROM crm_contacts c
  WHERE c.borrower_id = b.id
)
AND b.first_name IS NOT NULL
AND b.last_name IS NOT NULL;
