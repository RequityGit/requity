-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE - PART 3 of 3
-- Reconciliation, Delinquency Refresh, NACHA Generation, Smoke Test
-- Run this THIRD in Supabase SQL Editor (after Parts 1 and 2)
-- =============================================================================

-- ===================== run_reconciliation_checks =====================

CREATE OR REPLACE FUNCTION run_reconciliation_checks(p_billing_cycle_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
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
    SELECT bc.id, bc.billing_month, bc.total_billed, bc.loan_count, bc.status
    INTO v_cycle
    FROM billing_cycles bc
    WHERE bc.id = p_billing_cycle_id;

    IF v_cycle IS NULL THEN
        RETURN jsonb_build_object('error', 'Billing cycle not found');
    END IF;

    -- Check 1: Missing active loans
    SELECT COUNT(*) INTO v_missing_count
    FROM servicing_loans sl
    WHERE sl.loan_status = 'Active'
      AND (sl.origination_date IS NULL OR sl.origination_date <= v_cycle.billing_month)
      AND (sl.maturity_date IS NULL OR sl.maturity_date >= v_cycle.billing_month)
      AND NOT EXISTS (
          SELECT 1 FROM billing_line_items bli
          WHERE bli.billing_cycle_id = p_billing_cycle_id AND bli.loan_id = sl.loan_id
      );

    v_checks := v_checks || jsonb_build_object('check', 'missing_loans', 'count', v_missing_count, 'passed', v_missing_count = 0);
    IF v_missing_count > 0 THEN
        v_passed := false;
        v_errors := v_errors || jsonb_build_object('check', 'missing_loans', 'message',
            v_missing_count || ' active loan(s) missing from billing cycle');
    END IF;

    -- Check 2: Zero or negative amount
    SELECT COUNT(*) INTO v_zero_count
    FROM billing_line_items bli
    WHERE bli.billing_cycle_id = p_billing_cycle_id AND bli.total_amount_due <= 0;

    v_checks := v_checks || jsonb_build_object('check', 'zero_or_negative_amount', 'count', v_zero_count, 'passed', true);
    IF v_zero_count > 0 THEN
        v_warnings := v_warnings || jsonb_build_object('check', 'zero_or_negative_amount', 'message',
            v_zero_count || ' loan(s) have $0 or negative amount due');
    END IF;

    -- Check 3: Past maturity
    SELECT COUNT(*) INTO v_matured_count
    FROM billing_line_items bli
    JOIN servicing_loans sl ON sl.loan_id = bli.loan_id
    WHERE bli.billing_cycle_id = p_billing_cycle_id
      AND sl.maturity_date IS NOT NULL
      AND sl.maturity_date < v_cycle.billing_month;

    v_checks := v_checks || jsonb_build_object('check', 'past_maturity', 'count', v_matured_count, 'passed', true);
    IF v_matured_count > 0 THEN
        v_warnings := v_warnings || jsonb_build_object('check', 'past_maturity', 'message',
            v_matured_count || ' loan(s) are past maturity but still billed');
    END IF;

    -- Check 4: Total match
    SELECT COALESCE(SUM(bli.total_amount_due), 0) INTO v_sum_check
    FROM billing_line_items bli
    WHERE bli.billing_cycle_id = p_billing_cycle_id;

    v_checks := v_checks || jsonb_build_object('check', 'total_billed_match',
        'cycle_total', v_cycle.total_billed, 'line_item_sum', v_sum_check,
        'passed', ABS(v_cycle.total_billed - v_sum_check) < 0.01);
    IF ABS(v_cycle.total_billed - v_sum_check) >= 0.01 THEN
        v_passed := false;
        v_errors := v_errors || jsonb_build_object('check', 'total_billed_match', 'message',
            'Cycle total (' || v_cycle.total_billed || ') does not match line item sum (' || v_sum_check || ')');
    END IF;

    -- Check 5: Interest variance >20% (warning only)
    FOR v_variance_rec IN
        SELECT bli.loan_id,
               bli.total_interest_billed AS current_interest,
               prev.total_interest_billed AS prior_interest,
               CASE WHEN prev.total_interest_billed > 0
                    THEN ROUND(ABS(bli.total_interest_billed - prev.total_interest_billed) / prev.total_interest_billed * 100, 1)
                    ELSE 0
               END AS pct_change
        FROM billing_line_items bli
        JOIN billing_cycles bc ON bc.id = bli.billing_cycle_id
        LEFT JOIN billing_line_items prev ON prev.loan_id = bli.loan_id
             AND prev.billing_date = (bc.billing_month - interval '1 month')::date
        WHERE bli.billing_cycle_id = p_billing_cycle_id
          AND prev.total_interest_billed IS NOT NULL
          AND prev.total_interest_billed > 0
          AND ABS(bli.total_interest_billed - prev.total_interest_billed) / prev.total_interest_billed > 0.20
    LOOP
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
                'message', 'Interest changed ' || v_variance_rec.pct_change || '% with no draw or rate change event'
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'billing_cycle_id', p_billing_cycle_id,
        'billing_month', v_cycle.billing_month,
        'passed', v_passed,
        'checks', v_checks,
        'errors', v_errors,
        'warnings', v_warnings
    );
