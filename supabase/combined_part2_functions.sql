-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE - PART 2 of 3
-- All PostgreSQL Calculation Functions
-- Run this SECOND in Supabase SQL Editor (after Part 1)
-- =============================================================================

-- ===================== calculate_funded_balance =====================

CREATE OR REPLACE FUNCTION calculate_funded_balance(p_loan_id text, p_as_of_date date)
RETURNS numeric LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_balance numeric(15,2);
    v_has_origination boolean;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM loan_events
        WHERE loan_id = p_loan_id
          AND event_type = 'origination'
          AND event_date <= p_as_of_date
    ) INTO v_has_origination;

    IF NOT v_has_origination THEN
        RETURN 0;
    END IF;

    SELECT le.running_balance INTO v_balance
    FROM loan_events le
    WHERE le.loan_id = p_loan_id
      AND le.event_date <= p_as_of_date
    ORDER BY le.event_date DESC, le.created_at DESC
    LIMIT 1;

    RETURN COALESCE(v_balance, 0);
END;
$$;


-- ===================== calculate_per_diem =====================

CREATE OR REPLACE FUNCTION calculate_per_diem(p_balance numeric, p_annual_rate numeric)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    IF p_balance IS NULL OR p_annual_rate IS NULL THEN
        RETURN 0;
    END IF;
    RETURN ROUND(p_balance * p_annual_rate / 360.0, 4);
END;
$$;


-- ===================== calculate_interest_for_period =====================

CREATE OR REPLACE FUNCTION calculate_interest_for_period(p_loan_id text, p_billing_month date)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
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
    SELECT
        sl.loan_id, sl.total_loan_amount, sl.interest_rate, sl.dutch_interest,
        sl.loan_status, sl.origination_date, sl.maturity_date,
        sl.default_status, sl.default_rate, sl.default_date,
        COALESCE(sl.interest_method, CASE WHEN sl.dutch_interest THEN 'dutch' ELSE 'non_dutch' END) AS eff_interest_method
    INTO v_loan
    FROM servicing_loans sl
    WHERE sl.loan_id = p_loan_id;

    IF v_loan IS NULL THEN
        RETURN jsonb_build_object('error', 'Loan not found: ' || p_loan_id);
    END IF;

    v_period_start := p_billing_month;
    v_period_end := (p_billing_month + interval '1 month' - interval '1 day')::date;
    v_days_in_period := v_period_end - v_period_start + 1;

    -- Use default rate if loan is in default
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

    -- DUTCH: charge on full committed amount
    IF v_is_dutch THEN
        v_funded_balance := v_committed_balance;
        v_per_diem := calculate_per_diem(v_committed_balance, v_rate);
        v_base_interest := ROUND(v_committed_balance * v_rate / 360.0 * v_days_in_period, 2);
        v_draw_proration := 0;
        v_total_interest := v_base_interest;

    -- NON-DUTCH: charge on funded balance + draw proration
    ELSE
        v_funded_balance := calculate_funded_balance(p_loan_id, v_period_start);

        -- Fallback to legacy draws if no events
        IF v_funded_balance = 0 THEN
            SELECT COALESCE(SUM(d.amount), 0) INTO v_funded_balance
            FROM servicing_draws d
            WHERE d.loan_id = p_loan_id
              AND d.status = 'Funded'
              AND d.funded_date <= v_period_start;
        END IF;

        v_per_diem := calculate_per_diem(v_funded_balance, v_rate);
        v_base_interest := ROUND(v_funded_balance * v_rate / 360.0 * v_days_in_period, 2);

        -- Event-based mid-month draws
        FOR v_draw_rec IN
            SELECT le.amount AS draw_amount, le.event_date AS funded_date,
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

        -- Fallback to legacy servicing_draws for mid-month draws
        IF v_draw_detail = '[]'::jsonb THEN
            FOR v_draw_rec IN
                SELECT d.amount AS draw_amount, d.funded_date,
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

    RETURN jsonb_build_object(
        'loan_id', p_loan_id,
        'billing_month', p_billing_month,
        'interest_method', CASE WHEN v_is_dutch THEN 'dutch' ELSE 'non_dutch' END,
        'committed_balance', v_committed_balance,
        'funded_balance', v_funded_balance,
        'interest_rate', v_rate,
        'days_in_period', v_days_in_period,
        'per_diem', v_per_diem,
        'base_interest', v_base_interest,
        'draw_proration_detail', v_draw_detail,
        'draw_proration_total', v_draw_proration,
        'total_interest', v_total_interest
    );
