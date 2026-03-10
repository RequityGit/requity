-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 4: Schema Additions to Existing Tables
-- =============================================================================
-- Adds new servicing columns to servicing_loans and servicing_payments.
-- Uses ADD COLUMN IF NOT EXISTS for idempotency. Never drops columns.
--
-- servicing_loans already has: dutch_interest (bool), payment_type (text),
--   loan_status (text), interest_rate, ach columns, default_rate/status/date
-- We add: interest_method enum, grace_period_days, late_fee_type/amount,
--   servicer_loan_number, loan_servicing_status enum (parallel to text)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. New enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE servicing_loan_status AS ENUM (
        'pending', 'active', 'delinquent', 'in_default', 'paid_off', 'charged_off'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE servicing_payment_type AS ENUM (
        'regular', 'payoff', 'partial', 'returned'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE late_fee_type AS ENUM (
        'flat', 'percentage'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_structure_type AS ENUM (
        'interest_only', 'principal_and_interest'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Alter servicing_loans — add new columns
-- ---------------------------------------------------------------------------
-- interest_method: typed enum version of dutch_interest boolean
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS interest_method interest_method_type
    DEFAULT 'non_dutch';

-- Sync interest_method with existing dutch_interest column
UPDATE servicing_loans
SET interest_method = CASE
    WHEN dutch_interest = true THEN 'dutch'::interest_method_type
    ELSE 'non_dutch'::interest_method_type
END
WHERE interest_method IS NULL OR interest_method != (
    CASE WHEN dutch_interest = true THEN 'dutch'::interest_method_type
    ELSE 'non_dutch'::interest_method_type END
);

-- payment_structure: typed enum version of payment_type text
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS payment_structure payment_structure_type
    DEFAULT 'interest_only';

-- Sync payment_structure with existing payment_type text column
UPDATE servicing_loans
SET payment_structure = CASE
    WHEN payment_type = 'Principal & Interest' THEN 'principal_and_interest'::payment_structure_type
    ELSE 'interest_only'::payment_structure_type
END
WHERE payment_structure IS NULL;

-- grace_period_days: days before late fee kicks in
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 5;

-- late_fee_type: flat dollar amount or percentage of payment
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS late_fee_type late_fee_type DEFAULT 'flat';

-- late_fee_amount: the flat amount or percentage rate
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS late_fee_amount numeric(10,2) DEFAULT 0;

-- servicer_loan_number: TMO reference during parallel run
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS servicer_loan_number text;

-- first_payment_date: when billing should begin for this loan
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS first_payment_date date;

-- servicing_status: typed enum status (parallel to existing text loan_status)
ALTER TABLE servicing_loans
    ADD COLUMN IF NOT EXISTS servicing_status servicing_loan_status
    DEFAULT 'active';

-- Sync servicing_status with existing loan_status text
UPDATE servicing_loans
SET servicing_status = CASE
    WHEN loan_status = 'Active' THEN 'active'::servicing_loan_status
    WHEN loan_status = 'Paid Off' THEN 'paid_off'::servicing_loan_status
    WHEN loan_status = 'In Default' THEN 'in_default'::servicing_loan_status
    ELSE 'active'::servicing_loan_status
END
WHERE servicing_status IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Alter servicing_payments — add new columns
-- ---------------------------------------------------------------------------
-- billing_line_item_id: links payment to specific billing line item
ALTER TABLE servicing_payments
    ADD COLUMN IF NOT EXISTS billing_line_item_id uuid
    REFERENCES billing_line_items(id);

-- payment_classification: typed enum for payment type
ALTER TABLE servicing_payments
    ADD COLUMN IF NOT EXISTS payment_classification servicing_payment_type
    DEFAULT 'regular';

-- return_reason: for ACH returns (R01, R02, etc.)
ALTER TABLE servicing_payments
    ADD COLUMN IF NOT EXISTS return_reason text;

-- ---------------------------------------------------------------------------
-- 4. Trigger to keep interest_method in sync with dutch_interest
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_interest_method()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dutch_interest IS DISTINCT FROM OLD.dutch_interest THEN
        NEW.interest_method := CASE
            WHEN NEW.dutch_interest THEN 'dutch'::interest_method_type
            ELSE 'non_dutch'::interest_method_type
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_interest_method ON servicing_loans;
CREATE TRIGGER trg_sync_interest_method
    BEFORE UPDATE ON servicing_loans
    FOR EACH ROW EXECUTE FUNCTION sync_interest_method();

COMMENT ON COLUMN servicing_loans.interest_method IS
    'Typed enum for interest calculation method. Auto-synced with dutch_interest boolean.';
COMMENT ON COLUMN servicing_loans.grace_period_days IS
    'Days after due date before a late fee is assessed. Default 5.';
COMMENT ON COLUMN servicing_loans.servicer_loan_number IS
    'The Mortgage Office (TMO) reference number during parallel run.';
