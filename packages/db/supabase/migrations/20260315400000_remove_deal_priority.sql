-- Remove "priority" from loans and unified deals (field_configurations, page layout, card types, search index).
-- Priority on tasks, notifications, approvals, ops_projects, etc. is NOT affected.

BEGIN;

-- 1. Drop the priority column and its index from loans
DROP INDEX IF EXISTS idx_loans_priority;
ALTER TABLE loans DROP COLUMN IF EXISTS priority;

-- 2. Delete the uw_deal priority field configuration
DELETE FROM field_configurations
WHERE module = 'uw_deal' AND field_key = 'priority';

-- 3. Delete the page_layout_fields row that references priority (deal_detail)
DELETE FROM page_layout_fields
WHERE field_key = 'priority'
  AND section_id IN (
    SELECT id FROM page_layout_sections
    WHERE page_type = 'deal_detail'
  );

-- 4. Strip priority from unified_deals.uw_data
UPDATE unified_deals
SET uw_data = uw_data - 'priority'
WHERE uw_data ? 'priority';

-- 5. Remove priority from unified_card_types JSONB columns
--    Strip the priority object from uw_fields arrays
UPDATE unified_card_types
SET uw_fields = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements(uw_fields) AS elem
  WHERE elem->>'key' != 'priority'
)
WHERE uw_fields IS NOT NULL
  AND uw_fields::text LIKE '%"priority"%';

--    Strip "priority" from detail_field_groups -> fields arrays
UPDATE unified_card_types
SET detail_field_groups = (
  SELECT jsonb_agg(
    CASE
      WHEN grp->'fields' IS NOT NULL THEN
        jsonb_set(
          grp,
          '{fields}',
          (SELECT COALESCE(jsonb_agg(f), '[]'::jsonb)
           FROM jsonb_array_elements_text(grp->'fields') AS f
           WHERE f::text != 'priority')
        )
      ELSE grp
    END
  )
  FROM jsonb_array_elements(detail_field_groups) AS grp
)
WHERE detail_field_groups IS NOT NULL
  AND detail_field_groups::text LIKE '%"priority"%';

-- 6. Recreate the search_index materialized view without l.priority in loan metadata
DROP MATERIALIZED VIEW IF EXISTS search_index CASCADE;

CREATE MATERIALIZED VIEW search_index AS

-- Loans (priority removed from metadata)
SELECT
  l.id,
  'loan' AS entity_type,
  COALESCE(l.loan_number, '') || ' ' ||
  COALESCE(l.property_address, '') || ' ' ||
  COALESCE(l.property_address_line1, '') || ' ' ||
  COALESCE(l.property_city, '') || ' ' ||
  COALESCE(l.property_state, '') || ' ' ||
  COALESCE(l.property_zip, '') || ' ' ||
  COALESCE(b.first_name || ' ' || b.last_name, '') || ' ' ||
  COALESCE(l.type::text, '') || ' ' ||
  COALESCE(l.stage::text, '') || ' ' ||
  COALESCE(l.originator, '') || ' ' ||
  COALESCE(l.title_company_name, '') || ' ' ||
  COALESCE(l.capital_partner, '') || ' ' ||
  COALESCE(l.notes, '')
  AS search_text,
  jsonb_build_object(
    'loan_number', l.loan_number,
    'property_address', COALESCE(l.property_address, COALESCE(l.property_address_line1, '') || ', ' || COALESCE(l.property_city, '') || ' ' || COALESCE(l.property_state, '')),
    'borrower_name', COALESCE(b.first_name || ' ' || b.last_name, ''),
    'borrower_id', l.borrower_id,
    'loan_amount', l.loan_amount,
    'stage', l.stage,
    'type', l.type
  ) AS metadata,
  l.updated_at,
  l.borrower_id AS owner_ref
FROM loans l
LEFT JOIN borrowers b ON l.borrower_id = b.id
WHERE l.deleted_at IS NULL

UNION ALL

-- Borrowers
SELECT
  id, 'borrower' AS entity_type,
  COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' ||
  COALESCE(email, '') || ' ' || COALESCE(phone, '') || ' ' ||
  COALESCE(city, '') || ' ' || COALESCE(state, '') || ' ' ||
  COALESCE(notes, ''),
  jsonb_build_object(
    'name', COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
    'email', email,
    'phone', phone,
    'city', city,
    'state', state,
    'credit_score', credit_score
  ),
  updated_at,
  id AS owner_ref
FROM borrowers

UNION ALL

-- Borrower Entities
SELECT
  be.id, 'borrower_entity' AS entity_type,
  COALESCE(be.entity_name, '') || ' ' || COALESCE(be.entity_type, '') || ' ' ||
  COALESCE(be.ein, '') || ' ' || COALESCE(be.state_of_formation, '') || ' ' ||
  COALESCE(b.first_name || ' ' || b.last_name, ''),
  jsonb_build_object(
    'entity_name', be.entity_name,
    'entity_type', be.entity_type,
    'state_of_formation', be.state_of_formation,
    'borrower_name', COALESCE(b.first_name || ' ' || b.last_name, ''),
    'borrower_id', be.borrower_id
  ),
  be.updated_at,
  be.borrower_id AS owner_ref
FROM borrower_entities be
LEFT JOIN borrowers b ON be.borrower_id = b.id

UNION ALL

