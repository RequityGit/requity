-- Add opportunity_id column to loan_comments
ALTER TABLE public.loan_comments
  ADD COLUMN opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE;

-- Make loan_id nullable (was required before)
ALTER TABLE public.loan_comments
  ALTER COLUMN loan_id DROP NOT NULL;

-- Add check constraint: exactly one of loan_id or opportunity_id must be set
ALTER TABLE public.loan_comments
  ADD CONSTRAINT loan_comments_loan_or_opportunity_check
  CHECK (
    (loan_id IS NOT NULL AND opportunity_id IS NULL) OR
    (loan_id IS NULL AND opportunity_id IS NOT NULL)
  );

-- Index for opportunity_id lookups
CREATE INDEX idx_loan_comments_opportunity_id ON public.loan_comments(opportunity_id) WHERE opportunity_id IS NOT NULL;
