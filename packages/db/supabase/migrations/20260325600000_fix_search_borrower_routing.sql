-- Fix search routing for borrower and borrower_entity results.
-- Adds contact_number to metadata so search results can navigate
-- to the CRM contact page instead of the non-existent /borrowers/ route.

DROP MATERIALIZED VIEW IF EXISTS search_index;

CREATE MATERIALIZED VIEW search_index AS

-- Loans
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
    'type', l.type,
    'priority', l.priority
  ) AS metadata,
  l.updated_at,
  l.borrower_id AS owner_ref
FROM loans l
LEFT JOIN borrowers b ON l.borrower_id = b.id
WHERE l.deleted_at IS NULL

UNION ALL

-- Borrowers (now includes contact_number for routing to CRM contact page)
SELECT
  br.id, 'borrower' AS entity_type,
  COALESCE(br.first_name, '') || ' ' || COALESCE(br.last_name, '') || ' ' ||
  COALESCE(br.email, '') || ' ' || COALESCE(br.phone, '') || ' ' ||
  COALESCE(br.city, '') || ' ' || COALESCE(br.state, '') || ' ' ||
  COALESCE(br.notes, ''),
  jsonb_build_object(
    'name', COALESCE(br.first_name, '') || ' ' || COALESCE(br.last_name, ''),
    'email', br.email,
    'phone', br.phone,
    'city', br.city,
    'state', br.state,
    'credit_score', br.credit_score,
    'contact_number', cc.contact_number,
    'contact_id', cc.id
  ),
  br.updated_at,
  br.id AS owner_ref
FROM borrowers br
LEFT JOIN crm_contacts cc ON cc.borrower_id = br.id AND cc.deleted_at IS NULL

UNION ALL

-- Borrower Entities (now includes contact_number for routing to CRM contact page)
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
    'borrower_id', be.borrower_id,
    'contact_number', cc.contact_number,
    'contact_id', cc.id
  ),
  be.updated_at,
  be.borrower_id AS owner_ref
FROM borrower_entities be
LEFT JOIN borrowers b ON be.borrower_id = b.id
LEFT JOIN crm_contacts cc ON cc.borrower_id = be.borrower_id AND cc.deleted_at IS NULL

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
    'priority', priority,
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

-- Recreate indexes on the materialized view
CREATE UNIQUE INDEX idx_search_index_id_type ON search_index (id, entity_type);
CREATE INDEX idx_search_index_trgm ON search_index USING GIN (search_text gin_trgm_ops);
CREATE INDEX idx_search_index_fts ON search_index USING GIN (to_tsvector('english', search_text));
CREATE INDEX idx_search_index_entity_type ON search_index (entity_type);
CREATE INDEX idx_search_index_updated_at ON search_index (updated_at DESC);

-- Refresh the materialized view to populate it
REFRESH MATERIALIZED VIEW search_index;
