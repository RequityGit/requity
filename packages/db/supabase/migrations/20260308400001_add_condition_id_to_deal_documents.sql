-- Add condition_id FK to unified_deal_documents for condition-scoped documents
ALTER TABLE public.unified_deal_documents
  ADD COLUMN IF NOT EXISTS condition_id uuid REFERENCES public.unified_deal_conditions(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_unified_deal_documents_condition_id
  ON public.unified_deal_documents(condition_id)
  WHERE condition_id IS NOT NULL;
