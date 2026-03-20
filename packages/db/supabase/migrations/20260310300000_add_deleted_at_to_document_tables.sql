-- Add soft-delete support (deleted_at) to the four document tables
-- used by the Document Center.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE contact_files
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE company_files
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
