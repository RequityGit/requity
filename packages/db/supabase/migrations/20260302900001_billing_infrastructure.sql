-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 2: Billing Infrastructure
-- =============================================================================
-- Tracks each monthly billing run and the per-loan line items within it.
-- Provides a full audit trail of how every dollar of interest was calculated.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE billing_cycle_status AS ENUM (
        'draft', 'reconciled', 'submitted', 'complete'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE billing_line_item_status AS ENUM (
        'pending', 'paid', 'partial', 'delinquent', 'waived'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE interest_method_type AS ENUM (
        'dutch', 'non_dutch'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. billing_cycles — one row per monthly billing run
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_cycles (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_month  date NOT NULL,
    status         billing_cycle_status NOT NULL DEFAULT 'draft',
    total_billed   numeric(15,2) NOT NULL DEFAULT 0,
    loan_count     integer NOT NULL DEFAULT 0,
    generated_by   uuid REFERENCES auth.users(id),
    generated_at   timestamptz NOT NULL DEFAULT now(),
    submitted_at   timestamptz,
    nacha_file_path text,
    notes          text
);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_month
    ON billing_cycles(billing_month);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_status
    ON billing_cycles(status);

-- Unique constraint: only one billing cycle per month
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_cycles_unique_month
    ON billing_cycles(billing_month);

-- ---------------------------------------------------------------------------
-- 3. billing_line_items — one row per loan per billing cycle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS billing_line_items (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_cycle_id         uuid NOT NULL REFERENCES billing_cycles(id) ON DELETE CASCADE,
    loan_id                  text NOT NULL REFERENCES servicing_loans(loan_id),
    billing_date             date NOT NULL,
    days_in_period           integer NOT NULL,
    interest_method          interest_method_type NOT NULL,
    funded_balance           numeric(15,2) NOT NULL,
    committed_balance        numeric(15,2) NOT NULL,
    interest_rate            numeric(8,6) NOT NULL,
    per_diem                 numeric(10,4) NOT NULL,
    base_interest            numeric(15,2) NOT NULL,
    draw_proration_adjustment numeric(15,2) NOT NULL DEFAULT 0,
    total_interest_billed    numeric(15,2) NOT NULL,
    late_fee                 numeric(15,2) NOT NULL DEFAULT 0,
    other_fees               numeric(15,2) NOT NULL DEFAULT 0,
    total_amount_due         numeric(15,2) NOT NULL,
    status                   billing_line_item_status NOT NULL DEFAULT 'pending',
    calculation_detail       jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_billing_items_loan_date
    ON billing_line_items(loan_id, billing_date);

CREATE INDEX IF NOT EXISTS idx_billing_items_cycle_status
    ON billing_line_items(billing_cycle_id, status);

-- Unique constraint: one line item per loan per billing cycle
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_items_unique_loan_cycle
    ON billing_line_items(billing_cycle_id, loan_id);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_line_items ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE billing_cycles IS
    'Monthly billing runs. Each cycle generates one billing_line_item per active loan.';

COMMENT ON TABLE billing_line_items IS
    'Per-loan interest and fee calculations for each billing cycle. '
    'calculation_detail stores the full audit trail of inputs and steps.';