END;
$$;


-- ===================== generate_billing_cycle =====================

CREATE OR REPLACE FUNCTION generate_billing_cycle(p_billing_month date, p_created_by uuid)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
    v_cycle_id       uuid;
    v_loan           record;
    v_calc           jsonb;
    v_total_billed   numeric(15,2) := 0;
    v_loan_count     integer := 0;
    v_interest_method interest_method_type;
BEGIN
    IF EXISTS (SELECT 1 FROM billing_cycles WHERE billing_month = p_billing_month) THEN
        RAISE EXCEPTION 'A billing cycle already exists for %', p_billing_month;
    END IF;

    INSERT INTO billing_cycles (billing_month, status, generated_by)
    VALUES (p_billing_month, 'draft', p_created_by)
    RETURNING id INTO v_cycle_id;

    FOR v_loan IN
        SELECT sl.loan_id, sl.dutch_interest
        FROM servicing_loans sl
        WHERE sl.loan_status = 'Active'
          AND (sl.origination_date IS NULL OR sl.origination_date <= p_billing_month)
          AND (sl.maturity_date IS NULL OR sl.maturity_date >= p_billing_month)
        ORDER BY sl.loan_id
    LOOP
        v_calc := calculate_interest_for_period(v_loan.loan_id, p_billing_month);

        IF v_calc ? 'error' THEN
            CONTINUE;
        END IF;

        v_interest_method := CASE
            WHEN (v_calc ->> 'interest_method') = 'dutch' THEN 'dutch'::interest_method_type
            ELSE 'non_dutch'::interest_method_type
        END;

        INSERT INTO billing_line_items (
            billing_cycle_id, loan_id, billing_date, days_in_period, interest_method,
            funded_balance, committed_balance, interest_rate, per_diem, base_interest,
            draw_proration_adjustment, total_interest_billed, late_fee, other_fees,
            total_amount_due, status, calculation_detail
        ) VALUES (
            v_cycle_id, v_loan.loan_id, p_billing_month,
            (v_calc ->> 'days_in_period')::integer, v_interest_method,
            (v_calc ->> 'funded_balance')::numeric, (v_calc ->> 'committed_balance')::numeric,
            (v_calc ->> 'interest_rate')::numeric, (v_calc ->> 'per_diem')::numeric,
            (v_calc ->> 'base_interest')::numeric, (v_calc ->> 'draw_proration_total')::numeric,
            (v_calc ->> 'total_interest')::numeric, 0, 0,
            (v_calc ->> 'total_interest')::numeric, 'pending', v_calc
        );

        v_total_billed := v_total_billed + (v_calc ->> 'total_interest')::numeric;
        v_loan_count := v_loan_count + 1;
    END LOOP;

    UPDATE billing_cycles
    SET total_billed = v_total_billed, loan_count = v_loan_count
    WHERE id = v_cycle_id;

    RETURN v_cycle_id;
END;
$$;


-- ===================== apply_payment =====================

