-- Add unified_condition_id FK to notes for pipeline-v2 condition notes
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS unified_condition_id uuid REFERENCES public.unified_deal_conditions(id) ON DELETE CASCADE;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_notes_unified_condition_id
  ON public.notes(unified_condition_id)
  WHERE unified_condition_id IS NOT NULL;