-- Investors
SELECT
  id, 'investor' AS entity_type,
  COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' ||
  COALESCE(email, '') || ' ' || COALESCE(phone, '') || ' ' ||
  COALESCE(city, '') || ' ' || COALESCE(state, '') || ' ' ||
  COALESCE(notes, ''),
  jsonb_build_object(
    'name', COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
    'email', email,
    'phone', phone,
    'accreditation_status', accreditation_status,
    'city', city,
    'state', state
  ),
  updated_at,
  id AS owner_ref
FROM investors

UNION ALL

-- Investing Entities
SELECT
  ie.id, 'investing_entity' AS entity_type,
  COALESCE(ie.entity_name, '') || ' ' || COALESCE(ie.entity_type, '') || ' ' ||
  COALESCE(ie.ein, '') || ' ' || COALESCE(ie.state_of_formation, '') || ' ' ||
  COALESCE(i.first_name || ' ' || i.last_name, ''),
  jsonb_build_object(
    'entity_name', ie.entity_name,
    'entity_type', ie.entity_type,
    'investor_name', COALESCE(i.first_name || ' ' || i.last_name, ''),
    'investor_id', ie.investor_id
  ),
  ie.updated_at,
  ie.investor_id AS owner_ref
FROM investing_entities ie
LEFT JOIN investors i ON ie.investor_id = i.id

UNION ALL

-- Funds
SELECT
  id, 'fund' AS entity_type,
  COALESCE(name, '') || ' ' || COALESCE(fund_type, '') || ' ' ||
  COALESCE(strategy, '') || ' ' || COALESCE(status, '') || ' ' ||
  COALESCE(notes, ''),
  jsonb_build_object(
    'name', name,
    'fund_type', fund_type,
    'current_aum', current_aum,
    'target_size', target_size,
    'status', status,
    'vintage_year', vintage_year
  ),
  updated_at,
  NULL::uuid AS owner_ref
FROM funds
WHERE deleted_at IS NULL

UNION ALL

-- CRM Contacts
SELECT
  id, 'crm_contact' AS entity_type,
  COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' ||
  COALESCE(name, '') || ' ' || COALESCE(company_name, '') || ' ' ||
  COALESCE(email, '') || ' ' || COALESCE(phone, '') || ' ' ||
  COALESCE(contact_type::text, '') || ' ' || COALESCE(source::text, '') || ' ' ||
  COALESCE(notes, ''),
  jsonb_build_object(
    'name', COALESCE(name, COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')),
    'company_name', company_name,
    'email', email,
    'contact_type', contact_type,
    'source', source,
    'status', status
  ),
  updated_at,
  NULL::uuid AS owner_ref
FROM crm_contacts
WHERE deleted_at IS NULL

UNION ALL

-- Documents
SELECT
  id, 'document' AS entity_type,
  COALESCE(file_name, '') || ' ' || COALESCE(document_type, '') || ' ' ||
  COALESCE(description, ''),
  jsonb_build_object(
    'file_name', file_name,
    'document_type', document_type,
    'loan_id', loan_id,
    'fund_id', fund_id,
    'file_url', file_url
  ),
  updated_at,
  owner_id AS owner_ref
FROM documents

UNION ALL

-- Loan Documents
SELECT
  ld.id, 'loan_document' AS entity_type,
  COALESCE(ld.document_name, '') || ' ' || COALESCE(ld.document_type, '') || ' ' ||
  COALESCE(ld.notes, '') || ' ' || COALESCE(l.loan_number, ''),
  jsonb_build_object(
    'document_name', ld.document_name,
    'document_type', ld.document_type,
    'loan_id', ld.loan_id,
    'loan_number', l.loan_number,
    'file_url', ld.file_url
  ),
  ld.created_at AS updated_at,
  l.borrower_id AS owner_ref
FROM loan_documents ld
LEFT JOIN loans l ON ld.loan_id = l.id

UNION ALL

-- Projects (ops_projects priority is intentionally kept)
SELECT
  id, 'project' AS entity_type,
  COALESCE(project_name, '') || ' ' || COALESCE(description, '') || ' ' ||
  COALESCE(latest_update, '') || ' ' || COALESCE(category, '') || ' ' ||
  COALESCE(owner, ''),
  jsonb_build_object(
    'project_name', project_name,
    'category', category,
    'status', status,
    'priority', priority,
    'owner', owner,
    'due_date', due_date
  ),
  updated_at,
  NULL::uuid AS owner_ref
FROM ops_projects

UNION ALL

-- Tasks (ops_tasks priority is intentionally kept)
SELECT
  id, 'task' AS entity_type,
  COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' ||
  COALESCE(category, '') || ' ' || COALESCE(assigned_to_name, '') || ' ' ||
  COALESCE(linked_entity_label, ''),
  jsonb_build_object(
    'title', title,
    'status', status,
    'priority', priority,
    'assigned_to_name', assigned_to_name,
    'due_date', due_date,
    'category', category,
    'linked_entity_type', linked_entity_type,
    'linked_entity_label', linked_entity_label
  ),
  updated_at,
  NULL::uuid AS owner_ref
FROM ops_tasks;

-- Indexes on the materialized view
CREATE UNIQUE INDEX idx_search_index_id_type ON search_index (id, entity_type);
CREATE INDEX idx_search_index_trgm ON search_index USING GIN (search_text gin_trgm_ops);
CREATE INDEX idx_search_index_fts ON search_index USING GIN (to_tsvector('english', search_text));
CREATE INDEX idx_search_index_entity_type ON search_index (entity_type);
CREATE INDEX idx_search_index_updated_at ON search_index (updated_at DESC);

COMMIT;
