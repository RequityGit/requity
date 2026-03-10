-- Add model_type column to track which UW calculator model a version uses
ALTER TABLE public.loan_underwriting_versions
  ADD COLUMN IF NOT EXISTS model_type text NOT NULL DEFAULT 'rtl'
  CHECK (model_type IN ('commercial', 'rtl', 'dscr'));

-- Add index for filtering by model type
CREATE INDEX IF NOT EXISTS idx_underwriting_versions_model_type
  ON public.loan_underwriting_versions(loan_id, model_type);
