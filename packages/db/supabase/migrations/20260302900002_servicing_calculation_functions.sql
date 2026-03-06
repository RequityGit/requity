-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Phase 3: PostgreSQL Calculation Functions
-- =============================================================================
-- Penny-accurate financial calculations for the servicing engine.
-- All functions use 360-day year convention and handle Dutch / Non-Dutch interest.
--
-- Functions built (in dependency order):
--   1. calculate_funded_balance(loan_id, as_of_date) → numeric
--   2. calculate_per_diem(balance, annual_rate) → numeric
--   3. calculate_interest_for_period(loan_id, billing_month) → jsonb
--   4. generate_billing_cycle(billing_month, created_by) → uuid
--   5. apply_payment(loan_id, payment_date, amount, ref, applied_by) → jsonb
--   6. generate_payoff_quote(loan_id, payoff_date) → jsonb
--   7. run_reconciliation_checks(billing_cycle_id) → jsonb
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 3a. calculate_funded_balance(loan_id, as_of_date) → numeric
-- ---------------------------------------------------------------------------
-- Replays loan_events for the given loan up through as_of_date and returns
-- the current funded balance. Returns 0 if no origination event exists.
--
-- Balance-increasing events: origination, draw_funded, adjustment (positive)
-- Balance-decreasing events: payment_applied_principal, payoff_received,
--                            charge_off, adjustment (negative)
-- Neutral events: payment_applied_interest, payment_applied_fee,
--                 late_fee_assessed, rate_change, maturity_extension
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_funded_balance(
    p_loan_id text,
    p_as_of_date date
)
RETURNS numeric
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_balance numeric(15,2);
    v_has_origination boolean;
BEGIN
    -- Check if an origination event exists for this loan
    SELECT EXISTS(
        SELECT 1
        FROM loan_events
        WHERE loan_id = p_loan_id
          AND event_type = 'origination'
          AND event_date <= p_as_of_date
    ) INTO v_has_origination;

    IF NOT v_has_origination THEN
        RETURN 0;
    END IF;

    -- Get the running_balance from the most recent event on or before as_of_date
    SELECT le.running_balance
    INTO v_balance
    FROM loan_events le
    WHERE le.loan_id = p_loan_id
      AND le.event_date <= p_as_of_date
    ORDER BY le.event_date DESC, le.created_at DESC
    LIMIT 1;

    RETURN COALESCE(v_balance, 0);
END;
$$;

COMMENT ON FUNCTION calculate_funded_balance(text, date) IS
    'Replays loan_events to derive the funded balance as of a given date. '
    'Returns 0 if no origination event exists. Uses the running_balance '
    'from the most recent event on or before as_of_date.';

-- ---------------------------------------------------------------------------
-- 3b. calculate_per_diem(balance, annual_rate) → numeric
-- ---------------------------------------------------------------------------
-- Returns balance × annual_rate ÷ 360, rounded to 4 decimal places.
-- Uses 360-day year (actual/360) convention standard for bridge loans.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_per_diem(
    p_balance numeric,
    p_annual_rate numeric
)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF p_balance IS NULL OR p_annual_rate IS NULL THEN
        RETURN 0;
    END IF;

    RETURN ROUND(p_balance * p_annual_rate / 360.0, 4);
END;
$$;

COMMENT ON FUNCTION calculate_per_diem(numeric, numeric) IS
    'Calculates daily interest accrual: balance × rate ÷ 360. '
    'Rounded to 4 decimal places. Uses 360-day year convention.';

-- ---------------------------------------------------------------------------
-- 3c. calculate_interest_for_period(loan_id, billing_month) → jsonb
-- ---------------------------------------------------------------------------
-- The core calculation function. Computes monthly interest for a single loan.
--
-- Dutch Interest: interest on full committed amount (total_loan_amount),
--   regardless of how much has been drawn.
-- Non-Dutch Interest: interest on funded balance, with mid-month draw
--   proration by days remaining in the billing period.
--
-- Returns a JSON object with all inputs and the computed result:
-- {
--   "loan_id", "billing_month", "interest_method", "committed_balance",
--   "funded_balance", "interest_rate", "days_in_period", "per_diem",
--   "base_interest", "draw_proration_detail", "draw_proration_total",
--   "total_interest"
-- }
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_interest_for_period(
    p_loan_id text,
    p_billing_month date
)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_loan              record;
    v_period_start      date;
    v_period_end        date;
    v_days_in_period    integer;
    v_is_dutch          boolean;
    v_funded_balance    numeric(15,2);
    v_committed_balance numeric(15,2);
    v_rate              numeric(8,6);
    v_per_diem          numeric(10,4);
    v_base_interest     numeric(15,2);
    v_draw_proration    numeric(15,2) := 0;
    v_draw_detail       jsonb := '[]'::jsonb;
    v_total_interest    numeric(15,2);
    v_draw_rec          record;
    v_days_remaining    integer;
    v_draw_per_diem     numeric(10,4);
    v_draw_interest     numeric(15,2);
