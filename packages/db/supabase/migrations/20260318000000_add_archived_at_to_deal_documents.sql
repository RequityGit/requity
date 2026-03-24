-- Add archived_at column to unified_deal_documents for soft-archive support
ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Index for filtering active vs archived documents
CREATE INDEX IF NOT EXISTS idx_unified_deal_documents_archived_at
  ON unified_deal_documents (archived_at)
  WHERE archived_at IS NULL;
