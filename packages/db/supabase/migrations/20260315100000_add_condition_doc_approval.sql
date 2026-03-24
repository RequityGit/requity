-- Add condition_approval_status for human approve/deny of condition-linked documents
-- (only meaningful when condition_id IS NOT NULL)
ALTER TABLE public.unified_deal_documents
  ADD COLUMN IF NOT EXISTS condition_approval_status text DEFAULT 'pending'
  CHECK (condition_approval_status IS NULL OR condition_approval_status IN ('pending', 'approved', 'denied'));

COMMENT ON COLUMN public.unified_deal_documents.condition_approval_status IS
  'Human review: pending, approved, or denied. Used only for documents linked to a condition (condition_id NOT NULL).';
