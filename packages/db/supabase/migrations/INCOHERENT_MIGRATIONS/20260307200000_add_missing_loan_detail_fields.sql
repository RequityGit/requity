-- Add missing loan_details fields to field_configurations
-- These fields exist in the OverviewTab buildLoanFieldMap but were not seeded
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('loan_details', 'loan_amount', 'Loan Amount', 'currency', 'left', 8, true, false),
  ('loan_details', 'interest_rate', 'Rate', 'percentage', 'right', 9, true, false),
  ('loan_details', 'ltv', 'LTV', 'percentage', 'left', 10, true, false),
  ('loan_details', 'dscr_ratio', 'DSCR', 'number', 'right', 11, true, false),
  ('loan_details', 'loan_term_months', 'Term', 'number', 'left', 12, true, false),
  ('loan_details', 'points', 'Points', 'percentage', 'right', 13, true, false)
ON CONFLICT (module, field_key) DO NOTHING;
