-- Universal Search: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Universal Search: Materialized view combining all searchable entities
CREATE MATERIALIZED VIEW IF NOT EXISTS search_index AS

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

-- Indexes on the materialized view
CREATE UNIQUE INDEX idx_search_index_id_type ON search_index (id, entity_type);
CREATE INDEX idx_search_index_trgm ON search_index USING GIN (search_text gin_trgm_ops);
CREATE INDEX idx_search_index_fts ON search_index USING GIN (to_tsvector('english', search_text));
CREATE INDEX idx_search_index_entity_type ON search_index (entity_type);
CREATE INDEX idx_search_index_updated_at ON search_index (updated_at DESC);

-- Search RPC function
CREATE OR REPLACE FUNCTION search_portal(
  query_text TEXT,
  user_role TEXT DEFAULT 'super_admin',
  user_id UUID DEFAULT NULL,
  entity_filter TEXT[] DEFAULT NULL,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  metadata JSONB,
  updated_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sanitized_query TEXT;
  tsquery_val TSQUERY;
BEGIN
  -- Sanitize and prepare query
  sanitized_query := trim(query_text);

  -- Don't search empty strings
  IF sanitized_query = '' THEN
    RETURN;
  END IF;

  -- Build tsquery (handle multi-word gracefully)
  BEGIN
    tsquery_val := plainto_tsquery('english', sanitized_query);
  EXCEPTION WHEN OTHERS THEN
    tsquery_val := NULL;
  END;

  RETURN QUERY
  SELECT
    si.id,
    si.entity_type,
    si.metadata,
    si.updated_at,
    (
      COALESCE(similarity(si.search_text, sanitized_query), 0) * 2.0 +
      COALESCE(ts_rank(to_tsvector('english', si.search_text), tsquery_val), 0) * 1.5 +
      CASE WHEN si.updated_at > NOW() - INTERVAL '7 days' THEN 0.1 ELSE 0 END
    )::REAL AS rank
  FROM search_index si
  WHERE
    (
      similarity(si.search_text, sanitized_query) > 0.1
      OR si.search_text ILIKE '%' || sanitized_query || '%'
      OR (tsquery_val IS NOT NULL AND to_tsvector('english', si.search_text) @@ tsquery_val)
    )
    AND (entity_filter IS NULL OR si.entity_type = ANY(entity_filter))
    AND (
      CASE
        WHEN user_role IN ('super_admin', 'admin') THEN TRUE
        WHEN user_role = 'borrower' THEN
          si.entity_type IN ('loan', 'borrower', 'borrower_entity', 'loan_document', 'document')
          AND (
            si.owner_ref = (SELECT b.id FROM borrowers b WHERE b.user_id = search_portal.user_id LIMIT 1)
            OR si.owner_ref = search_portal.user_id
          )
        WHEN user_role = 'investor' THEN
          si.entity_type IN ('investor', 'investing_entity', 'fund', 'document')
          AND (
            si.owner_ref = (SELECT i.id FROM investors i WHERE i.user_id = search_portal.user_id LIMIT 1)
            OR si.owner_ref = search_portal.user_id
            OR (si.entity_type = 'fund' AND si.id IN (
              SELECT ic.fund_id FROM investor_commitments ic
              WHERE ic.investor_id = (SELECT i2.id FROM investors i2 WHERE i2.user_id = search_portal.user_id LIMIT 1)
            ))
          )
        ELSE FALSE
      END
    )
  ORDER BY rank DESC, si.updated_at DESC
  LIMIT result_limit;
END;
$$;

-- Refresh function for the materialized view
CREATE OR REPLACE FUNCTION refresh_search_index()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY search_index;
END;
$$;
