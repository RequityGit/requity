-- =============================================================================
-- SERVICING ENGINE — Phase 4: Portfolio Dashboard Views
-- =============================================================================
-- Provides real-time portfolio analytics matching the Excel dashboard.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. servicing_portfolio_summary — Main dashboard view
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW servicing_portfolio_summary AS
WITH active_loans AS (
    SELECT *
    FROM servicing_loans
    WHERE loan_status = 'Active'
),
paid_off_loans AS (
    SELECT *
    FROM servicing_loans
    WHERE loan_status = 'Paid Off'
),
sold_loans AS (
    SELECT *
    FROM servicing_loans
    WHERE loan_status = 'Sold'
),
fund_assigned_loans AS (
    -- Loans assigned to a fund (any status)
    SELECT *
    FROM servicing_loans
    WHERE fund_name IS NOT NULL
      AND fund_name != '-'
      AND fund_ownership_pct > 0
),
defaulted_loans AS (
    SELECT *
    FROM servicing_loans
    WHERE loan_status = 'Active'
      AND default_status = 'In Default'
),
rtl_active AS (
    SELECT *
    FROM active_loans
    WHERE loan_type = 'RTL'
),
commercial_active AS (
    SELECT *
    FROM active_loans
    WHERE loan_type IN ('Commercial', 'Transactional', 'DSCR')
),
ach_batch AS (
    SELECT *
    FROM active_loans
    WHERE loan_status = 'Active'
      AND ach_status = 'Active'
)
SELECT
    -- Core metrics
    (SELECT COUNT(*) FROM active_loans) AS total_active_loans,
    (SELECT COALESCE(SUM(current_balance), 0) FROM active_loans) AS total_outstanding_balance,
    (SELECT CASE WHEN COUNT(*) > 0
            THEN ROUND(SUM(current_balance) / COUNT(*), 4)
            ELSE 0 END
     FROM active_loans) AS average_loan_size,

    -- Delinquency
    (SELECT COUNT(*) FROM active_loans WHERE days_past_due BETWEEN 30 AND 60) AS loans_30_60_dpd,
    (SELECT COUNT(*) FROM active_loans WHERE days_past_due BETWEEN 61 AND 90) AS loans_60_90_dpd,
    (SELECT COUNT(*) FROM active_loans WHERE days_past_due > 90) AS loans_90_plus_dpd,
    (SELECT CASE WHEN COUNT(*) > 0
            THEN ROUND(
                (SELECT COUNT(*)::numeric FROM active_loans WHERE days_past_due >= 30) /
                COUNT(*)::numeric, 6)
            ELSE 0 END
     FROM active_loans) AS delinquency_rate_30_plus,

    -- Historical
    (SELECT COUNT(*) FROM paid_off_loans) AS total_paid_off_loans,
    (SELECT COUNT(*) FROM fund_assigned_loans) AS total_loans_sold_to_fund,
    (SELECT COUNT(*) FROM defaulted_loans) AS total_defaulted_loans,
    (SELECT CASE WHEN COUNT(*) > 0
            THEN ROUND(
                (SELECT COUNT(*)::numeric FROM defaulted_loans) /
                (SELECT COUNT(*)::numeric FROM active_loans), 6)
            ELSE 0 END
     FROM active_loans) AS default_rate,

    -- By loan type
    (SELECT COUNT(*) FROM rtl_active) AS rtl_active_count,
    (SELECT COUNT(*) FROM commercial_active) AS commercial_active_count,
    (SELECT COALESCE(SUM(current_balance), 0) FROM rtl_active) AS rtl_outstanding_balance,
    (SELECT COALESCE(SUM(current_balance), 0) FROM commercial_active) AS commercial_outstanding_balance,

    -- ACH batch
    (SELECT COUNT(*) FROM ach_batch) AS loans_in_ach_batch,
    (SELECT COALESCE(SUM(monthly_payment), 0) FROM ach_batch) AS total_ach_amount,
    (SELECT COUNT(*) FROM ach_batch WHERE account_type = 'Checking') AS checking_debits_code_27,
    (SELECT COUNT(*) FROM ach_batch WHERE account_type = 'Savings') AS savings_debits_code_37;


-- ---------------------------------------------------------------------------
-- 2. servicing_loan_detail — Detailed loan view with computed fields
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW servicing_loan_detail AS
SELECT
    l.*,
    -- Total funded draws
    COALESCE(d.total_draws, 0) AS total_funded_draws,
    COALESCE(d.total_draw_amount, 0) AS total_draw_amount,
    COALESCE(d.draw_count, 0) AS draw_count,
    -- Total payments
    COALESCE(p.total_payments, 0) AS total_payments_received,
    COALESCE(p.payment_count, 0) AS payment_count,
    -- Days to maturity
    CASE
        WHEN l.maturity_date IS NOT NULL AND l.maturity_date > CURRENT_DATE
        THEN l.maturity_date - CURRENT_DATE
        ELSE 0
    END AS days_to_maturity,
    -- Is matured
    CASE
        WHEN l.maturity_date IS NOT NULL AND l.maturity_date < CURRENT_DATE
        THEN true
        ELSE false
    END AS is_matured
FROM servicing_loans l
LEFT JOIN (
    SELECT
        loan_id,
        SUM(amount) AS total_draws,
        SUM(CASE WHEN status = 'Funded' THEN amount ELSE 0 END) AS total_draw_amount,
        COUNT(*) AS draw_count
    FROM servicing_draws
    GROUP BY loan_id
) d ON d.loan_id = l.loan_id
LEFT JOIN (
    SELECT
        loan_id,
        SUM(amount_paid) AS total_payments,
        COUNT(*) AS payment_count
    FROM servicing_payments
    WHERE entry_type = 'Original'
    GROUP BY loan_id
) p ON p.loan_id = l.loan_id;


-- ---------------------------------------------------------------------------
-- 3. servicing_fund_exposure — Fund-level summary
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW servicing_fund_exposure AS
SELECT
    COALESCE(fund_name, 'Unassigned') AS fund_name,
    COUNT(*) AS loan_count,
    SUM(current_balance) AS total_exposure,
    SUM(current_balance * COALESCE(fund_ownership_pct, 0)) AS fund_share,
    AVG(COALESCE(interest_rate, 0)) AS avg_interest_rate,
    SUM(total_loan_amount) AS total_committed
FROM servicing_loans
WHERE loan_status = 'Active'
GROUP BY fund_name
ORDER BY total_exposure DESC;


-- ---------------------------------------------------------------------------
-- 4. servicing_maturity_schedule — Upcoming maturities
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW servicing_maturity_schedule AS
SELECT
    loan_id,
    borrower_name,
    entity_name,
    property_address,
    maturity_date,
    current_balance,
    total_loan_amount,
    maturity_date - CURRENT_DATE AS days_until_maturity,
    CASE
        WHEN maturity_date < CURRENT_DATE THEN 'MATURED'
        WHEN maturity_date <= CURRENT_DATE + interval '30 days' THEN 'MATURING_30'
        WHEN maturity_date <= CURRENT_DATE + interval '60 days' THEN 'MATURING_60'
        WHEN maturity_date <= CURRENT_DATE + interval '90 days' THEN 'MATURING_90'
        ELSE 'OK'
    END AS maturity_status
FROM servicing_loans
WHERE loan_status = 'Active'
  AND maturity_date IS NOT NULL
ORDER BY maturity_date ASC;
