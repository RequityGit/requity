-- Fix: search_index materialized view indexes were missing, causing
-- REFRESH MATERIALIZED VIEW CONCURRENTLY to fail silently on every
-- API-triggered refresh. The view was frozen since initial creation,
-- leaving 17+ contacts invisible to global search.
--
-- Also adds contact_number to CRM contacts metadata for proper routing.

DROP MATERIALIZED VIEW IF EXISTS search_index;

CREATE MATERIALIZED VIEW search_index AS

-- Loans (borrower name pulled from crm_contacts via borrowers.crm_contact_id)
SELECT
  l.id,
  'loan' AS entity_type,
  COALESCE(l.loan_number, '') || ' ' ||
  COALESCE(l.property_address, '') || ' ' ||
  COALESCE(l.property_address_line1, '') || ' ' ||
  COALESCE(l.property_city, '') || ' ' ||
  COALESCE(l.property_state, '') || ' ' ||
  COALESCE(l.property_zip, '') || ' ' ||
  COALESCE(lcc.first_name || ' ' || lcc.last_name, '') || ' ' ||
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
    'borrower_name', COALESCE(lcc.first_name || ' ' || lcc.last_name, ''),
    'borrower_id', l.borrower_id,
    'loan_amount', l.loan_amount,
    'stage', l.stage,
    'type', l.type
  ) AS metadata,
  l.updated_at,
  l.borrower_id AS owner_ref
FROM loans l
LEFT JOIN borrowers lb ON l.borrower_id = lb.id
LEFT JOIN crm_contacts lcc ON lcc.id = lb.crm_contact_id AND lcc.deleted_at IS NULL
WHERE l.deleted_at IS NULL

UNION ALL

-- Borrowers (display fields from crm_contacts, includes contact_number for routing)
SELECT
  br.id, 'borrower' AS entity_type,
  COALESCE(cc.first_name, '') || ' ' || COALESCE(cc.last_name, '') || ' ' ||
  COALESCE(cc.email, '') || ' ' || COALESCE(cc.phone, '') || ' ' ||
  COALESCE(cc.city, '') || ' ' || COALESCE(cc.state, '') || ' ' ||
  COALESCE(br.notes, ''),
  jsonb_build_object(
    'name', COALESCE(cc.first_name, '') || ' ' || COALESCE(cc.last_name, ''),
    'email', cc.email,
    'phone', cc.phone,
    'city', cc.city,
    'state', cc.state,
    'credit_score', br.credit_score,
    'contact_number', cc.contact_number,
    'contact_id', cc.id
  ),
  br.updated_at,
  br.id AS owner_ref
FROM borrowers br
LEFT JOIN crm_contacts cc ON cc.id = br.crm_contact_id AND cc.deleted_at IS NULL

UNION ALL

-- Borrower Entities (display fields from crm_contacts, includes contact_number for routing)
SELECT
  be.id, 'borrower_entity' AS entity_type,
  COALESCE(be.entity_name, '') || ' ' || COALESCE(be.entity_type, '') || ' ' ||
  COALESCE(be.ein, '') || ' ' || COALESCE(be.state_of_formation, '') || ' ' ||
  COALESCE(becc.first_name || ' ' || becc.last_name, ''),
  jsonb_build_object(
    'entity_name', be.entity_name,
    'entity_type', be.entity_type,
    'state_of_formation', be.state_of_formation,
    'borrower_name', COALESCE(becc.first_name || ' ' || becc.last_name, ''),
    'borrower_id', be.borrower_id,
    'contact_number', becc.contact_number,
    'contact_id', becc.id
  ),
  be.updated_at,
  be.borrower_id AS owner_ref
FROM borrower_entities be
LEFT JOIN borrowers beb ON be.borrower_id = beb.id
LEFT JOIN crm_contacts becc ON becc.id = beb.crm_contact_id AND becc.deleted_at IS NULL

UNION ALL