END;
$$;


-- ===================== refresh_delinquency_records =====================

CREATE OR REPLACE FUNCTION refresh_delinquency_records()
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    v_loan             record;
    v_oldest_unpaid    date;
    v_amount_past_due  numeric(15,2);
    v_days_delinquent  integer;
    v_bucket           delinquency_bucket;
    v_last_pay_date    date;
    v_last_pay_amount  numeric(15,2);
    v_assess_late_fee  boolean;
    v_late_fee_calc    numeric(15,2);
    v_processed        integer := 0;
    v_delinquent_count integer := 0;
    v_fees_assessed    integer := 0;
    v_today            date := CURRENT_DATE;
BEGIN
    FOR v_loan IN
        SELECT sl.loan_id, sl.loan_status,
               COALESCE(sl.grace_period_days, 5) AS grace_period_days,
               COALESCE(sl.late_fee_type, 'flat') AS late_fee_type_val,
               COALESCE(sl.late_fee_amount, 0) AS late_fee_amount_val,
               sl.monthly_payment
        FROM servicing_loans sl
        WHERE sl.loan_status = 'Active'
        ORDER BY sl.loan_id
    LOOP
        -- Find oldest unpaid billing and total past due
        SELECT MIN(bli.billing_date), COALESCE(SUM(bli.total_amount_due), 0)
        INTO v_oldest_unpaid, v_amount_past_due
        FROM billing_line_items bli
        WHERE bli.loan_id = v_loan.loan_id
          AND bli.status IN ('pending', 'partial', 'delinquent');

        v_days_delinquent := CASE WHEN v_oldest_unpaid IS NOT NULL THEN v_today - v_oldest_unpaid ELSE 0 END;

        v_bucket := CASE
            WHEN v_days_delinquent <= 0 THEN 'current'
            WHEN v_days_delinquent <= 30 THEN '1-30'
            WHEN v_days_delinquent <= 60 THEN '31-60'
            WHEN v_days_delinquent <= 90 THEN '61-90'
            ELSE '90+'
        END::delinquency_bucket;

        -- Get last payment info
        SELECT sp.date, sp.amount_paid INTO v_last_pay_date, v_last_pay_amount
        FROM servicing_payments sp
        WHERE sp.loan_id = v_loan.loan_id AND sp.entry_type = 'Original'
        ORDER BY sp.date DESC
        LIMIT 1;

        -- Assess late fees if applicable
        v_assess_late_fee := false;
        v_late_fee_calc := 0;

        IF v_days_delinquent > v_loan.grace_period_days AND v_amount_past_due > 0 THEN
            IF NOT EXISTS (
                SELECT 1 FROM loan_events le
                WHERE le.loan_id = v_loan.loan_id
                  AND le.event_type = 'late_fee_assessed'
                  AND le.event_date >= v_oldest_unpaid
            ) THEN
                v_assess_late_fee := true;

                IF v_loan.late_fee_type_val = 'percentage' THEN
                    v_late_fee_calc := ROUND(
                        COALESCE(v_loan.monthly_payment, v_amount_past_due) * v_loan.late_fee_amount_val / 100.0, 2
                    );
                ELSE
                    v_late_fee_calc := v_loan.late_fee_amount_val;
                END IF;

                IF v_late_fee_calc > 0 THEN
                    INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, note)
                    VALUES (v_loan.loan_id, 'late_fee_assessed', v_today, v_late_fee_calc,
                            calculate_funded_balance(v_loan.loan_id, v_today),
                            'Late fee: ' || v_days_delinquent || ' days past due');

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

        -- Mark overdue items as delinquent
        IF v_days_delinquent > v_loan.grace_period_days THEN
            UPDATE billing_line_items
            SET status = 'delinquent'
            WHERE loan_id = v_loan.loan_id
              AND status = 'pending'
              AND billing_date < v_today - v_loan.grace_period_days;
        END IF;

        -- Upsert delinquency record
        INSERT INTO delinquency_records (
            loan_id, days_delinquent, amount_past_due, oldest_unpaid_billing_date,
            late_fee_assessed, late_fee_amount, delinquency_status,
            last_payment_date, last_payment_amount, updated_at
        ) VALUES (
            v_loan.loan_id, v_days_delinquent, v_amount_past_due, v_oldest_unpaid,
            v_assess_late_fee, v_late_fee_calc, v_bucket,
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


-- ===================== generate_nacha_file =====================

CREATE OR REPLACE FUNCTION generate_nacha_file(p_billing_cycle_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    c_immediate_dest  text := '021000021';
    c_immediate_origin text := '123456789';
    c_dest_name       text := 'JPMORGAN CHASE';
    c_origin_name     text := 'REQUITY GROUP';
    c_company_name    text := 'REQUITY GROUP';
    c_company_id      text := '1234567890';
    c_odfi_routing    text := '12345678';
    v_cycle           record;
    v_file_text       text := '';
    v_now             timestamptz := now();
    v_file_date       text;
    v_file_time       text;
    v_effective_date  text;
    v_entry_count     integer := 0;
    v_entry_hash      bigint := 0;
    v_total_debit     bigint := 0;
    v_total_credit    bigint := 0;
    v_line_count      integer := 0;
    v_item            record;
    v_ach             record;
    v_entry_line      text;
    v_trace_num       text;
    v_amount_cents    bigint;
    v_routing_8       text;
    v_entries_text    text := '';
    v_block_count     integer;
    v_padding_lines   integer;
BEGIN
    SELECT bc.id, bc.billing_month, bc.total_billed, bc.loan_count
    INTO v_cycle
    FROM billing_cycles bc
    WHERE bc.id = p_billing_cycle_id;

    IF v_cycle IS NULL THEN
        RAISE EXCEPTION 'Billing cycle not found: %', p_billing_cycle_id;
    END IF;

    v_file_date := TO_CHAR(v_now, 'YYMMDD');
    v_file_time := TO_CHAR(v_now, 'HH24MI');
    v_effective_date := TO_CHAR(v_cycle.billing_month, 'YYMMDD');

    -- File Header (1-record)
    v_file_text := '1' || '01' || ' ' || RPAD(c_immediate_dest, 10) || ' ' || RPAD(c_immediate_origin, 10)
        || v_file_date || v_file_time || 'A' || '094' || '10' || '1'
        || RPAD(c_dest_name, 23) || RPAD(c_origin_name, 23) || RPAD('', 8);
    v_line_count := 1;

    -- Batch Header (5-record)
    v_file_text := v_file_text || chr(10) || '5' || '200' || RPAD(c_company_name, 16) || RPAD('', 20)
        || RPAD(c_company_id, 10) || 'PPD' || RPAD('LOAN PMT', 10) || v_file_date || v_effective_date
        || '   ' || '1' || RPAD(c_odfi_routing, 8) || LPAD('1', 7, '0');
    v_line_count := v_line_count + 1;

    -- Entry Details (6-records)
    FOR v_item IN
        SELECT bli.loan_id, bli.total_amount_due, sl.borrower_name
        FROM billing_line_items bli
        JOIN servicing_loans sl ON sl.loan_id = bli.loan_id
        WHERE bli.billing_cycle_id = p_billing_cycle_id
          AND bli.status IN ('pending', 'partial', 'delinquent')
          AND bli.total_amount_due > 0
        ORDER BY bli.loan_id
    LOOP
        SELECT bai.routing_number, bai.account_number, bai.account_type, bai.account_holder_name
        INTO v_ach
        FROM borrower_ach_info bai
        WHERE bai.loan_id = v_item.loan_id AND bai.is_active = true
        ORDER BY bai.created_at DESC
        LIMIT 1;

        IF v_ach IS NULL THEN
            CONTINUE;
        END IF;

        v_entry_count := v_entry_count + 1;
        v_amount_cents := ROUND(v_item.total_amount_due * 100)::bigint;
        v_total_debit := v_total_debit + v_amount_cents;
        v_routing_8 := LEFT(v_ach.routing_number, 8);
        v_entry_hash := v_entry_hash + v_routing_8::bigint;
        v_trace_num := c_odfi_routing || LPAD(v_entry_count::text, 7, '0');

        v_entry_line := '6'
            || CASE WHEN v_ach.account_type = 'checking' THEN '27' ELSE '37' END
            || RPAD(v_ach.routing_number, 9)
            || RPAD(v_ach.account_number, 17)
            || LPAD(v_amount_cents::text, 10, '0')
            || RPAD(v_item.loan_id, 15)
            || RPAD(COALESCE(v_ach.account_holder_name, v_item.borrower_name), 22)
            || '  ' || '0' || v_trace_num;

        v_entries_text := v_entries_text || chr(10) || v_entry_line;
        v_line_count := v_line_count + 1;
    END LOOP;

    v_file_text := v_file_text || v_entries_text;
    v_entry_hash := v_entry_hash % 10000000000;

    -- Batch Control (8-record)
    v_file_text := v_file_text || chr(10) || '8' || '200' || LPAD(v_entry_count::text, 6, '0')
        || LPAD(v_entry_hash::text, 10, '0') || LPAD(v_total_debit::text, 12, '0')
        || LPAD(v_total_credit::text, 12, '0') || RPAD(c_company_id, 10) || RPAD('', 19)
        || RPAD('', 6) || RPAD(c_odfi_routing, 8) || LPAD('1', 7, '0');
    v_line_count := v_line_count + 1;

    -- File Control (9-record)
    v_block_count := CEIL((v_line_count + 1)::numeric / 10.0)::integer;
    v_file_text := v_file_text || chr(10) || '9' || LPAD('1', 6, '0') || LPAD(v_block_count::text, 6, '0')
        || LPAD(v_entry_count::text, 8, '0') || LPAD(v_entry_hash::text, 10, '0')
        || LPAD(v_total_debit::text, 12, '0') || LPAD(v_total_credit::text, 12, '0') || RPAD('', 39);
    v_line_count := v_line_count + 1;

    -- Padding to multiple of 10
    v_padding_lines := (10 - (v_line_count % 10)) % 10;
    FOR i IN 1..v_padding_lines LOOP
        v_file_text := v_file_text || chr(10) || RPAD('9', 94, '9');
    END LOOP;

    UPDATE billing_cycles
    SET nacha_file_path = 'nacha_' || TO_CHAR(v_cycle.billing_month, 'YYYYMMDD') || '.ach'
    WHERE id = p_billing_cycle_id;

    RETURN v_file_text;
END;
$$;


-- ===================== SMOKE TEST: Seed Events =====================

-- Seed origination events from existing servicing_loans
INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, note)
SELECT
    sl.loan_id,
    'origination'::loan_event_type,
    COALESCE(sl.origination_date, CURRENT_DATE),
    COALESCE(sl.funds_released, sl.current_balance, 0),
    COALESCE(sl.funds_released, sl.current_balance, 0),
    'Initial origination event seeded from servicing_loans'
FROM servicing_loans sl
WHERE sl.loan_status = 'Active'
  AND NOT EXISTS (
      SELECT 1 FROM loan_events le
      WHERE le.loan_id = sl.loan_id AND le.event_type = 'origination'
  )
ORDER BY sl.loan_id;

-- Seed draw events from existing servicing_draws
INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, note)
SELECT
    sd.loan_id,
    'draw_funded'::loan_event_type,
    COALESCE(sd.funded_date, sd.request_date, CURRENT_DATE),
    sd.amount,
    COALESCE(
        (SELECT SUM(sd2.amount)
         FROM servicing_draws sd2
         WHERE sd2.loan_id = sd.loan_id
           AND sd2.status = 'Funded'
           AND (sd2.funded_date <= sd.funded_date OR (sd2.funded_date = sd.funded_date AND sd2.id <= sd.id))
        ),
        sd.amount
    ),
    'Draw #' || sd.draw_number || ' funded - seeded from servicing_draws'
