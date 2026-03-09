-- Seed field_configurations with UW field definitions from card types.
-- These become the single source of truth for field metadata (label, type, options).
-- Card types will reference these via field_key + module.

-- ═══════════════════════════════════════════════════════════════
-- Module: uw_deal (deal-level underwriting fields)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO field_configurations (module, field_key, field_label, field_type, is_visible, is_locked)
VALUES
  -- Core loan fields
  ('uw_deal', 'loan_amount', 'Loan Amount', 'currency', true, true),
  ('uw_deal', 'loan_purpose', 'Loan Purpose', 'dropdown', true, false),
  ('uw_deal', 'interest_rate', 'Interest Rate', 'percentage', true, true),
  ('uw_deal', 'default_rate', 'Default Rate', 'percentage', true, false),
  ('uw_deal', 'term_months', 'Loan Term (months)', 'number', true, true),
  ('uw_deal', 'amortization_months', 'Amortization (months)', 'number', true, false),
  ('uw_deal', 'interest_only', 'Interest Only', 'boolean', true, false),
  ('uw_deal', 'recourse', 'Recourse Type', 'dropdown', true, false),
  ('uw_deal', 'extension_term_months', 'Extension Term (months)', 'number', true, false),
  ('uw_deal', 'extension_fee_pct', 'Extension Fee %', 'percentage', true, false),
  ('uw_deal', 'extension_months', 'Extension Option (months)', 'number', true, false),
  ('uw_deal', 'prepayment_penalty_type', 'Prepayment Penalty Type', 'dropdown', true, false),
  ('uw_deal', 'prepayment_penalty_pct', 'Prepayment Penalty %', 'percentage', true, false),
  ('uw_deal', 'prepayment_penalty_months', 'Prepayment Penalty (months)', 'number', true, false),
  ('uw_deal', 'note_rate', 'Note Rate', 'percentage', true, false),

  -- Valuation / pricing
  ('uw_deal', 'property_value', 'Property Value / Appraisal', 'currency', true, true),
  ('uw_deal', 'purchase_price', 'Purchase Price', 'currency', true, false),
  ('uw_deal', 'as_is_value', 'As-Is Value', 'currency', true, false),
  ('uw_deal', 'arv', 'After Repair Value (ARV)', 'currency', true, false),
  ('uw_deal', 'asking_price', 'Asking Price', 'currency', true, false),
  ('uw_deal', 'offer_price', 'Offer / Acquisition Price', 'currency', true, false),

  -- Rehab / construction
  ('uw_deal', 'rehab_budget', 'Rehab Budget', 'currency', true, false),
  ('uw_deal', 'rehab_holdback', 'Rehab Holdback', 'currency', true, false),
  ('uw_deal', 'rehab_scope', 'Rehab Scope', 'dropdown', true, false),
  ('uw_deal', 'estimated_rehab_months', 'Estimated Rehab Timeline (months)', 'number', true, false),
  ('uw_deal', 'total_loan', 'Total Loan (Initial + Holdback)', 'currency', true, false),

  -- Income / performance
  ('uw_deal', 'noi', 'Net Operating Income', 'currency', true, true),
  ('uw_deal', 'noi_current', 'Current NOI (T12)', 'currency', true, false),
  ('uw_deal', 'noi_stabilized', 'Stabilized NOI', 'currency', true, false),
  ('uw_deal', 'occupancy', 'Occupancy %', 'percentage', true, false),
  ('uw_deal', 'occupancy_current', 'Current Occupancy %', 'percentage', true, false),
  ('uw_deal', 'occupancy_stabilized', 'Stabilized Occupancy %', 'percentage', true, false),
  ('uw_deal', 'avg_rent_rate', 'Avg Rent / Rate', 'currency', true, false),
  ('uw_deal', 'operating_expense_ratio', 'Expense Ratio %', 'percentage', true, false),
  ('uw_deal', 'monthly_rent', 'Monthly Rent (Gross)', 'currency', true, false),
  ('uw_deal', 'monthly_expenses', 'Monthly Expenses (PITIA est.)', 'currency', true, false),

  -- Fees
  ('uw_deal', 'origination_fee_pct', 'Origination Fee %', 'percentage', true, false),
  ('uw_deal', 'origination_fee_amount', 'Origination Fee $', 'currency', true, false),
  ('uw_deal', 'processing_fee', 'Processing Fee', 'currency', true, false),
  ('uw_deal', 'legal_fee', 'Legal Fee', 'currency', true, false),
  ('uw_deal', 'broker_fee_pct', 'Broker Fee %', 'percentage', true, false),
  ('uw_deal', 'broker_fee_amount', 'Broker Fee $', 'currency', true, false),
  ('uw_deal', 'points', 'Points', 'percentage', true, false),
  ('uw_deal', 'escrow_holdback', 'Escrow Holdback', 'currency', true, false),
  ('uw_deal', 'interest_reserve', 'Interest Reserve', 'currency', true, false),
  ('uw_deal', 'cash_to_close', 'Cash to Close', 'currency', true, false),

  -- Bridge / going-in loan
  ('uw_deal', 'bridge_loan_amount', 'Bridge Loan Amount', 'currency', true, false),
  ('uw_deal', 'bridge_rate', 'Bridge Rate', 'percentage', true, false),
  ('uw_deal', 'bridge_term_months', 'Bridge Term (months)', 'number', true, false),
  ('uw_deal', 'bridge_amortization_months', 'Bridge Amortization (months)', 'number', true, false),
  ('uw_deal', 'bridge_io_months', 'Bridge IO Period (months)', 'number', true, false),
  ('uw_deal', 'bridge_origination_pts', 'Bridge Origination Points', 'percentage', true, false),

  -- Exit / takeout
  ('uw_deal', 'exit_loan_amount', 'Exit / Takeout Loan Amount', 'currency', true, false),
  ('uw_deal', 'exit_rate', 'Exit Rate', 'percentage', true, false),
  ('uw_deal', 'exit_amortization_years', 'Exit Amortization (years)', 'number', true, false),
  ('uw_deal', 'exit_io_months', 'Exit IO Period (months)', 'number', true, false),
  ('uw_deal', 'exit_lender_name', 'Exit Lender', 'text', true, false),
  ('uw_deal', 'exit_cap_rate', 'Exit Cap Rate', 'percentage', true, false),
  ('uw_deal', 'exit_strategy', 'Exit Strategy', 'dropdown', true, false),
  ('uw_deal', 'disposition_cost_pct', 'Disposition Cost %', 'percentage', true, false),

  -- Capital structure
  ('uw_deal', 'funding_source', 'Funding Source', 'text', true, false),
  ('uw_deal', 'funding_channel', 'Funding Channel', 'dropdown', true, false),
  ('uw_deal', 'capital_partner', 'Capital Partner', 'text', true, false),
  ('uw_deal', 'debt_tranche', 'Debt Tranche', 'text', true, false),
  ('uw_deal', 'source_of_funds', 'Source of Funds', 'text', true, false),
  ('uw_deal', 'note_sold', 'Note Sold', 'boolean', true, false),
  ('uw_deal', 'note_sold_to', 'Note Sold To', 'text', true, false),
  ('uw_deal', 'note_sold_date', 'Note Sold Date', 'date', true, false),

  -- Equity-specific capital
  ('uw_deal', 'total_capitalization', 'Total Capitalization', 'currency', true, false),
  ('uw_deal', 'equity_required', 'Equity Required', 'currency', true, false),
  ('uw_deal', 'debt_amount', 'Debt Amount', 'currency', true, false),
  ('uw_deal', 'debt_rate', 'Debt Rate', 'percentage', true, false),
  ('uw_deal', 'debt_term_months', 'Debt Term (months)', 'number', true, false),
  ('uw_deal', 'debt_amortization_months', 'Debt Amortization (months)', 'number', true, false),
  ('uw_deal', 'debt_io_months', 'Debt IO Period (months)', 'number', true, false),
  ('uw_deal', 'management_fee_pct', 'Management Fee %', 'percentage', true, false),
  ('uw_deal', 'acquisition_type', 'Acquisition Type', 'dropdown', true, false),
  ('uw_deal', 'fund_vehicle', 'Fund Vehicle', 'text', true, false),
  ('uw_deal', 'earnest_money_deposit', 'Earnest Money Deposit', 'currency', true, false),
  ('uw_deal', 'capex_budget', 'Capex Budget', 'currency', true, false),
  ('uw_deal', 'hold_period_years', 'Hold Period (years)', 'number', true, false),

  -- Key dates
  ('uw_deal', 'application_date', 'Application Date', 'date', true, false),
  ('uw_deal', 'approval_date', 'Approval Date', 'date', true, false),
  ('uw_deal', 'expected_close_date', 'Expected Close Date', 'date', true, false),
  ('uw_deal', 'closing_date', 'Closing Date', 'date', true, false),
  ('uw_deal', 'funding_date', 'Funding Date', 'date', true, false),
  ('uw_deal', 'first_payment_date', 'First Payment Date', 'date', true, false),
  ('uw_deal', 'maturity_date', 'Maturity Date', 'date', true, false),
  ('uw_deal', 'extension_maturity_date', 'Extension Maturity Date', 'date', true, false),
  ('uw_deal', 'origination_date', 'Origination Date', 'date', true, false),
  ('uw_deal', 'dd_expiration_date', 'DD Expiration', 'date', true, false),

  -- Team / third parties
  ('uw_deal', 'originator', 'Originator', 'text', true, false),
  ('uw_deal', 'processor', 'Processor', 'text', true, false),
  ('uw_deal', 'underwriter', 'Underwriter', 'text', true, false),
  ('uw_deal', 'title_company_name', 'Title Company', 'text', true, false),
  ('uw_deal', 'title_company_contact', 'Title Contact', 'text', true, false),
  ('uw_deal', 'title_company_email', 'Title Email', 'text', true, false),
  ('uw_deal', 'closing_attorney_name', 'Closing Attorney', 'text', true, false),
  ('uw_deal', 'insurance_company_name', 'Insurance Company', 'text', true, false),
  ('uw_deal', 'insurance_agent_contact', 'Insurance Contact', 'text', true, false),
  ('uw_deal', 'insurance_agent_email', 'Insurance Email', 'text', true, false),
  ('uw_deal', 'lender_name', 'Lender', 'text', true, false),

  -- Broker / lead
  ('uw_deal', 'is_brokered', 'Brokered Deal', 'boolean', true, false),
  ('uw_deal', 'broker_sourced', 'Broker Sourced', 'boolean', true, false),
  ('uw_deal', 'investment_strategy', 'Investment Strategy', 'text', true, false),
  ('uw_deal', 'deal_programs', 'Deal Programs', 'text', true, false),
  ('uw_deal', 'priority', 'Priority', 'dropdown', true, false),
  ('uw_deal', 'source', 'Lead Source', 'text', true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Module: uw_property (property-level underwriting fields)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO field_configurations (module, field_key, field_label, field_type, is_visible, is_locked)
VALUES
  ('uw_property', 'property_address', 'Property Address', 'text', true, false),
  ('uw_property', 'property_city', 'City', 'text', true, false),
  ('uw_property', 'property_state', 'State', 'text', true, false),
  ('uw_property', 'property_zip', 'ZIP', 'text', true, false),
  ('uw_property', 'property_county', 'County', 'text', true, false),
  ('uw_property', 'parcel_id', 'Parcel ID / APN', 'text', true, false),
  ('uw_property', 'property_type', 'Property Type', 'dropdown', true, false),
  ('uw_property', 'number_of_units', 'Units / Lots / Sites', 'number', true, false),
  ('uw_property', 'units_lots_sites', 'Units / Lots / Sites', 'number', true, false),
  ('uw_property', 'year_built', 'Year Built', 'number', true, false),
  ('uw_property', 'total_sf', 'Total Sq Ft', 'number', true, false),
  ('uw_property', 'is_short_term_rental', 'Short-Term Rental', 'boolean', true, false),
  ('uw_property', 'is_in_flood_zone', 'In Flood Zone', 'boolean', true, false),
  ('uw_property', 'flood_zone_type', 'Flood Zone Type', 'text', true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Module: uw_borrower (borrower-level underwriting fields)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO field_configurations (module, field_key, field_label, field_type, is_visible, is_locked)
VALUES
  ('uw_borrower', 'borrower_fico', 'Borrower FICO', 'number', true, true),
  ('uw_borrower', 'borrower_experience', 'Borrower Experience', 'text', true, false),
  ('uw_borrower', 'flips_completed', 'Flips Completed (experience)', 'number', true, false),
  ('uw_borrower', 'combined_liquidity', 'Combined Liquidity', 'currency', true, false),
  ('uw_borrower', 'combined_net_worth', 'Combined Net Worth', 'currency', true, false),
  ('uw_borrower', 'guarantor_liquidity', 'Guarantor Liquidity', 'currency', true, false),
  ('uw_borrower', 'guarantor_net_worth', 'Guarantor Net Worth', 'currency', true, false),
  ('uw_borrower', 'source_of_funds', 'Source of Funds', 'text', true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Populate dropdown_options for select/dropdown fields
-- ═══════════════════════════════════════════════════════════════

UPDATE field_configurations SET dropdown_options = '["acquisition","refinance","cash_out","value_add","construction"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'loan_purpose';

UPDATE field_configurations SET dropdown_options = '["full_recourse","partial_recourse","non_recourse"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'recourse';

UPDATE field_configurations SET dropdown_options = '["none","yield_maintenance","defeasance","step_down","fixed"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'prepayment_penalty_type';

UPDATE field_configurations SET dropdown_options = '["refinance_perm","sell","hold","refinance_rental"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'exit_strategy';

UPDATE field_configurations SET dropdown_options = '["balance_sheet","fund","warehouse_line","table_fund","participation"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'funding_channel';

UPDATE field_configurations SET dropdown_options = '["cosmetic","moderate","heavy","gut"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'rehab_scope';

UPDATE field_configurations SET dropdown_options = '["direct","fund","jv","syndication"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'acquisition_type';

UPDATE field_configurations SET dropdown_options = '["low","normal","high","urgent"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'priority';

-- property_type gets the superset of all card type options
UPDATE field_configurations SET dropdown_options = '["sfr","duplex","triplex","fourplex","condo","townhouse","pud","2_4_unit","multifamily","office","retail","industrial","self_storage","hospitality","healthcare","mobile_home_park","rv_park","campground","marina","mixed_use","warehouse","specialty","other"]'::jsonb
WHERE module = 'uw_property' AND field_key = 'property_type';
