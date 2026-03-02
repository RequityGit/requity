-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE - PART 1 of 3
-- Tables, Enums, Triggers, and Schema Additions
-- Run this FIRST in Supabase SQL Editor
-- =============================================================================

-- ===================== PHASE 1: EVENT LEDGER =====================

DO $$ BEGIN
    CREATE TYPE loan_event_type AS ENUM (
        'origination', 'draw_funded', 'payment_received',
        'payment_applied_interest', 'payment_applied_principal',
        'payment_applied_fee', 'late_fee_assessed', 'rate_change',
        'maturity_extension', 'payoff_received', 'adjustment', 'charge_off'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS loan_events (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id          text NOT NULL REFERENCES servicing_loans(loan_id),
    event_type       loan_event_type NOT NULL,
    event_date       date NOT NULL,
    amount           numeric(15,2) NOT NULL,
    running_balance  numeric(15,2) NOT NULL,
    reference_id     uuid,
    note             text,
    created_by       uuid REFERENCES auth.users(id),
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_events_loan_date ON loan_events(loan_id, event_date);
CREATE INDEX IF NOT EXISTS idx_loan_events_type ON loan_events(event_type);
CREATE INDEX IF NOT EXISTS idx_loan_events_reference ON loan_events(reference_id) WHERE reference_id IS NOT NULL;

CREATE OR REPLACE FUNCTION prevent_loan_event_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'loan_events is append-only. UPDATE and DELETE are forbidden.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_loan_events_no_update ON loan_events;
DROP TRIGGER IF EXISTS trg_loan_events_no_delete ON loan_events;
CREATE TRIGGER trg_loan_events_no_update BEFORE UPDATE ON loan_events FOR EACH ROW EXECUTE FUNCTION prevent_loan_event_modification();
CREATE TRIGGER trg_loan_events_no_delete BEFORE DELETE ON loan_events FOR EACH ROW EXECUTE FUNCTION prevent_loan_event_modification();

ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;


-- ===================== PHASE 2: BILLING INFRASTRUCTURE =====================

DO $$ BEGIN
    CREATE TYPE billing_cycle_status AS ENUM ('draft', 'reconciled', 'submitted', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE billing_line_item_status AS ENUM ('pending', 'paid', 'partial', 'delinquent', 'waived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE interest_method_type AS ENUM ('dutch', 'non_dutch');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_billing_cycles_month ON billing_cycles(billing_month);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_status ON billing_cycles(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_cycles_unique_month ON billing_cycles(billing_month);

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

CREATE INDEX IF NOT EXISTS idx_billing_items_loan_date ON billing_line_items(loan_id, billing_date);
CREATE INDEX IF NOT EXISTS idx_billing_items_cycle_status ON billing_line_items(billing_cycle_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_items_unique_loan_cycle ON billing_line_items(billing_cycle_id, loan_id);

ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_line_items ENABLE ROW LEVEL SECURITY;


-- ===================== PHASE 4: SCHEMA ADDITIONS =====================

DO $$ BEGIN
    CREATE TYPE servicing_loan_status AS ENUM ('pending', 'active', 'delinquent', 'in_default', 'paid_off', 'charged_off');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE servicing_payment_type AS ENUM ('regular', 'payoff', 'partial', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE late_fee_type AS ENUM ('flat', 'percentage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_structure_type AS ENUM ('interest_only', 'principal_and_interest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to servicing_loans
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS interest_method interest_method_type DEFAULT 'non_dutch';
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS payment_structure payment_structure_type DEFAULT 'interest_only';
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 5;
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS late_fee_type late_fee_type DEFAULT 'flat';
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS late_fee_amount numeric(10,2) DEFAULT 0;
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS servicer_loan_number text;
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS first_payment_date date;
ALTER TABLE servicing_loans ADD COLUMN IF NOT EXISTS servicing_status servicing_loan_status DEFAULT 'active';

-- Sync interest_method with dutch_interest boolean
UPDATE servicing_loans
SET interest_method = CASE
    WHEN dutch_interest = true THEN 'dutch'::interest_method_type
    ELSE 'non_dutch'::interest_method_type
END
WHERE interest_method IS NULL
   OR interest_method != (CASE WHEN dutch_interest = true THEN 'dutch'::interest_method_type ELSE 'non_dutch'::interest_method_type END);

-- Sync payment_structure
UPDATE servicing_loans
SET payment_structure = CASE
    WHEN payment_type = 'Principal & Interest' THEN 'principal_and_interest'::payment_structure_type
    ELSE 'interest_only'::payment_structure_type
END
WHERE payment_structure IS NULL;

-- Sync servicing_status
UPDATE servicing_loans
SET servicing_status = CASE
    WHEN loan_status = 'Active' THEN 'active'::servicing_loan_status
    WHEN loan_status = 'Paid Off' THEN 'paid_off'::servicing_loan_status
    WHEN loan_status = 'In Default' THEN 'in_default'::servicing_loan_status
    ELSE 'active'::servicing_loan_status
END
WHERE servicing_status IS NULL;

-- Add columns to servicing_payments
ALTER TABLE servicing_payments ADD COLUMN IF NOT EXISTS billing_line_item_id uuid REFERENCES billing_line_items(id);
ALTER TABLE servicing_payments ADD COLUMN IF NOT EXISTS payment_classification servicing_payment_type DEFAULT 'regular';
ALTER TABLE servicing_payments ADD COLUMN IF NOT EXISTS return_reason text;

-- Trigger to keep interest_method in sync with dutch_interest
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
CREATE TRIGGER trg_sync_interest_method BEFORE UPDATE ON servicing_loans FOR EACH ROW EXECUTE FUNCTION sync_interest_method();


-- ===================== PHASE 5: DELINQUENCY =====================

DO $$ BEGIN
    CREATE TYPE delinquency_bucket AS ENUM ('current', '1-30', '31-60', '61-90', '90+');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS delinquency_records (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id                  text NOT NULL REFERENCES servicing_loans(loan_id),
    days_delinquent          integer NOT NULL DEFAULT 0,
    amount_past_due          numeric(15,2) NOT NULL DEFAULT 0,
    oldest_unpaid_billing_date date,
    late_fee_assessed        boolean NOT NULL DEFAULT false,
    late_fee_amount          numeric(15,2) NOT NULL DEFAULT 0,
    delinquency_status       delinquency_bucket NOT NULL DEFAULT 'current',
    last_payment_date        date,
    last_payment_amount      numeric(15,2),
    notes                    text,
    updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delinquency_unique_loan ON delinquency_records(loan_id);
CREATE INDEX IF NOT EXISTS idx_delinquency_status ON delinquency_records(delinquency_status);
ALTER TABLE delinquency_records ENABLE ROW LEVEL SECURITY;


-- ===================== PHASE 6: ACH INFO =====================

DO $$ BEGIN
    CREATE TYPE ach_account_type AS ENUM ('checking', 'savings');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS borrower_ach_info (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id             text NOT NULL REFERENCES servicing_loans(loan_id),
    bank_name           text NOT NULL,
    routing_number      text NOT NULL,
    account_number      text NOT NULL,
    account_type        ach_account_type NOT NULL DEFAULT 'checking',
    account_holder_name text NOT NULL,
    is_active           boolean NOT NULL DEFAULT true,
    verified_at         timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_borrower_ach_loan ON borrower_ach_info(loan_id);
CREATE INDEX IF NOT EXISTS idx_borrower_ach_active ON borrower_ach_info(loan_id) WHERE is_active = true;
ALTER TABLE borrower_ach_info ENABLE ROW LEVEL SECURITY;

-- Seed from existing servicing_loans ACH data (only if no ACH records exist yet)
INSERT INTO borrower_ach_info (loan_id, bank_name, routing_number, account_number, account_type, account_holder_name, is_active)
SELECT
    sl.loan_id,
    'On File',
    sl.routing_number,
    sl.account_number,
    CASE WHEN LOWER(sl.account_type) = 'savings' THEN 'savings'::ach_account_type ELSE 'checking'::ach_account_type END,
    COALESCE(sl.account_holder, sl.borrower_name, 'Unknown'),
    CASE WHEN sl.ach_status = 'Active' THEN true ELSE false END
FROM servicing_loans sl
WHERE sl.routing_number IS NOT NULL
  AND sl.account_number IS NOT NULL
  AND sl.routing_number != ''
  AND sl.account_number != ''
  AND NOT EXISTS (
      SELECT 1 FROM borrower_ach_info bai WHERE bai.loan_id = sl.loan_id
  );


-- ===================== RLS POLICIES =====================

-- loan_events policies
DROP POLICY IF EXISTS loan_events_admin_all ON loan_events;
CREATE POLICY loan_events_admin_all ON loan_events FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- billing_cycles policies
DROP POLICY IF EXISTS billing_cycles_admin_all ON billing_cycles;
CREATE POLICY billing_cycles_admin_all ON billing_cycles FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- billing_line_items policies
DROP POLICY IF EXISTS billing_items_admin_all ON billing_line_items;
CREATE POLICY billing_items_admin_all ON billing_line_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- delinquency_records policies
DROP POLICY IF EXISTS delinquency_admin_all ON delinquency_records;
CREATE POLICY delinquency_admin_all ON delinquency_records FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- borrower_ach_info policies
DROP POLICY IF EXISTS borrower_ach_admin_all ON borrower_ach_info;
CREATE POLICY borrower_ach_admin_all ON borrower_ach_info FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ===================== EXTRA INDEXES =====================

CREATE INDEX IF NOT EXISTS idx_billing_items_status ON billing_line_items(status);
CREATE INDEX IF NOT EXISTS idx_billing_items_loan_status_date ON billing_line_items(loan_id, status, billing_date);
CREATE INDEX IF NOT EXISTS idx_billing_items_loan_interest ON billing_line_items(loan_id, billing_date, total_interest_billed);
CREATE INDEX IF NOT EXISTS idx_servicing_payments_loan_date_desc ON servicing_payments(loan_id, date DESC) WHERE entry_type = 'Original';
