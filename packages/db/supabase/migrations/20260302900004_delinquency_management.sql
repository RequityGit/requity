-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 5: Delinquency Management
-- =============================================================================
-- Tracks delinquency status for each loan based on unpaid billing line items.
-- The refresh_delinquency_records() function recalculates all records and
-- optionally assesses late fees.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enum: delinquency_bucket
-- ---------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE delinquency_bucket AS ENUM (
        'current', '1-30', '31-60', '61-90', '90+'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Table: delinquency_records
-- ---------------------------------------------------------------------------
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

-- Unique constraint: one delinquency record per loan
CREATE UNIQUE INDEX IF NOT EXISTS idx_delinquency_unique_loan
    ON delinquency_records(loan_id);

CREATE INDEX IF NOT EXISTS idx_delinquency_status
    ON delinquency_records(delinquency_status);

-- Enable RLS
ALTER TABLE delinquency_records ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. Function: refresh_delinquency_records()
-- ---------------------------------------------------------------------------
-- Scans all active loans, calculates days since oldest unpaid billing item,
-- upserts delinquency_records, and assesses late fees based on each loan's
-- grace_period_days and late_fee settings.
--
-- Can be called on-demand or scheduled via pg_cron.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_delinquency_records()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_loan              record;
    v_oldest_unpaid     date;
    v_amount_past_due   numeric(15,2);
    v_days_delinquent   integer;
    v_bucket            delinquency_bucket;
    v_last_pay_date     date;
    v_last_pay_amount   numeric(15,2);
    v_assess_late_fee   boolean;
    v_late_fee_calc     numeric(15,2);
    v_processed         integer := 0;
    v_delinquent_count  integer := 0;
    v_fees_assessed     integer := 0;
    v_today             date := CURRENT_DATE;
BEGIN
    FOR v_loan IN
        SELECT
            sl.loan_id,
            sl.loan_status,
            COALESCE(sl.grace_period_days, 5) AS grace_period_days,
            COALESCE(sl.late_fee_type, 'flat') AS late_fee_type_val,
            COALESCE(sl.late_fee_amount, 0) AS late_fee_amount_val,
            sl.monthly_payment
        FROM servicing_loans sl
        WHERE sl.loan_status = 'Active'
        ORDER BY sl.loan_id
    LOOP
        -- Get oldest unpaid billing date and total past due
        SELECT
            MIN(bli.billing_date),
            COALESCE(SUM(bli.total_amount_due), 0)
        INTO v_oldest_unpaid, v_amount_past_due
        FROM billing_line_items bli
        WHERE bli.loan_id = v_loan.loan_id
          AND bli.status IN ('pending', 'partial', 'delinquent');

        -- Calculate days delinquent
        IF v_oldest_unpaid IS NOT NULL THEN
            v_days_delinquent := v_today - v_oldest_unpaid;
        ELSE
            v_days_delinquent := 0;
        END IF;

        -- Determine delinquency bucket
        v_bucket := CASE
            WHEN v_days_delinquent <= 0 THEN 'current'
            WHEN v_days_delinquent <= 30 THEN '1-30'
            WHEN v_days_delinquent <= 60 THEN '31-60'
            WHEN v_days_delinquent <= 90 THEN '61-90'
            ELSE '90+'
        END::delinquency_bucket;

        -- Get last payment info
        SELECT sp.date, sp.amount_paid
        INTO v_last_pay_date, v_last_pay_amount
        FROM servicing_payments sp
        WHERE sp.loan_id = v_loan.loan_id
          AND sp.entry_type = 'Original'
        ORDER BY sp.date DESC
        LIMIT 1;

        -- Assess late fee if past grace period and not already assessed this cycle
        v_assess_late_fee := false;
        v_late_fee_calc := 0;

        IF v_days_delinquent > v_loan.grace_period_days AND v_amount_past_due > 0 THEN
            -- Check if late fee already assessed for the oldest unpaid period
            IF NOT EXISTS (
                SELECT 1 FROM loan_events le
                WHERE le.loan_id = v_loan.loan_id
                  AND le.event_type = 'late_fee_assessed'
                  AND le.event_date >= v_oldest_unpaid
            ) THEN
                v_assess_late_fee := true;

                IF v_loan.late_fee_type_val = 'percentage' THEN
                    v_late_fee_calc := ROUND(
                        COALESCE(v_loan.monthly_payment, v_amount_past_due)
                        * v_loan.late_fee_amount_val / 100.0, 2
                    );
                ELSE
                    v_late_fee_calc := v_loan.late_fee_amount_val;
                END IF;

                -- Record late fee event if amount > 0
                IF v_late_fee_calc > 0 THEN
                    INSERT INTO loan_events (
                        loan_id, event_type, event_date, amount,
                        running_balance, note
                    ) VALUES (
                        v_loan.loan_id, 'late_fee_assessed', v_today,
                        v_late_fee_calc,
                        calculate_funded_balance(v_loan.loan_id, v_today),
                        'Late fee assessed: ' || v_days_delinquent || ' days past due'
                    );

                    -- Update the billing line item with the late fee
                    UPDATE billing_line_items
                    SET late_fee = late_fee + v_late_fee_calc,
                        total_amount_due = total_amount_due + v_late_fee_calc
                    WHERE loan_id = v_loan.loan_id
                      AND billing_date = v_oldest_unpaid
                      AND status IN ('pending', 'partial', 'delinquent');

                    v_fees_assessed := v_fees_assessed + 1;
                END IF;
            END IF;
        END IF;

        -- Mark delinquent billing items
        IF v_days_delinquent > v_loan.grace_period_days THEN
            UPDATE billing_line_items
            SET status = 'delinquent'
            WHERE loan_id = v_loan.loan_id
              AND status = 'pending'
              AND billing_date < v_today - v_loan.grace_period_days;
        END IF;

        -- Upsert delinquency record
        INSERT INTO delinquency_records (
            loan_id, days_delinquent, amount_past_due,
            oldest_unpaid_billing_date, late_fee_assessed,
            late_fee_amount, delinquency_status,
            last_payment_date, last_payment_amount, updated_at
        ) VALUES (
            v_loan.loan_id, v_days_delinquent, v_amount_past_due,
            v_oldest_unpaid, v_assess_late_fee,
            v_late_fee_calc, v_bucket,
            v_last_pay_date, v_last_pay_amount, now()
        )
        ON CONFLICT (loan_id) DO UPDATE SET
            days_delinquent = EXCLUDED.days_delinquent,
            amount_past_due = EXCLUDED.amount_past_due,
            oldest_unpaid_billing_date = EXCLUDED.oldest_unpaid_billing_date,
            late_fee_assessed = EXCLUDED.late_fee_assessed,
            late_fee_amount = EXCLUDED.late_fee_amount,
            delinquency_status = EXCLUDED.delinquency_status,
            last_payment_date = EXCLUDED.last_payment_date,
            last_payment_amount = EXCLUDED.last_payment_amount,
            updated_at = now();

        v_processed := v_processed + 1;
        IF v_bucket != 'current' THEN
            v_delinquent_count := v_delinquent_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'processed_loans', v_processed,
        'delinquent_loans', v_delinquent_count,
        'late_fees_assessed', v_fees_assessed,
        'run_date', v_today
    );
END;
$$;

COMMENT ON FUNCTION refresh_delinquency_records() IS
    'Scans all active loans, calculates delinquency based on unpaid billing items, '
    'upserts delinquency_records, and assesses late fees per loan settings. '
    'Callable on-demand or via pg_cron.';

COMMENT ON TABLE delinquency_records IS
    'Per-loan delinquency tracking. Refreshed by refresh_delinquency_records(). '
    'One row per loan, upserted on each refresh.';