CREATE OR REPLACE FUNCTION apply_payment(
    p_loan_id text,
    p_payment_date date,
    p_amount_received numeric,
    p_reference_number text,
    p_applied_by uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    v_remaining          numeric(15,2);
    v_applied_to_fees    numeric(15,2) := 0;
    v_applied_to_interest numeric(15,2) := 0;
    v_applied_to_principal numeric(15,2) := 0;
    v_overpayment        numeric(15,2) := 0;
    v_bill_item          record;
    v_apply_amount       numeric(15,2);
    v_current_balance    numeric(15,2);
    v_payment_id         uuid;
    v_loan               record;
    v_detail             jsonb := '[]'::jsonb;
BEGIN
    SELECT sl.loan_id, sl.payment_type, sl.current_balance
    INTO v_loan
    FROM servicing_loans sl
    WHERE sl.loan_id = p_loan_id;

    IF v_loan IS NULL THEN
        RETURN jsonb_build_object('error', 'Loan not found: ' || p_loan_id);
    END IF;

    v_remaining := p_amount_received;
    v_current_balance := COALESCE(v_loan.current_balance, 0);

    -- Step 1: Apply to late fees (oldest first)
    FOR v_bill_item IN
        SELECT bli.id, bli.late_fee, bli.billing_date
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

        INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, reference_id, note, created_by)
        VALUES (p_loan_id, 'payment_applied_fee', p_payment_date, v_apply_amount, v_current_balance,
                v_bill_item.id, 'Late fee payment for ' || v_bill_item.billing_date, p_applied_by);

        v_detail := v_detail || jsonb_build_object(
            'type', 'late_fee', 'billing_date', v_bill_item.billing_date, 'amount', v_apply_amount
        );
    END LOOP;

    -- Step 2: Apply to interest (oldest first)
    FOR v_bill_item IN
        SELECT bli.id, bli.total_interest_billed, bli.billing_date, bli.status
        FROM billing_line_items bli
        WHERE bli.loan_id = p_loan_id
          AND bli.status IN ('pending', 'partial', 'delinquent')
        ORDER BY bli.billing_date ASC
    LOOP
        EXIT WHEN v_remaining <= 0;
        v_apply_amount := LEAST(v_remaining, v_bill_item.total_interest_billed);
        v_remaining := v_remaining - v_apply_amount;
        v_applied_to_interest := v_applied_to_interest + v_apply_amount;

        INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, reference_id, note, created_by)
        VALUES (p_loan_id, 'payment_applied_interest', p_payment_date, v_apply_amount, v_current_balance,
                v_bill_item.id, 'Interest payment for ' || v_bill_item.billing_date, p_applied_by);

        IF v_apply_amount >= v_bill_item.total_interest_billed THEN
            UPDATE billing_line_items SET status = 'paid' WHERE id = v_bill_item.id;
        ELSE
            UPDATE billing_line_items SET status = 'partial' WHERE id = v_bill_item.id;
        END IF;

        v_detail := v_detail || jsonb_build_object(
            'type', 'interest', 'billing_date', v_bill_item.billing_date, 'amount', v_apply_amount,
            'new_status', CASE WHEN v_apply_amount >= v_bill_item.total_interest_billed THEN 'paid' ELSE 'partial' END
        );
    END LOOP;

    -- Step 3: Apply to principal (P&I loans only)
    IF v_remaining > 0 AND COALESCE(v_loan.payment_type, 'Interest Only') != 'Interest Only' THEN
        v_applied_to_principal := v_remaining;
        v_current_balance := v_current_balance - v_remaining;
        v_remaining := 0;

        INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, note, created_by)
        VALUES (p_loan_id, 'payment_applied_principal', p_payment_date, v_applied_to_principal,
                v_current_balance, 'Principal reduction', p_applied_by);

        UPDATE servicing_loans SET current_balance = v_current_balance WHERE loan_id = p_loan_id;

        v_detail := v_detail || jsonb_build_object(
            'type', 'principal', 'amount', v_applied_to_principal, 'new_balance', v_current_balance
        );
    END IF;

    IF v_remaining > 0 THEN
        v_overpayment := v_remaining;
    END IF;

    -- Record payment in servicing_payments
    INSERT INTO servicing_payments (
        date, loan_id, borrower, type, amount_due, amount_paid,
        principal, interest, late_fee, balance_after,
        payment_method, reference_trace, entry_type, entered_by
    ) VALUES (
        p_payment_date, p_loan_id,
        (SELECT borrower_name FROM servicing_loans WHERE loan_id = p_loan_id),
        'Monthly Payment',
        v_applied_to_fees + v_applied_to_interest + v_applied_to_principal,
        p_amount_received,
        v_applied_to_principal, v_applied_to_interest, v_applied_to_fees,
        v_current_balance, 'ACH', p_reference_number, 'Original',
        COALESCE((SELECT email FROM auth.users WHERE id = p_applied_by), 'system')
    ) RETURNING id INTO v_payment_id;

    -- Record the payment event
    INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, reference_id, note, created_by)
    VALUES (p_loan_id, 'payment_received', p_payment_date, p_amount_received, v_current_balance,
            v_payment_id, 'Payment received: ' || p_reference_number, p_applied_by);

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'loan_id', p_loan_id,
        'payment_date', p_payment_date,
        'amount_received', p_amount_received,
        'applied_to_fees', v_applied_to_fees,
        'applied_to_interest', v_applied_to_interest,
        'applied_to_principal', v_applied_to_principal,
        'overpayment', v_overpayment,
        'remaining_balance', v_current_balance,
        'reference_number', p_reference_number,
        'detail', v_detail
    );
