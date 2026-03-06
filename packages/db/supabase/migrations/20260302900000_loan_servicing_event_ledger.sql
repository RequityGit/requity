-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 1: Event Ledger (Foundation)
-- =============================================================================
-- An immutable, append-only ledger of every balance-changing event on a loan.
-- This is the single source of truth. Balances are derived by replaying this
-- ledger, never stored independently.
--
-- Integrates with the existing servicing_loans table (text loan_id like RQ-XXXX).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum: loan_event_type
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE loan_event_type AS ENUM (
        'origination',
        'draw_funded',
        'payment_received',
        'payment_applied_interest',
        'payment_applied_principal',
        'payment_applied_fee',
        'late_fee_assessed',
        'rate_change',
        'maturity_extension',
        'payoff_received',
        'adjustment',
        'charge_off'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Table: loan_events — the immutable event ledger
-- ---------------------------------------------------------------------------
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

-- Primary query index
CREATE INDEX IF NOT EXISTS idx_loan_events_loan_date
    ON loan_events(loan_id, event_date);

CREATE INDEX IF NOT EXISTS idx_loan_events_type
    ON loan_events(event_type);

CREATE INDEX IF NOT EXISTS idx_loan_events_reference
    ON loan_events(reference_id)
    WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Immutability trigger — prevents UPDATE and DELETE on loan_events
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_loan_event_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
        'loan_events is append-only. UPDATE and DELETE are forbidden. '
        'To correct an error, insert a new event with type ''adjustment''.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers first to be idempotent
DROP TRIGGER IF EXISTS trg_loan_events_no_update ON loan_events;
DROP TRIGGER IF EXISTS trg_loan_events_no_delete ON loan_events;

CREATE TRIGGER trg_loan_events_no_update
    BEFORE UPDATE ON loan_events
    FOR EACH ROW EXECUTE FUNCTION prevent_loan_event_modification();

CREATE TRIGGER trg_loan_events_no_delete
    BEFORE DELETE ON loan_events
    FOR EACH ROW EXECUTE FUNCTION prevent_loan_event_modification();

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------
ALTER TABLE loan_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE loan_events IS
    'Immutable append-only ledger of all balance-changing events on servicing loans. '
    'Funded balances are derived by replaying events. Never UPDATE or DELETE rows.';