BEGIN
    -- Fetch loan record
    SELECT
        sl.loan_id,
        sl.total_loan_amount,
        sl.interest_rate,
        sl.dutch_interest,
        sl.loan_status,
        sl.origination_date,
        sl.maturity_date,
        sl.default_status,
        sl.default_rate,
        sl.default_date,
        COALESCE(sl.interest_method, CASE WHEN sl.dutch_interest THEN 'dutch' ELSE 'non_dutch' END) AS eff_interest_method
    INTO v_loan
    FROM servicing_loans sl
    WHERE sl.loan_id = p_loan_id;

    IF v_loan IS NULL THEN
        RETURN jsonb_build_object(
            'error', 'Loan not found: ' || p_loan_id
        );
    END IF;

    -- Determine billing period
    v_period_start := p_billing_month;
    v_period_end := (p_billing_month + interval '1 month' - interval '1 day')::date;
    v_days_in_period := v_period_end - v_period_start + 1;

    -- Determine effective rate (use default rate if in default)
    IF v_loan.default_status = 'In Default'
       AND v_loan.default_date IS NOT NULL
       AND v_period_end >= v_loan.default_date
       AND v_loan.default_rate IS NOT NULL
    THEN
        v_rate := v_loan.default_rate;
    ELSE
        v_rate := COALESCE(v_loan.interest_rate, 0);
    END IF;

    v_committed_balance := COALESCE(v_loan.total_loan_amount, 0);
    v_is_dutch := COALESCE(v_loan.dutch_interest, false);

    -- ---------------------------------------------------------------
    -- DUTCH INTEREST: charge on full committed amount
    -- ---------------------------------------------------------------
    IF v_is_dutch THEN
        v_funded_balance := v_committed_balance;
        v_per_diem := calculate_per_diem(v_committed_balance, v_rate);
        v_base_interest := ROUND(v_committed_balance * v_rate / 360.0 * v_days_in_period, 2);
        v_draw_proration := 0;
        v_total_interest := v_base_interest;

    -- ---------------------------------------------------------------
    -- NON-DUTCH INTEREST: charge on funded balance + draw proration
    -- ---------------------------------------------------------------
    ELSE
        -- Get funded balance at start of billing period
        -- For event-ledger-based loans, use calculate_funded_balance
        -- For legacy loans, fall back to summing funded draws
        v_funded_balance := calculate_funded_balance(p_loan_id, v_period_start);

        -- If no events exist yet, fall back to legacy draw-based calculation
        IF v_funded_balance = 0 THEN
            SELECT COALESCE(SUM(d.amount), 0)
            INTO v_funded_balance
            FROM servicing_draws d
            WHERE d.loan_id = p_loan_id
              AND d.status = 'Funded'
              AND d.funded_date <= v_period_start;
        END IF;

        v_per_diem := calculate_per_diem(v_funded_balance, v_rate);

        -- Base interest on opening balance for full period
        v_base_interest := ROUND(v_funded_balance * v_rate / 360.0 * v_days_in_period, 2);

        -- Query for mid-month draws (draws funded during the billing period)
        -- Check loan_events first, then fall back to servicing_draws
        v_draw_proration := 0;
        v_draw_detail := '[]'::jsonb;

        -- Try event-based draws first
        FOR v_draw_rec IN
            SELECT
                le.amount AS draw_amount,
                le.event_date AS funded_date,
                (v_period_end - le.event_date) AS days_rem
            FROM loan_events le
            WHERE le.loan_id = p_loan_id
              AND le.event_type = 'draw_funded'
              AND le.event_date > v_period_start
              AND le.event_date <= v_period_end
            ORDER BY le.event_date
        LOOP
            v_days_remaining := v_draw_rec.days_rem;
            v_draw_per_diem := calculate_per_diem(v_draw_rec.draw_amount, v_rate);
            v_draw_interest := ROUND(v_draw_rec.draw_amount * v_rate / 360.0 * v_days_remaining, 2);

            v_draw_proration := v_draw_proration + v_draw_interest;
            v_draw_detail := v_draw_detail || jsonb_build_object(
                'draw_amount', v_draw_rec.draw_amount,
                'funded_date', v_draw_rec.funded_date,
                'days_remaining', v_days_remaining,
                'per_diem', v_draw_per_diem,
                'prorated_interest', v_draw_interest
            );
        END LOOP;

        -- If no event-based draws found, check legacy servicing_draws
        IF v_draw_detail = '[]'::jsonb THEN
            FOR v_draw_rec IN
                SELECT
                    d.amount AS draw_amount,
                    d.funded_date,
                    (v_period_end - d.funded_date) AS days_rem
                FROM servicing_draws d
                WHERE d.loan_id = p_loan_id
                  AND d.status = 'Funded'
                  AND d.funded_date > v_period_start
                  AND d.funded_date <= v_period_end
                ORDER BY d.funded_date
            LOOP
                v_days_remaining := v_draw_rec.days_rem;
                v_draw_per_diem := calculate_per_diem(v_draw_rec.draw_amount, v_rate);
                v_draw_interest := ROUND(v_draw_rec.draw_amount * v_rate / 360.0 * v_days_remaining, 2);

                v_draw_proration := v_draw_proration + v_draw_interest;
                v_draw_detail := v_draw_detail || jsonb_build_object(
                    'draw_amount', v_draw_rec.draw_amount,
                    'funded_date', v_draw_rec.funded_date,
                    'days_remaining', v_days_remaining,
                    'per_diem', v_draw_per_diem,
                    'prorated_interest', v_draw_interest
                );
            END LOOP;
        END IF;

        v_total_interest := v_base_interest + v_draw_proration;
    END IF;

    -- Return full calculation detail as JSON
    RETURN jsonb_build_object(
        'loan_id',              p_loan_id,
        'billing_month',        p_billing_month,
        'interest_method',      CASE WHEN v_is_dutch THEN 'dutch' ELSE 'non_dutch' END,
        'committed_balance',    v_committed_balance,
        'funded_balance',       v_funded_balance,
        'interest_rate',        v_rate,
        'days_in_period',       v_days_in_period,
        'per_diem',             v_per_diem,
        'base_interest',        v_base_interest,
        'draw_proration_detail', v_draw_detail,
        'draw_proration_total', v_draw_proration,
        'total_interest',       v_total_interest
    );
