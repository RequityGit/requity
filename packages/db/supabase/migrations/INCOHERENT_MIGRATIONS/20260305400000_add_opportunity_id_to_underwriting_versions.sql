-- Add opportunity_id column and make loan_id nullable so UW versions can be
-- associated with either a loan or an opportunity.

ALTER TABLE loan_underwriting_versions
  ALTER COLUMN loan_id DROP NOT NULL;

ALTER TABLE loan_underwriting_versions
  ADD COLUMN opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE;

-- Ensure at least one of loan_id or opportunity_id is set
ALTER TABLE loan_underwriting_versions
  ADD CONSTRAINT chk_loan_or_opportunity
  CHECK (loan_id IS NOT NULL OR opportunity_id IS NOT NULL);

-- Index for querying by opportunity
CREATE INDEX idx_uw_versions_opportunity_id
  ON loan_underwriting_versions(opportunity_id)
  WHERE opportunity_id IS NOT NULL;
