-- ============================================================
-- Pipeline-to-Servicing Bridge Migration
-- Allows construction budgets and draw management tables to
-- reference servicing loan UUIDs in addition to pipeline loan
-- UUIDs. Adds pipeline_loan_id to servicing_loans for tracking
-- which pipeline loan was migrated to servicing.
-- ============================================================

-- 1. Add pipeline_loan_id to servicing_loans
ALTER TABLE servicing_loans
  ADD COLUMN IF NOT EXISTS pipeline_loan_id uuid;

-- 2. Drop FK constraints from budget/draw tables to loans(id)
--    These tables will now accept any UUID (pipeline or servicing).
--    Data integrity is maintained through construction_budget_id chains.

ALTER TABLE construction_budgets
  DROP CONSTRAINT IF EXISTS construction_budgets_loan_id_fkey;

ALTER TABLE budget_line_items
  DROP CONSTRAINT IF EXISTS budget_line_items_loan_id_fkey;

ALTER TABLE budget_change_requests
  DROP CONSTRAINT IF EXISTS budget_change_requests_loan_id_fkey;

ALTER TABLE loan_events
  DROP CONSTRAINT IF EXISTS loan_events_loan_id_fkey;

ALTER TABLE inspection_reports
  DROP CONSTRAINT IF EXISTS inspection_reports_loan_id_fkey;

ALTER TABLE draw_documents
  DROP CONSTRAINT IF EXISTS draw_documents_loan_id_fkey;

-- draw_requests.loan_id FK may have been created in initial schema
-- under different name. Try both possible FK names.
ALTER TABLE draw_requests
  DROP CONSTRAINT IF EXISTS draw_requests_loan_id_fkey;
ALTER TABLE draw_requests
  DROP CONSTRAINT IF EXISTS loan_draws_loan_id_fkey;

-- 3. Index for pipeline_loan_id lookups
CREATE INDEX IF NOT EXISTS idx_servicing_loans_pipeline_loan_id
  ON servicing_loans(pipeline_loan_id)
  WHERE pipeline_loan_id IS NOT NULL;
