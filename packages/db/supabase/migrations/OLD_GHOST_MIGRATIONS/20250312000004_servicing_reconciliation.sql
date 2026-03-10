-- =============================================================================
-- SERVICING ENGINE — Phase 5: Reconciliation Checks
-- =============================================================================
-- Functions and views to verify data integrity and catch discrepancies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. reconcile_draw_balances — Verify draw totals match loan records
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reconcile_draw_balances()
RETURNS TABLE (
    loan_id             text,
    entity_name         text,
    loan_funds_released numeric,
    total_funded_draws  numeric,
    discrepancy         numeric,
    status              text
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.loan_id,
        l.entity_name,
        COALESCE(l.funds_released, 0) AS loan_funds_released,
        COALESCE(d.total_funded, 0) AS total_funded_draws,
        COALESCE(l.funds_released, 0) - COALESCE(d.total_funded, 0) AS discrepancy,
        CASE
            WHEN ABS(COALESCE(l.funds_released, 0) - COALESCE(d.total_funded, 0)) < 0.01
            THEN '✓ BALANCED'
            ELSE '✗ DISCREPANCY'
        END AS status
    FROM servicing_loans l
    LEFT JOIN (
        SELECT
            sd.loan_id AS draw_loan_id,
            SUM(sd.amount) AS total_funded
        FROM servicing_draws sd
        WHERE sd.status = 'Funded'
        GROUP BY sd.loan_id
    ) d ON d.draw_loan_id = l.loan_id
    WHERE l.loan_status = 'Active'
    ORDER BY l.loan_id;
END;
$$;


-- ---------------------------------------------------------------------------
-- 2. reconcile_payment_balances — Verify payment running balances
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reconcile_payment_balances()
RETURNS TABLE (
    payment_id          uuid,
    loan_id             text,
    payment_date        date,
    amount_paid         numeric,
    running_balance     numeric,
    expected_balance    numeric,
    status              text
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS payment_id,
        p.loan_id,
        p.date AS payment_date,
        p.amount_paid,
        p.running_balance_check AS running_balance,
        p.amount_paid AS expected_balance,
        CASE
            WHEN ABS(p.running_balance_check - p.amount_paid) < 0.01
            THEN '✓ BALANCED'
            ELSE '✗ DISCREPANCY'
        END AS status
    FROM servicing_payments p
    WHERE p.entry_type = 'Original'
    ORDER BY p.loan_id, p.date;
END;
$$;


-- ---------------------------------------------------------------------------
-- 3. reconcile_interest_vs_payments — Compare calculated interest with payments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reconcile_interest_vs_payments(p_period_start date)
RETURNS TABLE (
    loan_id             text,
    entity_name         text,
    calculated_interest numeric,
    payment_interest    numeric,
    difference          numeric,
    status              text
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_period_end date;
BEGIN
    v_period_end := (p_period_start + interval '1 month' - interval '1 day')::date;

    RETURN QUERY
    SELECT
        ic.loan_id,
        ic.entity_name,
        ic.interest_due AS calculated_interest,
        COALESCE(pay.total_interest, 0) AS payment_interest,
        ic.interest_due - COALESCE(pay.total_interest, 0) AS difference,
        CASE
            WHEN ABS(ic.interest_due - COALESCE(pay.total_interest, 0)) < 0.01
            THEN '✓ MATCHED'
            WHEN COALESCE(pay.total_interest, 0) = 0 AND ic.interest_due > 0
            THEN '⚠ NO PAYMENT'
            ELSE '✗ MISMATCH'
        END AS status
    FROM calculate_monthly_interest(p_period_start) ic
    LEFT JOIN (
        SELECT
            sp.loan_id AS pay_loan_id,
            SUM(sp.interest) AS total_interest
        FROM servicing_payments sp
        WHERE sp.date >= p_period_start
          AND sp.date <= v_period_end
          AND sp.entry_type = 'Original'
        GROUP BY sp.loan_id
    ) pay ON pay.pay_loan_id = ic.loan_id
    ORDER BY ic.loan_id;
END;
$$;


-- ---------------------------------------------------------------------------
-- 4. reconcile_loan_counts — Quick data integrity summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW servicing_data_integrity AS
SELECT
    (SELECT COUNT(*) FROM servicing_loans) AS total_loans,
    (SELECT COUNT(*) FROM servicing_loans WHERE loan_status = 'Active') AS active_loans,
    (SELECT COUNT(*) FROM servicing_loans WHERE loan_status = 'Paid Off') AS paid_off_loans,
    (SELECT COUNT(*) FROM servicing_loans WHERE loan_status = 'Sold') AS sold_loans,
    (SELECT COUNT(*) FROM servicing_draws) AS total_draws,
    (SELECT COUNT(*) FROM servicing_draws WHERE status = 'Funded') AS funded_draws,
    (SELECT COALESCE(SUM(amount), 0) FROM servicing_draws WHERE status = 'Funded') AS total_draw_amount,
    (SELECT COUNT(*) FROM servicing_payments) AS total_payments,
    (SELECT COUNT(*) FROM servicing_payments WHERE entry_type = 'Original') AS original_payments,
    (SELECT COUNT(*) FROM servicing_payments WHERE entry_type = 'Reversal') AS reversal_payments,
    (SELECT COALESCE(SUM(current_balance), 0) FROM servicing_loans WHERE loan_status = 'Active') AS total_outstanding_balance,
    (SELECT COUNT(*) FROM servicing_loans WHERE loan_status = 'Active' AND dutch_interest = true) AS dutch_interest_loans,
    (SELECT COUNT(*) FROM servicing_loans WHERE loan_status = 'Active' AND dutch_interest = false) AS non_dutch_interest_loans;


-- ---------------------------------------------------------------------------
-- 5. verify_interest_calculator — Run against known Jan 2026 expected values
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_interest_calculator_jan2026()
RETURNS TABLE (
    loan_id         text,
    expected        numeric,
    calculated      numeric,
    difference      numeric,
    status          text
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH expected_values AS (
        SELECT v.loan_id, v.expected_interest
        FROM (VALUES
            ('RQ-0013', 0::numeric),
            ('RQ-0018', 1680::numeric),
            ('RQ-0021', 1300::numeric),
            ('RQ-0023', 0::numeric),
            ('RQ-0024', 1980::numeric),
            ('RQ-0026', 1640::numeric),
            ('RQ-0028', 5000::numeric),
            ('RQ-0029', 1680::numeric),
            ('RQ-0030', 1500::numeric),
            ('RQ-0031', 900::numeric),
            ('RQ-0032', 7000::numeric),
            ('RQ-0033', 2740::numeric),
            ('RQ-0047', 3000::numeric),
            ('RQ-0048', 4500::numeric),
            ('RQ-0051', 2200::numeric),
            ('RQ-0053', 3690::numeric),
            ('RQ-0054', 2250::numeric),
            ('RQ-0059', 3100::numeric),
            ('RQ-0061', 2181.666667::numeric),
            ('RQ-0062', 2166.666667::numeric),
            ('RQ-0063', 416.666667::numeric),
            ('RQ-0070', 0::numeric),
            ('RQ-0071', 0::numeric),
            ('RQ-0072', 0::numeric)
        ) AS v(loan_id, expected_interest)
    ),
    calculated_values AS (
        SELECT
            ci.loan_id,
            ci.interest_due
        FROM calculate_monthly_interest('2026-01-01'::date) ci
    )
    SELECT
        ev.loan_id,
        ev.expected_interest AS expected,
        COALESCE(cv.interest_due, 0) AS calculated,
        ROUND(ABS(ev.expected_interest - COALESCE(cv.interest_due, 0)), 2) AS difference,
        CASE
            WHEN ABS(ev.expected_interest - COALESCE(cv.interest_due, 0)) < 0.01
            THEN '✓ PASS'
            ELSE '✗ FAIL (off by ' || ROUND(ABS(ev.expected_interest - COALESCE(cv.interest_due, 0)), 2)::text || ')'
        END AS status
    FROM expected_values ev
    LEFT JOIN calculated_values cv ON cv.loan_id = ev.loan_id
    ORDER BY ev.loan_id;
END;
$$;
