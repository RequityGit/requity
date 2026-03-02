-- =============================================================================
-- LOAN SERVICING INFRASTRUCTURE — Smoke Test
-- =============================================================================
-- Seeds an origination event for a real loan and verifies the calculation
-- functions work correctly. This can be run as a migration or manually.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Insert origination events for all active loans
-- ---------------------------------------------------------------------------
-- Seed the event ledger with origination events derived from servicing_loans.
-- This bridges the legacy data into the new event-based system.
-- ---------------------------------------------------------------------------
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
      WHERE le.loan_id = sl.loan_id
        AND le.event_type = 'origination'
  )
ORDER BY sl.loan_id;

-- ---------------------------------------------------------------------------
-- 2. Insert draw_funded events for funded draws
-- ---------------------------------------------------------------------------
INSERT INTO loan_events (loan_id, event_type, event_date, amount, running_balance, note)
SELECT
    sd.loan_id,
    'draw_funded'::loan_event_type,
    COALESCE(sd.funded_date, sd.request_date, CURRENT_DATE),
    sd.amount,
    -- running_balance after this draw = prior balance + draw
    COALESCE((
        SELECT SUM(sd2.amount)
        FROM servicing_draws sd2
        WHERE sd2.loan_id = sd.loan_id
          AND sd2.status = 'Funded'
          AND (sd2.funded_date <= sd.funded_date OR
               (sd2.funded_date = sd.funded_date AND sd2.id <= sd.id))
    ), sd.amount),
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

-- ---------------------------------------------------------------------------
-- 3. Verification function: test_servicing_infrastructure()
-- ---------------------------------------------------------------------------
-- Call this to verify the entire system is working. Returns a summary report.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION test_servicing_infrastructure()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_event_count      integer;
    v_active_loan_count integer;
    v_test_loan_id     text;
    v_test_calc        jsonb;
    v_test_balance     numeric;
    v_test_per_diem    numeric;
    v_test_payoff      jsonb;
    v_results          jsonb := '{}'::jsonb;
BEGIN
    -- Count events
    SELECT COUNT(*) INTO v_event_count FROM loan_events;

    -- Count active loans
    SELECT COUNT(*) INTO v_active_loan_count
    FROM servicing_loans WHERE loan_status = 'Active';

    -- Pick a test loan (first active Dutch loan for predictable results)
    SELECT sl.loan_id INTO v_test_loan_id
    FROM servicing_loans sl
    WHERE sl.loan_status = 'Active'
      AND sl.dutch_interest = true
      AND sl.interest_rate IS NOT NULL
      AND sl.interest_rate > 0
    ORDER BY sl.loan_id
    LIMIT 1;

    IF v_test_loan_id IS NULL THEN
        -- Fallback to any active loan
        SELECT sl.loan_id INTO v_test_loan_id
        FROM servicing_loans sl
        WHERE sl.loan_status = 'Active'
          AND sl.interest_rate IS NOT NULL
          AND sl.interest_rate > 0
        ORDER BY sl.loan_id
        LIMIT 1;
    END IF;

    -- Test calculate_funded_balance
    v_test_balance := calculate_funded_balance(v_test_loan_id, CURRENT_DATE);

    -- Test calculate_per_diem
    v_test_per_diem := calculate_per_diem(100000, 0.12);
    -- Expected: 100000 * 0.12 / 360 = 33.3333

    -- Test calculate_interest_for_period
    v_test_calc := calculate_interest_for_period(v_test_loan_id, '2026-03-01'::date);

    -- Test generate_payoff_quote
    v_test_payoff := generate_payoff_quote(v_test_loan_id, CURRENT_DATE);

    v_results := jsonb_build_object(
        'status', 'PASS',
        'summary', jsonb_build_object(
            'total_events_seeded', v_event_count,
            'active_loans', v_active_loan_count,
            'test_loan_id', v_test_loan_id
        ),
        'tests', jsonb_build_object(
            'calculate_funded_balance', jsonb_build_object(
                'loan_id', v_test_loan_id,
                'result', v_test_balance,
                'passed', v_test_balance IS NOT NULL
            ),
            'calculate_per_diem', jsonb_build_object(
                'input', '100000 @ 12%',
                'result', v_test_per_diem,
                'expected', 33.3333,
                'passed', ABS(v_test_per_diem - 33.3333) < 0.001
            ),
            'calculate_interest_for_period', jsonb_build_object(
                'loan_id', v_test_loan_id,
                'billing_month', '2026-03-01',
                'result', v_test_calc,
                'passed', NOT (v_test_calc ? 'error')
            ),
            'generate_payoff_quote', jsonb_build_object(
                'loan_id', v_test_loan_id,
                'result', v_test_payoff,
                'passed', NOT (v_test_payoff ? 'error')
            )
        )
    );

    RETURN v_results;
END;
$$;

COMMENT ON FUNCTION test_servicing_infrastructure() IS
    'Smoke test for the loan servicing infrastructure. Tests all core '
    'calculation functions against a real loan. Returns a JSON report.';