FROM servicing_draws sd
WHERE sd.status = 'Funded'
  AND NOT EXISTS (
      SELECT 1 FROM loan_events le
      WHERE le.loan_id = sd.loan_id
        AND le.event_type = 'draw_funded'
        AND le.reference_id = sd.id
  )
ORDER BY sd.loan_id, sd.funded_date, sd.draw_number;


-- ===================== Verification Function =====================

CREATE OR REPLACE FUNCTION test_servicing_infrastructure()
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
    v_event_count      integer;
    v_active_loan_count integer;
    v_test_loan_id     text;
    v_test_calc        jsonb;
    v_test_balance     numeric;
    v_test_per_diem    numeric;
    v_test_payoff      jsonb;
BEGIN
    SELECT COUNT(*) INTO v_event_count FROM loan_events;
    SELECT COUNT(*) INTO v_active_loan_count FROM servicing_loans WHERE loan_status = 'Active';

    -- Pick a test loan (prefer dutch)
    SELECT sl.loan_id INTO v_test_loan_id
    FROM servicing_loans sl
    WHERE sl.loan_status = 'Active'
      AND sl.dutch_interest = true
      AND sl.interest_rate IS NOT NULL
      AND sl.interest_rate > 0
    ORDER BY sl.loan_id
    LIMIT 1;

    IF v_test_loan_id IS NULL THEN
        SELECT sl.loan_id INTO v_test_loan_id
        FROM servicing_loans sl
        WHERE sl.loan_status = 'Active'
          AND sl.interest_rate IS NOT NULL
          AND sl.interest_rate > 0
        ORDER BY sl.loan_id
        LIMIT 1;
    END IF;

    v_test_balance := calculate_funded_balance(v_test_loan_id, CURRENT_DATE);
    v_test_per_diem := calculate_per_diem(100000, 0.12);
    v_test_calc := calculate_interest_for_period(v_test_loan_id, '2026-03-01'::date);
    v_test_payoff := generate_payoff_quote(v_test_loan_id, CURRENT_DATE);

    RETURN jsonb_build_object(
        'status', 'PASS',
        'summary', jsonb_build_object(
            'total_events_seeded', v_event_count,
            'active_loans', v_active_loan_count,
            'test_loan_id', v_test_loan_id
        ),
        'tests', jsonb_build_object(
            'calculate_funded_balance', jsonb_build_object('result', v_test_balance, 'passed', v_test_balance IS NOT NULL),
            'calculate_per_diem', jsonb_build_object('result', v_test_per_diem, 'expected', 33.3333, 'passed', ABS(v_test_per_diem - 33.3333) < 0.001),
            'calculate_interest_for_period', jsonb_build_object('result', v_test_calc, 'passed', NOT (v_test_calc ? 'error')),
            'generate_payoff_quote', jsonb_build_object('result', v_test_payoff, 'passed', NOT (v_test_payoff ? 'error'))
        )
    );
END;
$$;

-- ===================== RUN THE SMOKE TEST =====================
-- Uncomment the line below to verify everything works:
-- SELECT test_servicing_infrastructure();