-- Investors (display fields from crm_contacts via investors.crm_contact_id)
SELECT
  inv.id, 'investor' AS entity_type,
  COALESCE(icc.first_name, '') || ' ' || COALESCE(icc.last_name, '') || ' ' ||
  COALESCE(icc.email, '') || ' ' || COALESCE(icc.phone, '') || ' ' ||
  COALESCE(icc.city, '') || ' ' || COALESCE(icc.state, '') || ' ' ||
  COALESCE(inv.notes, ''),
  jsonb_build_object(
    'name', COALESCE(icc.first_name, '') || ' ' || COALESCE(icc.last_name, ''),
    'email', icc.email,
    'phone', icc.phone,
    'accreditation_status', inv.accreditation_status,
    'city', icc.city,
    'state', icc.state
  ),
  inv.updated_at,
  inv.id AS owner_ref
FROM investors inv
LEFT JOIN crm_contacts icc ON icc.id = inv.crm_contact_id AND icc.deleted_at IS NULL

UNION ALL

-- Investing Entities (investor name from crm_contacts)
SELECT
  ie.id, 'investing_entity' AS entity_type,
  COALESCE(ie.entity_name, '') || ' ' || COALESCE(ie.entity_type, '') || ' ' ||
  COALESCE(ie.ein, '') || ' ' || COALESCE(ie.state_of_formation, '') || ' ' ||
  COALESCE(iecc.first_name || ' ' || iecc.last_name, ''),
  jsonb_build_object(
    'entity_name', ie.entity_name,
    'entity_type', ie.entity_type,
    'investor_name', COALESCE(iecc.first_name || ' ' || iecc.last_name, ''),
    'investor_id', ie.investor_id
  ),
  ie.updated_at,
  ie.investor_id AS owner_ref
FROM investing_entities ie
LEFT JOIN investors iei ON ie.investor_id = iei.id
LEFT JOIN crm_contacts iecc ON iecc.id = iei.crm_contact_id AND iecc.deleted_at IS NULL

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

-- CRM Contacts (added contact_number to metadata for proper routing)
SELECT
  id, 'crm_contact' AS entity_type,
  COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' ||
  COALESCE(name, '') || ' ' || COALESCE(company_name, '') || ' ' ||
  COALESCE(email, '') || ' ' || COALESCE(phone, '') || ' ' ||
  COALESCE(contact_type::text, '') || ' ' || COALESCE(source::text, '') || ' ' ||
  COALESCE(notes, ''),
  jsonb_build_object(
    'name', COALESCE(name, COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')),
    'contact_number', contact_number,
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

-- Projects
SELECT
  id, 'project' AS entity_type,
  COALESCE(project_name, '') || ' ' || COALESCE(description, '') || ' ' ||
  COALESCE(latest_update, '') || ' ' || COALESCE(category, '') || ' ' ||
  COALESCE(owner, ''),
  jsonb_build_object(
    'project_name', project_name,
    'category', category,
    'status', status,
    'owner', owner,
    'due_date', due_date
  ),
  updated_at,
  NULL::uuid AS owner_ref
FROM ops_projects

UNION ALL

-- Tasks
SELECT
  id, 'task' AS entity_type,
  COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' ||
  COALESCE(category, '') || ' ' || COALESCE(assigned_to_name, '') || ' ' ||
  COALESCE(linked_entity_label, ''),
  jsonb_build_object(
    'title', title,
    'status', status,
    'assigned_to_name', assigned_to_name,
    'due_date', due_date,
    'category', category,
    'linked_entity_type', linked_entity_type,
    'linked_entity_label', linked_entity_label
  ),
  updated_at,
  NULL::uuid AS owner_ref
FROM ops_tasks;

-- Recreate all indexes on the materialized view
CREATE UNIQUE INDEX idx_search_index_id_type ON search_index (id, entity_type);
CREATE INDEX idx_search_index_trgm ON search_index USING GIN (search_text gin_trgm_ops);
CREATE INDEX idx_search_index_fts ON search_index USING GIN (to_tsvector('english', search_text));
CREATE INDEX idx_search_index_entity_type ON search_index (entity_type);
CREATE INDEX idx_search_index_updated_at ON search_index (updated_at DESC);

-- Populate the materialized view
REFRESH MATERIALIZED VIEW search_index;

-- Update refresh function with fallback to non-concurrent refresh
-- so it doesn't fail silently if the unique index is ever lost
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW search_index;
  END;
END;
$$;