END;
$$;


-- ===================== generate_payoff_quote =====================

CREATE OR REPLACE FUNCTION generate_payoff_quote(p_loan_id text, p_payoff_date date)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
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
    SELECT sl.loan_id, sl.total_loan_amount, sl.interest_rate, sl.dutch_interest,
           sl.current_balance, sl.default_status, sl.default_rate, sl.default_date
    INTO v_loan
    FROM servicing_loans sl
    WHERE sl.loan_id = p_loan_id;

    IF v_loan IS NULL THEN
        RETURN jsonb_build_object('error', 'Loan not found: ' || p_loan_id);
    END IF;

    -- Use default rate if in default
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

    v_per_diem := calculate_per_diem(v_funded_balance, v_rate);

    -- Find last paid billing date
    SELECT MAX(bli.billing_date) INTO v_last_billing_date
    FROM billing_line_items bli
    WHERE bli.loan_id = p_loan_id AND bli.status = 'paid';

    IF v_last_billing_date IS NULL THEN
        v_last_billing_date := date_trunc('month', p_payoff_date)::date;
    END IF;

    v_days_accrued := GREATEST(p_payoff_date - v_last_billing_date, 0);
    v_accrued_interest := ROUND(v_per_diem * v_days_accrued, 2);

    -- Sum unpaid interest and fees
    SELECT COALESCE(SUM(bli.total_amount_due), 0) INTO v_unpaid_interest
    FROM billing_line_items bli
    WHERE bli.loan_id = p_loan_id AND bli.status IN ('pending', 'partial', 'delinquent');

    SELECT COALESCE(SUM(bli.late_fee + bli.other_fees), 0) INTO v_outstanding_fees
    FROM billing_line_items bli
    WHERE bli.loan_id = p_loan_id AND bli.status IN ('pending', 'partial', 'delinquent');

    v_total_payoff := v_funded_balance + v_unpaid_interest + v_accrued_interest + v_outstanding_fees;

    RETURN jsonb_build_object(
        'loan_id', p_loan_id,
        'payoff_date', p_payoff_date,
        'funded_balance', v_funded_balance,
        'per_diem_amount', v_per_diem,
        'last_billing_date', v_last_billing_date,
        'days_to_payoff', v_days_accrued,
        'accrued_interest', v_accrued_interest,
        'unpaid_billed_interest', v_unpaid_interest,
        'outstanding_fees', v_outstanding_fees,
        'total_payoff_amount', v_total_payoff,
        'good_through_date', p_payoff_date,
        'quote_expires', p_payoff_date + 3
    );
END;
$$;
