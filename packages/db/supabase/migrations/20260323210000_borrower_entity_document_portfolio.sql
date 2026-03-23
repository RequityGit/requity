-- Borrower & Entity Document Portfolio System
-- Adds contact_id + company_id to deal documents, links entities to CRM companies,
-- and creates portfolio views for rolled-up document access across deals.

-- 1. Add contact_id and company_id to deal documents
ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deal_docs_contact ON unified_deal_documents(contact_id)
  WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deal_docs_company ON unified_deal_documents(company_id)
  WHERE company_id IS NOT NULL;

-- 2. Add document metadata for reuse awareness
ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_date date;

-- 3. Link borrowing entities to CRM companies
ALTER TABLE deal_borrowing_entities
  ADD COLUMN IF NOT EXISTS crm_company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_borrowing_entity_company ON deal_borrowing_entities(crm_company_id)
  WHERE crm_company_id IS NOT NULL;

-- 4. Backfill contact_id from existing per-borrower conditions
UPDATE unified_deal_documents d
SET contact_id = c.assigned_contact_id
FROM unified_deal_conditions c
WHERE d.condition_id = c.id
  AND c.assigned_contact_id IS NOT NULL
  AND d.contact_id IS NULL;

-- 5. Create rolled-up portfolio view (borrowers)
-- Combines deal documents tagged to a contact with CRM contact files
CREATE OR REPLACE VIEW borrower_document_portfolio AS
SELECT
  d.id,
  d.contact_id,
  d.deal_id,
  d.document_name,
  d.storage_path,
  d.mime_type,
  d.file_size_bytes,
  d.document_type,
  d.document_date,
  d.created_at,
  d.visibility,
  d.condition_approval_status,
  'deal_document'::text AS source,
  ud.name AS deal_name
FROM unified_deal_documents d
JOIN unified_deals ud ON ud.id = d.deal_id
WHERE d.contact_id IS NOT NULL AND d.deleted_at IS NULL
UNION ALL
SELECT
  cf.id,
  cf.contact_id,
  NULL::uuid AS deal_id,
  cf.file_name AS document_name,
  cf.storage_path,
  cf.mime_type,
  cf.file_size AS file_size_bytes,
  NULL::text AS document_type,
  NULL::date AS document_date,
  cf.created_at,
  'internal'::text AS visibility,
  NULL::text AS condition_approval_status,
  'contact_file'::text AS source,
  NULL::text AS deal_name
FROM contact_files cf;

-- 6. Create rolled-up portfolio view (entities/companies)
-- Shows all deal documents tagged to a company across all deals
CREATE OR REPLACE VIEW entity_document_portfolio AS
SELECT
  d.id,
  d.company_id,
  d.deal_id,
  d.document_name,
  d.storage_path,
  d.mime_type,
  d.file_size_bytes,
  d.document_type,
  d.document_date,
  d.created_at,
  d.visibility,
  d.condition_approval_status,
  'deal_document'::text AS source,
  ud.name AS deal_name
FROM unified_deal_documents d
JOIN unified_deals ud ON ud.id = d.deal_id
WHERE d.company_id IS NOT NULL AND d.deleted_at IS NULL;
