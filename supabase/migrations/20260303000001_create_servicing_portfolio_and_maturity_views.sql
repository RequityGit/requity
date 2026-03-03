-- Portfolio summary view (single-row aggregate) for the servicing dashboard KPIs
CREATE OR REPLACE VIEW servicing_portfolio_summary AS
SELECT
  COUNT(*) FILTER (WHERE loan_status = 'Active')                          AS total_active_loans,
  COALESCE(SUM(current_balance) FILTER (WHERE loan_status = 'Active'), 0) AS total_outstanding_balance,
  COALESCE(AVG(total_loan_amount) FILTER (WHERE loan_status = 'Active'), 0) AS average_loan_size,
  COUNT(*) FILTER (WHERE loan_status = 'Active' AND loan_type = 'RTL')    AS rtl_active_count,
  COALESCE(SUM(current_balance) FILTER (WHERE loan_status = 'Active' AND loan_type = 'RTL'), 0) AS rtl_outstanding_balance,
  COUNT(*) FILTER (WHERE loan_status = 'Active' AND loan_type = 'Commercial') AS commercial_active_count,
  COALESCE(SUM(current_balance) FILTER (WHERE loan_status = 'Active' AND loan_type = 'Commercial'), 0) AS commercial_outstanding_balance
FROM servicing_loans;

-- Maturity schedule view for the servicing maturities tab
CREATE OR REPLACE VIEW servicing_maturity_schedule AS
SELECT
  loan_id,
  borrower_name,
  property_address,
  maturity_date,
  (maturity_date - CURRENT_DATE)::integer AS days_until_maturity,
  current_balance,
  CASE
    WHEN maturity_date <= CURRENT_DATE                    THEN 'MATURED'
    WHEN maturity_date <= CURRENT_DATE + interval '30 days'  THEN 'MATURING_30'
    WHEN maturity_date <= CURRENT_DATE + interval '60 days'  THEN 'MATURING_60'
    WHEN maturity_date <= CURRENT_DATE + interval '90 days'  THEN 'MATURING_90'
    ELSE 'OK'
  END AS maturity_status
FROM servicing_loans
WHERE loan_status = 'Active'
  AND maturity_date IS NOT NULL
ORDER BY maturity_date;