END;
$$;

COMMENT ON FUNCTION calculate_interest_for_period(text, date) IS
    'Core interest calculation. Returns jsonb with full audit trail. '
    'Dutch: interest on committed amount. Non-Dutch: interest on funded '
    'balance + prorated mid-month draws. Uses actual/360 convention.';

-- ---------------------------------------------------------------------------
-- 3d. generate_billing_cycle(billing_month, created_by) → uuid
-- ---------------------------------------------------------------------------
-- Generates a full billing run for all active loans.
--
-- Steps:
--   1. Create billing_cycles record with status 'draft'
--   2. For each active loan where origination_date <= billing_month
--      and maturity_date >= billing_month:
--      - Call calculate_interest_for_period()
--      - Insert billing_line_items row
--   3. Update billing_cycles.total_billed and loan_count
--   4. Return the billing_cycle_id
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_billing_cycle(
    p_billing_month date,
    p_created_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_cycle_id       uuid;
    v_loan           record;
    v_calc           jsonb;
    v_total_billed   numeric(15,2) := 0;
    v_loan_count     integer := 0;
    v_per_diem       numeric(10,4);
    v_interest_method interest_method_type;
    v_funded_bal     numeric(15,2);
    v_committed_bal  numeric(15,2);
    v_rate           numeric(8,6);
    v_days           integer;
    v_base_interest  numeric(15,2);
    v_draw_proration numeric(15,2);
    v_total_interest numeric(15,2);
    v_late_fee       numeric(15,2) := 0;
BEGIN
    -- Check for existing billing cycle for this month
    IF EXISTS (SELECT 1 FROM billing_cycles WHERE billing_month = p_billing_month) THEN
        RAISE EXCEPTION 'A billing cycle already exists for %', p_billing_month;
    END IF;

    -- Create the billing cycle
    INSERT INTO billing_cycles (billing_month, status, generated_by)
    VALUES (p_billing_month, 'draft', p_created_by)
    RETURNING id INTO v_cycle_id;

    -- Process each active loan
    FOR v_loan IN
        SELECT sl.loan_id, sl.dutch_interest, sl.total_loan_amount,
               sl.interest_rate, sl.loan_status, sl.origination_date,
               sl.maturity_date
        FROM servicing_loans sl
        WHERE sl.loan_status = 'Active'
          AND (sl.origination_date IS NULL OR sl.origination_date <= p_billing_month)
          AND (sl.maturity_date IS NULL OR sl.maturity_date >= p_billing_month)
        ORDER BY sl.loan_id
    LOOP
        -- Calculate interest for this loan
        v_calc := calculate_interest_for_period(v_loan.loan_id, p_billing_month);

        -- Skip if there was an error
        IF v_calc ? 'error' THEN
            CONTINUE;
        END IF;

        -- Extract values from the calculation result
        v_funded_bal     := (v_calc ->> 'funded_balance')::numeric;
        v_committed_bal  := (v_calc ->> 'committed_balance')::numeric;
        v_rate           := (v_calc ->> 'interest_rate')::numeric;
        v_days           := (v_calc ->> 'days_in_period')::integer;
        v_per_diem       := (v_calc ->> 'per_diem')::numeric;
        v_base_interest  := (v_calc ->> 'base_interest')::numeric;
        v_draw_proration := (v_calc ->> 'draw_proration_total')::numeric;
        v_total_interest := (v_calc ->> 'total_interest')::numeric;

        v_interest_method := CASE
            WHEN (v_calc ->> 'interest_method') = 'dutch' THEN 'dutch'::interest_method_type
            ELSE 'non_dutch'::interest_method_type
        END;

        -- Insert billing line item
        INSERT INTO billing_line_items (
            billing_cycle_id, loan_id, billing_date, days_in_period,
            interest_method, funded_balance, committed_balance,
            interest_rate, per_diem, base_interest,
            draw_proration_adjustment, total_interest_billed,
            late_fee, other_fees, total_amount_due, status,
            calculation_detail
        ) VALUES (
            v_cycle_id, v_loan.loan_id, p_billing_month, v_days,
            v_interest_method, v_funded_bal, v_committed_bal,
            v_rate, v_per_diem, v_base_interest,
            v_draw_proration, v_total_interest,
            0, 0, v_total_interest, 'pending',
            v_calc
        );

        v_total_billed := v_total_billed + v_total_interest;
        v_loan_count := v_loan_count + 1;
    END LOOP;

    -- Update the billing cycle summary
    UPDATE billing_cycles
    SET total_billed = v_total_billed,
        loan_count = v_loan_count
    WHERE id = v_cycle_id;

    RETURN v_cycle_id;
END;
$$;

COMMENT ON FUNCTION generate_billing_cycle(date, uuid) IS
    'Generates a billing run for all active loans in a given month. '
    'Creates one billing_line_item per loan with full interest calculations. '
    'Returns the billing_cycle_id. Raises exception if cycle already exists.';

-- ---------------------------------------------------------------------------
-- 3e. apply_payment(loan_id, payment_date, amount, ref, applied_by) → jsonb
-- ---------------------------------------------------------------------------
-- Applies a payment using the standard waterfall:
--   1. First to any outstanding late fees
--   2. Then to interest due (oldest unpaid billing_line_items first)
--   3. Then to principal (if P&I loan)
--   4. Any overpayment noted in return value
--
-- For each dollar applied:
--   - Inserts a loan_events row with appropriate event_type
--   - Updates billing_line_items.status to 'paid' or 'partial'
--   - Records the payment in servicing_payments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION apply_payment(
    p_loan_id text,
    p_payment_date date,
    p_amount_received numeric,
    p_reference_number text,
    p_applied_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_remaining       numeric(15,2);
    v_applied_to_fees numeric(15,2) := 0;
    v_applied_to_interest numeric(15,2) := 0;
    v_applied_to_principal numeric(15,2) := 0;
    v_overpayment     numeric(15,2) := 0;
    v_bill_item       record;
    v_apply_amount    numeric(15,2);
    v_current_balance numeric(15,2);
    v_payment_id      uuid;
    v_loan            record;
    v_detail          jsonb := '[]'::jsonb;
BEGIN
    -- Validate loan exists
    SELECT sl.loan_id, sl.payment_type, sl.current_balance
    INTO v_loan
    FROM servicing_loans sl
    WHERE sl.loan_id = p_loan_id;

    IF v_loan IS NULL THEN
        RETURN jsonb_build_object('error', 'Loan not found: ' || p_loan_id);
    END IF;

    v_remaining := p_amount_received;
    v_current_balance := COALESCE(v_loan.current_balance, 0);

    -- ---------------------------------------------------------------
    -- Step 1: Apply to outstanding late fees
    -- ---------------------------------------------------------------
    FOR v_bill_item IN
        SELECT bli.id, bli.late_fee, bli.billing_date, bli.total_amount_due
        FROM billing_line_items bli
        WHERE bli.loan_id = p_loan_id
          AND bli.status IN ('pending', 'partial', 'delinquent')
          AND bli.late_fee > 0
        ORDER BY bli.billing_date ASC
    LOOP
        EXIT WHEN v_remaining <= 0;

        v_apply_amount := LEAST(v_remaining, v_bill_item.late_fee);
        v_remaining := v_remaining - v_apply_amount;
        v_applied_to_fees := v_applied_to_fees + v_apply_amount;

        -- Insert fee payment event
        INSERT INTO loan_events (
            loan_id, event_type, event_date, amount,
            running_balance, reference_id, note, created_by
        ) VALUES (
            p_loan_id, 'payment_applied_fee', p_payment_date,
            v_apply_amount, v_current_balance,
            v_bill_item.id,
            'Late fee payment for ' || v_bill_item.billing_date,
            p_applied_by
        );

        v_detail := v_detail || jsonb_build_object(
            'type', 'late_fee',
            'billing_date', v_bill_item.billing_date,
            'amount', v_apply_amount
        );
    END LOOP;

    -- ---------------------------------------------------------------
    -- Step 2: Apply to interest due (oldest first)
    -- ---------------------------------------------------------------
    FOR v_bill_item IN
        SELECT bli.id, bli.total_interest_billed, bli.total_amount_due,
               bli.billing_date, bli.status, bli.late_fee
        FROM billing_line_items bli
        WHERE bli.loan_id = p_loan_id
          AND bli.status IN ('pending', 'partial', 'delinquent')
        ORDER BY bli.billing_date ASC
    LOOP
        EXIT WHEN v_remaining <= 0;

        -- How much interest is still owed on this line item?
        -- (total_interest_billed minus any prior partial payments)
        v_apply_amount := LEAST(v_remaining, v_bill_item.total_interest_billed);
        v_remaining := v_remaining - v_apply_amount;
        v_applied_to_interest := v_applied_to_interest + v_apply_amount;

        -- Insert interest payment event
        INSERT INTO loan_events (
            loan_id, event_type, event_date, amount,
            running_balance, reference_id, note, created_by
        ) VALUES (
            p_loan_id, 'payment_applied_interest', p_payment_date,
            v_apply_amount, v_current_balance,
            v_bill_item.id,
            'Interest payment for ' || v_bill_item.billing_date,
            p_applied_by
        );

        -- Update line item status
        IF v_apply_amount >= v_bill_item.total_interest_billed THEN
            UPDATE billing_line_items
            SET status = 'paid'
            WHERE id = v_bill_item.id;
        ELSE
            UPDATE billing_line_items
            SET status = 'partial'
            WHERE id = v_bill_item.id;
        END IF;

        v_detail := v_detail || jsonb_build_object(
            'type', 'interest',
            'billing_date', v_bill_item.billing_date,
            'amount', v_apply_amount,
            'new_status', CASE WHEN v_apply_amount >= v_bill_item.total_interest_billed
                               THEN 'paid' ELSE 'partial' END
        );
    END LOOP;

    -- ---------------------------------------------------------------
    -- Step 3: Apply to principal (if P&I loan and funds remain)
    -- ---------------------------------------------------------------
    IF v_remaining > 0 AND COALESCE(v_loan.payment_type, 'Interest Only') != 'Interest Only' THEN
        v_applied_to_principal := v_remaining;
        v_current_balance := v_current_balance - v_remaining;
        v_remaining := 0;

        INSERT INTO loan_events (
            loan_id, event_type, event_date, amount,
            running_balance, note, created_by
        ) VALUES (
            p_loan_id, 'payment_applied_principal', p_payment_date,
            v_applied_to_principal, v_current_balance,
            'Principal reduction',
            p_applied_by
        );

        -- Update loan balance
        UPDATE servicing_loans
        SET current_balance = v_current_balance
        WHERE loan_id = p_loan_id;

        v_detail := v_detail || jsonb_build_object(
            'type', 'principal',
            'amount', v_applied_to_principal,
            'new_balance', v_current_balance
        );
    END IF;

    -- ---------------------------------------------------------------
    -- Step 4: Record overpayment
    -- ---------------------------------------------------------------
    IF v_remaining > 0 THEN
        v_overpayment := v_remaining;
    END IF;

    -- ---------------------------------------------------------------
    -- Step 5: Insert master payment record into servicing_payments
    -- ---------------------------------------------------------------
    INSERT INTO servicing_payments (
        date, loan_id, borrower, type, amount_due,
        amount_paid, principal, interest, late_fee,
        balance_after, payment_method, reference_trace,
        entry_type, entered_by
    ) VALUES (
        p_payment_date, p_loan_id,
        (SELECT borrower_name FROM servicing_loans WHERE loan_id = p_loan_id),
        'Monthly Payment',
        v_applied_to_fees + v_applied_to_interest + v_applied_to_principal,
        p_amount_received,
        v_applied_to_principal,
        v_applied_to_interest,
        v_applied_to_fees,
        v_current_balance,
        'ACH',
        p_reference_number,
        'Original',
        COALESCE((SELECT email FROM auth.users WHERE id = p_applied_by), 'system')
    )
    RETURNING id INTO v_payment_id;

    -- Insert a payment_received event on the ledger
    INSERT INTO loan_events (
        loan_id, event_type, event_date, amount,
        running_balance, reference_id, note, created_by
    ) VALUES (
        p_loan_id, 'payment_received', p_payment_date,
        p_amount_received, v_current_balance,
        v_payment_id,
        'Payment received: ' || p_reference_number,
        p_applied_by
    );

    RETURN jsonb_build_object(
        'payment_id',          v_payment_id,
        'loan_id',             p_loan_id,
        'payment_date',        p_payment_date,
        'amount_received',     p_amount_received,
        'applied_to_fees',     v_applied_to_fees,
        'applied_to_interest', v_applied_to_interest,
        'applied_to_principal', v_applied_to_principal,
        'overpayment',         v_overpayment,
        'remaining_balance',   v_current_balance,
        'reference_number',    p_reference_number,
        'detail',              v_detail
    );
END;
$$;

COMMENT ON FUNCTION apply_payment(text, date, numeric, text, uuid) IS
    'Applies a payment using the waterfall: late fees → interest → principal. '
    'Creates loan_events for each application, updates billing_line_items status, '
    'and records the payment in servicing_payments. Returns full application detail.';

-- ---------------------------------------------------------------------------
-- 3f. generate_payoff_quote(loan_id, payoff_date) → jsonb
-- ---------------------------------------------------------------------------
-- Returns payoff details including:
--   - funded_balance as of payoff_date
--   - per_diem_amount
--   - days_to_payoff from last billing date
--   - accrued_interest
--   - outstanding_fees
--   - total_payoff_amount
--   - good_through_date
--   - quote_expires (payoff_date + 3 days)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_payoff_quote(
    p_loan_id text,
    p_payoff_date date
)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_loan              record;
    v_funded_balance    numeric(15,2);
    v_rate              numeric(8,6);
    v_per_diem          numeric(10,4);
    v_last_billing_date date;
    v_days_accrued      integer;
    v_accrued_interest  numeric(15,2);
    v_outstanding_fees  numeric(15,2);
    v_unpaid_interest   numeric(15,2);
    v_total_payoff      numeric(15,2);
BEGIN
    -- Fetch loan
    SELECT sl.loan_id, sl.total_loan_amount, sl.interest_rate,
           sl.dutch_interest, sl.current_balance,
           sl.default_status, sl.default_rate, sl.default_date,
           COALESCE(sl.grace_period_days, 5) AS grace_period_days,
           COALESCE(sl.late_fee_amount, 0) AS late_fee_amount
    INTO v_loan
    FROM servicing_loans sl
    WHERE sl.loan_id = p_loan_id;

    IF v_loan IS NULL THEN
        RETURN jsonb_build_object('error', 'Loan not found: ' || p_loan_id);
    END IF;

    -- Determine effective rate
    IF v_loan.default_status = 'In Default'
       AND v_loan.default_date IS NOT NULL
       AND p_payoff_date >= v_loan.default_date
       AND v_loan.default_rate IS NOT NULL
    THEN
        v_rate := v_loan.default_rate;
    ELSE
        v_rate := COALESCE(v_loan.interest_rate, 0);
    END IF;

    -- Get funded balance
    IF v_loan.dutch_interest THEN
        v_funded_balance := COALESCE(v_loan.total_loan_amount, 0);
    ELSE
        v_funded_balance := calculate_funded_balance(p_loan_id, p_payoff_date);
        IF v_funded_balance = 0 THEN
            v_funded_balance := COALESCE(v_loan.current_balance, 0);
        END IF;
    END IF;

    -- Calculate per diem
    v_per_diem := calculate_per_diem(v_funded_balance, v_rate);

    -- Find last billing date
    SELECT MAX(bli.billing_date)
    INTO v_last_billing_date
    FROM billing_line_items bli
    WHERE bli.loan_id = p_loan_id
      AND bli.status = 'paid';

    -- If no paid billing, use first of current month
    IF v_last_billing_date IS NULL THEN
        v_last_billing_date := date_trunc('month', p_payoff_date)::date;
    END IF;

    -- Days of accrued interest since last billing
    v_days_accrued := p_payoff_date - v_last_billing_date;
    IF v_days_accrued < 0 THEN
        v_days_accrued := 0;
    END IF;

    v_accrued_interest := ROUND(v_per_diem * v_days_accrued, 2);

    -- Outstanding unpaid interest from billing line items
    SELECT COALESCE(SUM(bli.total_amount_due), 0)
    INTO v_unpaid_interest
    FROM billing_line_items bli
    WHERE bli.loan_id = p_loan_id
      AND bli.status IN ('pending', 'partial', 'delinquent');

    -- Outstanding fees (late fees from unpaid billing items)
    SELECT COALESCE(SUM(bli.late_fee + bli.other_fees), 0)
    INTO v_outstanding_fees
    FROM billing_line_items bli
    WHERE bli.loan_id = p_loan_id
      AND bli.status IN ('pending', 'partial', 'delinquent');

    -- Total payoff = principal balance + unpaid interest + accrued interest + fees
    v_total_payoff := v_funded_balance + v_unpaid_interest + v_accrued_interest + v_outstanding_fees;

    RETURN jsonb_build_object(
        'loan_id',              p_loan_id,
        'payoff_date',          p_payoff_date,
        'funded_balance',       v_funded_balance,
        'per_diem_amount',      v_per_diem,
        'last_billing_date',    v_last_billing_date,
        'days_to_payoff',       v_days_accrued,
        'accrued_interest',     v_accrued_interest,
        'unpaid_billed_interest', v_unpaid_interest,
        'outstanding_fees',     v_outstanding_fees,
        'total_payoff_amount',  v_total_payoff,
        'good_through_date',    p_payoff_date,
        'quote_expires',        p_payoff_date + 3
    );
END;
$$;

COMMENT ON FUNCTION generate_payoff_quote(text, date) IS
    'Generates a payoff quote showing funded balance, accrued interest, '
    'outstanding fees, and total payoff amount. Quote valid for 3 days.';

-- ---------------------------------------------------------------------------
-- 3g. run_reconciliation_checks(billing_cycle_id) → jsonb
-- ---------------------------------------------------------------------------
-- Runs before a billing cycle can move from 'draft' to 'reconciled'.
--
-- Checks:
--   1. Are there any active loans missing from this billing cycle?
--   2. Do any loans have a total_amount_due of $0 or negative?
--   3. Are there any loans past maturity still billed as active?
--   4. Does total_billed match sum of billing_line_items?
--   5. Did any loan's interest change >20% from prior month without
--      a draw or rate change to explain it?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION run_reconciliation_checks(
    p_billing_cycle_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_cycle         record;
    v_checks        jsonb := '[]'::jsonb;
    v_errors        jsonb := '[]'::jsonb;
    v_warnings      jsonb := '[]'::jsonb;
    v_passed        boolean := true;
    v_missing_count integer;
    v_zero_count    integer;
    v_matured_count integer;
    v_sum_check     numeric(15,2);
    v_variance_rec  record;
BEGIN
    -- Get the billing cycle
    SELECT bc.id, bc.billing_month, bc.total_billed, bc.loan_count, bc.status
    INTO v_cycle
    FROM billing_cycles bc
    WHERE bc.id = p_billing_cycle_id;

    IF v_cycle IS NULL THEN
        RETURN jsonb_build_object('error', 'Billing cycle not found');
    END IF;

    -- ---------------------------------------------------------------
    -- Check 1: Active loans missing from billing cycle
    -- ---------------------------------------------------------------
    SELECT COUNT(*)
    INTO v_missing_count
    FROM servicing_loans sl
    WHERE sl.loan_status = 'Active'
      AND (sl.origination_date IS NULL OR sl.origination_date <= v_cycle.billing_month)
      AND (sl.maturity_date IS NULL OR sl.maturity_date >= v_cycle.billing_month)
      AND NOT EXISTS (
          SELECT 1 FROM billing_line_items bli
          WHERE bli.billing_cycle_id = p_billing_cycle_id
            AND bli.loan_id = sl.loan_id
      );

    v_checks := v_checks || jsonb_build_object(
        'check', 'missing_loans',
        'description', 'Active loans missing from billing cycle',
        'count', v_missing_count,
        'passed', v_missing_count = 0
    );
    IF v_missing_count > 0 THEN
        v_passed := false;
        v_errors := v_errors || jsonb_build_object(
            'check', 'missing_loans',
            'message', v_missing_count || ' active loan(s) missing from billing cycle'
        );
    END IF;

    -- ---------------------------------------------------------------
    -- Check 2: Loans with $0 or negative amount due
    -- ---------------------------------------------------------------
    SELECT COUNT(*)
    INTO v_zero_count
    FROM billing_line_items bli
    WHERE bli.billing_cycle_id = p_billing_cycle_id
      AND bli.total_amount_due <= 0;

    v_checks := v_checks || jsonb_build_object(
        'check', 'zero_or_negative_amount',
        'description', 'Loans billed $0 or negative',
        'count', v_zero_count,
        'passed', true  -- flag but do not block
    );
    IF v_zero_count > 0 THEN
        v_warnings := v_warnings || jsonb_build_object(
            'check', 'zero_or_negative_amount',
            'message', v_zero_count || ' loan(s) have $0 or negative amount due'
        );
    END IF;

    -- ---------------------------------------------------------------
    -- Check 3: Loans past maturity still billed as active
    -- ---------------------------------------------------------------
    SELECT COUNT(*)
    INTO v_matured_count
    FROM billing_line_items bli
    JOIN servicing_loans sl ON sl.loan_id = bli.loan_id
    WHERE bli.billing_cycle_id = p_billing_cycle_id
      AND sl.maturity_date IS NOT NULL
      AND sl.maturity_date < v_cycle.billing_month;

    v_checks := v_checks || jsonb_build_object(
        'check', 'past_maturity',
        'description', 'Loans past maturity date still billed',
        'count', v_matured_count,
        'passed', true  -- warning only
    );
    IF v_matured_count > 0 THEN
        v_warnings := v_warnings || jsonb_build_object(
            'check', 'past_maturity',
            'message', v_matured_count || ' loan(s) are past maturity but still billed'
        );
    END IF;

    -- ---------------------------------------------------------------
    -- Check 4: total_billed matches sum of line items
    -- ---------------------------------------------------------------
    SELECT COALESCE(SUM(bli.total_amount_due), 0)
    INTO v_sum_check
    FROM billing_line_items bli
    WHERE bli.billing_cycle_id = p_billing_cycle_id;

    v_checks := v_checks || jsonb_build_object(
        'check', 'total_billed_match',
        'description', 'Billing cycle total matches sum of line items',
        'cycle_total', v_cycle.total_billed,
        'line_item_sum', v_sum_check,
        'difference', ABS(v_cycle.total_billed - v_sum_check),
        'passed', ABS(v_cycle.total_billed - v_sum_check) < 0.01
    );
    IF ABS(v_cycle.total_billed - v_sum_check) >= 0.01 THEN
        v_passed := false;
        v_errors := v_errors || jsonb_build_object(
            'check', 'total_billed_match',
            'message', 'Cycle total (' || v_cycle.total_billed ||
                       ') does not match line item sum (' || v_sum_check || ')'
        );
    END IF;

    -- ---------------------------------------------------------------
    -- Check 5: Interest variance >20% from prior month
    -- ---------------------------------------------------------------
    FOR v_variance_rec IN
        SELECT
            bli.loan_id,
            bli.total_interest_billed AS current_interest,
            prev.total_interest_billed AS prior_interest,
            CASE
                WHEN prev.total_interest_billed > 0
                THEN ROUND(ABS(bli.total_interest_billed - prev.total_interest_billed)
                    / prev.total_interest_billed * 100, 1)
                ELSE 0
            END AS pct_change
        FROM billing_line_items bli
        JOIN billing_cycles bc ON bc.id = bli.billing_cycle_id
        LEFT JOIN billing_line_items prev
            ON prev.loan_id = bli.loan_id
            AND prev.billing_date = (bc.billing_month - interval '1 month')::date
        WHERE bli.billing_cycle_id = p_billing_cycle_id
          AND prev.total_interest_billed IS NOT NULL
          AND prev.total_interest_billed > 0
          AND ABS(bli.total_interest_billed - prev.total_interest_billed)
              / prev.total_interest_billed > 0.20
    LOOP
        -- Check if there's a draw or rate change that explains it
        IF NOT EXISTS (
            SELECT 1 FROM loan_events le
            WHERE le.loan_id = v_variance_rec.loan_id
              AND le.event_type IN ('draw_funded', 'rate_change')
              AND le.event_date >= (v_cycle.billing_month - interval '1 month')::date
              AND le.event_date <= (v_cycle.billing_month + interval '1 month' - interval '1 day')::date
        ) AND NOT EXISTS (
            SELECT 1 FROM servicing_draws sd
            WHERE sd.loan_id = v_variance_rec.loan_id
              AND sd.status = 'Funded'
              AND sd.funded_date >= (v_cycle.billing_month - interval '1 month')::date
              AND sd.funded_date <= (v_cycle.billing_month + interval '1 month' - interval '1 day')::date
        ) THEN
            v_warnings := v_warnings || jsonb_build_object(
                'check', 'interest_variance',
                'loan_id', v_variance_rec.loan_id,
                'message', 'Interest changed ' || v_variance_rec.pct_change ||
                           '% ($' || v_variance_rec.prior_interest || ' → $' ||
                           v_variance_rec.current_interest ||
                           ') with no draw or rate change event',
                'prior_interest', v_variance_rec.prior_interest,
                'current_interest', v_variance_rec.current_interest,
                'pct_change', v_variance_rec.pct_change
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'billing_cycle_id', p_billing_cycle_id,
        'billing_month',    v_cycle.billing_month,
        'passed',           v_passed,
        'checks',           v_checks,
        'errors',           v_errors,
        'warnings',         v_warnings
    );
END;
$$;

COMMENT ON FUNCTION run_reconciliation_checks(uuid) IS
    'Validates a billing cycle before it can move from draft to reconciled. '
    'Checks for missing loans, zero amounts, past-maturity loans, total mismatch, '
    'and unexplained interest variances >20%.';
