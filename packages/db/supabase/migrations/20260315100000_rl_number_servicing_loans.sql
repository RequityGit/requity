-- Migration: Extend RL numbering to servicing_loans
-- Re-numbers servicing_loans.loan_id (PK) and cascades to all child tables.

-- =========================================================================
-- 1. Build a mapping from old loan_id to new RL number
-- =========================================================================
CREATE TEMP TABLE _sl_id_map AS
WITH seq AS (
  SELECT last_value AS base FROM rl_number_seq
),
ordered AS (
  SELECT loan_id,
         ROW_NUMBER() OVER (ORDER BY origination_date NULLS LAST, loan_id) AS rn
  FROM servicing_loans
)
SELECT loan_id AS old_id,
       'RL' || LPAD(((SELECT base FROM seq) + rn)::TEXT, 4, '0') AS new_id
FROM ordered;

-- =========================================================================
-- 2. Drop all FK constraints that reference servicing_loans(loan_id)
-- =========================================================================
ALTER TABLE billing_line_items       DROP CONSTRAINT IF EXISTS billing_line_items_loan_id_fkey;
ALTER TABLE borrower_ach_info        DROP CONSTRAINT IF EXISTS borrower_ach_info_loan_id_fkey;
ALTER TABLE delinquency_records      DROP CONSTRAINT IF EXISTS delinquency_records_loan_id_fkey;
ALTER TABLE loan_events              DROP CONSTRAINT IF EXISTS loan_events_loan_id_fkey;
ALTER TABLE servicing_construction_budgets DROP CONSTRAINT IF EXISTS servicing_construction_budgets_loan_id_fkey;
ALTER TABLE servicing_draws          DROP CONSTRAINT IF EXISTS servicing_draws_loan_id_fkey;
ALTER TABLE servicing_payments       DROP CONSTRAINT IF EXISTS servicing_payments_loan_id_fkey;
ALTER TABLE servicing_pending_actions DROP CONSTRAINT IF EXISTS servicing_pending_actions_loan_id_fkey;

-- =========================================================================
-- 3. Update child tables using the mapping
-- =========================================================================
UPDATE billing_line_items       c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE borrower_ach_info        c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE delinquency_records      c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE loan_events              c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE servicing_construction_budgets c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE servicing_draws          c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE servicing_payments       c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;
UPDATE servicing_pending_actions c SET loan_id = m.new_id FROM _sl_id_map m WHERE c.loan_id = m.old_id;

-- =========================================================================
-- 4. Update the parent table
-- =========================================================================
UPDATE servicing_loans s
SET loan_id = m.new_id
FROM _sl_id_map m
WHERE s.loan_id = m.old_id;

-- =========================================================================
-- 5. Advance the sequence past the last assigned number
-- =========================================================================
SELECT setval('rl_number_seq',
  GREATEST(
    (SELECT COALESCE(MAX(CAST(SUBSTRING(loan_id FROM 'RL(\d+)') AS INTEGER)), 0) FROM servicing_loans),
    (SELECT last_value FROM rl_number_seq)
  )
);

-- =========================================================================
-- 6. Re-add FK constraints
-- =========================================================================
ALTER TABLE billing_line_items
  ADD CONSTRAINT billing_line_items_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE borrower_ach_info
  ADD CONSTRAINT borrower_ach_info_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE delinquency_records
  ADD CONSTRAINT delinquency_records_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE loan_events
  ADD CONSTRAINT loan_events_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE servicing_construction_budgets
  ADD CONSTRAINT servicing_construction_budgets_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE servicing_draws
  ADD CONSTRAINT servicing_draws_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE servicing_payments
  ADD CONSTRAINT servicing_payments_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

ALTER TABLE servicing_pending_actions
  ADD CONSTRAINT servicing_pending_actions_loan_id_fkey
  FOREIGN KEY (loan_id) REFERENCES servicing_loans(loan_id);

-- =========================================================================
-- 7. Clean up
-- =========================================================================
DROP TABLE _sl_id_map;
