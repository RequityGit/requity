-- =============================================================================
-- SERVICING ENGINE — Phase 1: Schema Design + Table Creation
-- =============================================================================
-- Migrates the Excel/Google Sheets loan servicing workbook into Supabase.
-- These are SEPARATE tables from the portal pipeline tables (loans, loan_draws,
-- loan_payments) — they represent the servicing-specific data model.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. servicing_loans — The Loan Tape
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_loans (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         text NOT NULL UNIQUE,                        -- RQ-XXXX
    borrower_name   text,
    entity_name     text,
    property_address text,
    city_state_zip  text,
    loan_type       text,                                        -- Commercial, RTL, DSCR, Transactional
    loan_purpose    text,                                        -- Purchase, Refinance, Transactional
    asset_class     text,
    program         text,
    loan_status     text NOT NULL DEFAULT 'Active',              -- Active, Paid Off, Sold, In Default
    origination_date date,
    maturity_date   date,
    term_months     integer,
    total_loan_amount numeric(15,2) NOT NULL DEFAULT 0,
    construction_holdback numeric(15,2) DEFAULT 0,
    funds_released  numeric(15,2) DEFAULT 0,
    current_balance numeric(15,2) DEFAULT 0,
    draw_funds_available numeric(15,2) DEFAULT 0,
    interest_rate   numeric(8,6),                                -- e.g. 0.120000 = 12%
    monthly_payment numeric(15,2) DEFAULT 0,
    payment_type    text DEFAULT 'Interest Only',
    dutch_interest  boolean NOT NULL DEFAULT false,              -- true = Dutch, false = Non-Dutch
    next_payment_due date,
    days_past_due   integer DEFAULT 0,
    fund_name       text,
    fund_ownership_pct numeric(8,6) DEFAULT 0,
    origination_fee numeric(15,2),
    exit_fee        numeric(15,2),
    purchase_price  numeric(15,2),
    origination_value numeric(15,2),
    stabilized_value numeric(15,2),
    additional_collateral_value numeric(15,2) DEFAULT 0,
    ltv_origination numeric(8,6),
    ltc             numeric(8,6),
    borrower_credit_score integer,
    originator      text,
    ach_status      text,                                        -- Active, Inactive
    routing_number  text,
    account_number  text,
    account_type    text,                                        -- Checking, Savings
    account_holder  text,
    folder_link     text,
    notes           text,
    default_rate    numeric(8,6),                                -- e.g. 0.240000 = 24%
    default_status  text,                                        -- NULL or 'In Default'
    default_date    date,
    effective_rate  numeric(8,6),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_servicing_loans_status ON servicing_loans(loan_status);
CREATE INDEX IF NOT EXISTS idx_servicing_loans_loan_id ON servicing_loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_loans_dutch ON servicing_loans(dutch_interest);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_servicing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicing_loans_updated_at
    BEFORE UPDATE ON servicing_loans
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 2. servicing_draws — The Draw Log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_draws (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    draw_number     integer NOT NULL,
    loan_id         text NOT NULL REFERENCES servicing_loans(loan_id),
    request_date    date,
    entity_name     text,
    line_item       text,
    amount          numeric(15,2) NOT NULL DEFAULT 0,
    status          text NOT NULL DEFAULT 'Pending',             -- Pending, Approved, Funded, Rejected
    funded_date     date,
    approved_by     text,
    inspection_complete text,
    reference_link  text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_draws_loan_id ON servicing_draws(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_draws_status ON servicing_draws(status);
CREATE INDEX IF NOT EXISTS idx_servicing_draws_funded_date ON servicing_draws(funded_date);

CREATE TRIGGER trg_servicing_draws_updated_at
    BEFORE UPDATE ON servicing_draws
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 3. servicing_payments — Payment Ledger (APPEND ONLY)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_payments (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date                date NOT NULL,
    loan_id             text NOT NULL REFERENCES servicing_loans(loan_id),
    borrower            text,
    type                text NOT NULL,                           -- Monthly Payment, NSF Fee, Late Fee, etc.
    amount_due          numeric(15,2) DEFAULT 0,
    amount_paid         numeric(15,2) DEFAULT 0,
    principal           numeric(15,2) DEFAULT 0,
    interest            numeric(15,2) DEFAULT 0,
    late_fee            numeric(15,2) DEFAULT 0,
    balance_after       numeric(15,2) DEFAULT 0,
    payment_method      text,                                    -- ACH, Wire, Check
    reference_trace     text,
    entry_type          text NOT NULL DEFAULT 'Original',        -- Original or Reversal
    reversal_of         uuid REFERENCES servicing_payments(id),
    entered_by          text,
    entry_timestamp     timestamptz NOT NULL DEFAULT now(),
    locked              boolean NOT NULL DEFAULT false,
    running_balance_check numeric(15,2) DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now()
    -- NOTE: No updated_at — append only, no updates allowed
);

CREATE INDEX IF NOT EXISTS idx_servicing_payments_loan_id ON servicing_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_payments_date ON servicing_payments(date);
CREATE INDEX IF NOT EXISTS idx_servicing_payments_entry_type ON servicing_payments(entry_type);


-- ---------------------------------------------------------------------------
-- 4. servicing_construction_budgets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_construction_budgets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         text NOT NULL REFERENCES servicing_loans(loan_id),
    line_item       text NOT NULL,
    budget_amount   numeric(15,2) DEFAULT 0,
    amount_drawn    numeric(15,2) DEFAULT 0,
    remaining       numeric(15,2) DEFAULT 0,
    pct_complete    numeric(8,6) DEFAULT 0,
    inspector_notes text,
    last_updated    timestamptz DEFAULT now(),
    status          text DEFAULT 'Open',
    inspection_link text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_budgets_loan_id ON servicing_construction_budgets(loan_id);

CREATE TRIGGER trg_servicing_budgets_updated_at
    BEFORE UPDATE ON servicing_construction_budgets
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 5. servicing_pending_actions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_pending_actions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id         text NOT NULL REFERENCES servicing_loans(loan_id),
    entity_name     text,
    property        text,
    request_date    date,
    amount          numeric(15,2),
    request_type    text,
    action_status   text DEFAULT 'Pending',
    jotform_submitted boolean DEFAULT false,
    wire_date       date,
    wire_confirmation text,
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servicing_actions_loan_id ON servicing_pending_actions(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_actions_status ON servicing_pending_actions(action_status);

CREATE TRIGGER trg_servicing_actions_updated_at
    BEFORE UPDATE ON servicing_pending_actions
    FOR EACH ROW EXECUTE FUNCTION update_servicing_updated_at();


-- ---------------------------------------------------------------------------
-- 6. servicing_audit_log — IMMUTABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicing_audit_log (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp       timestamptz NOT NULL DEFAULT now(),
    user_email      text,
    action          text NOT NULL,
    loan_id         text,
    tab_source      text,
    field_changed   text,
    old_value       text,
    new_value       text,
    reference       text,
    entry_type      text DEFAULT 'System',
    notes           text
    -- NOTE: No updated_at — immutable, no updates/deletes allowed
);

CREATE INDEX IF NOT EXISTS idx_servicing_audit_loan_id ON servicing_audit_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_servicing_audit_timestamp ON servicing_audit_log(timestamp);


-- ---------------------------------------------------------------------------
-- 7. Enable RLS on all servicing tables
-- ---------------------------------------------------------------------------
ALTER TABLE servicing_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_construction_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicing_audit_log ENABLE ROW LEVEL SECURITY;
