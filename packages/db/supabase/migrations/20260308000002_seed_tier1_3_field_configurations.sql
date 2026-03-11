-- Seed field_configurations for Tier 1-3 modules
-- Each module maps to a real database table and controls field visibility/layout on detail pages.

-- ============================================================================
-- TIER 1: High Priority
-- ============================================================================

-- 1. Loans Extended (additional loan columns not covered by loan_details/property/borrower_entity)
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  -- Fees
  ('loans_extended', 'origination_fee_pct', 'Origination Fee %', 'percentage', 'left', 0, true, false),
  ('loans_extended', 'origination_fee_amount', 'Origination Fee $', 'currency', 'right', 1, true, false),
  ('loans_extended', 'broker_fee_pct', 'Broker Fee %', 'percentage', 'left', 2, true, false),
  ('loans_extended', 'broker_fee_amount', 'Broker Fee $', 'currency', 'right', 3, true, false),
  ('loans_extended', 'processing_fee', 'Processing Fee', 'currency', 'left', 4, true, false),
  ('loans_extended', 'legal_fee', 'Legal Fee', 'currency', 'right', 5, true, false),
  -- Dates
  ('loans_extended', 'application_date', 'Application Date', 'date', 'left', 6, true, false),
  ('loans_extended', 'approval_date', 'Approval Date', 'date', 'right', 7, true, false),
  ('loans_extended', 'closing_date', 'Closing Date', 'date', 'left', 8, true, false),
  ('loans_extended', 'actual_close_date', 'Actual Close Date', 'date', 'right', 9, true, false),
  ('loans_extended', 'expected_close_date', 'Expected Close Date', 'date', 'left', 10, true, false),
  ('loans_extended', 'clear_to_close_date', 'Clear to Close Date', 'date', 'right', 11, true, false),
  ('loans_extended', 'funding_date', 'Funding Date', 'date', 'left', 12, true, false),
  ('loans_extended', 'origination_date', 'Origination Date', 'date', 'right', 13, true, false),
  ('loans_extended', 'first_payment_date', 'First Payment Date', 'date', 'left', 14, true, false),
  ('loans_extended', 'maturity_date', 'Maturity Date', 'date', 'right', 15, true, false),
  ('loans_extended', 'payoff_date', 'Payoff Date', 'date', 'left', 16, true, false),
  ('loans_extended', 'file_complete_date', 'File Complete Date', 'date', 'right', 17, true, false),
  -- Financials
  ('loans_extended', 'after_repair_value', 'After Repair Value', 'currency', 'left', 18, true, false),
  ('loans_extended', 'as_is_value', 'As-Is Value', 'currency', 'right', 19, true, false),
  ('loans_extended', 'ltarv', 'LT-ARV', 'percentage', 'left', 20, true, false),
  ('loans_extended', 'total_loan_amount', 'Total Loan Amount', 'currency', 'right', 21, true, false),
  ('loans_extended', 'monthly_payment', 'Monthly Payment', 'currency', 'left', 22, true, false),
  ('loans_extended', 'default_rate', 'Default Rate', 'percentage', 'right', 23, true, false),
  ('loans_extended', 'note_rate', 'Note Rate', 'percentage', 'left', 24, true, false),
  ('loans_extended', 'rehab_budget', 'Rehab Budget', 'currency', 'right', 25, true, false),
  ('loans_extended', 'rehab_holdback', 'Rehab Holdback', 'currency', 'left', 26, true, false),
  ('loans_extended', 'interest_reserve', 'Interest Reserve', 'currency', 'right', 27, true, false),
  ('loans_extended', 'escrow_holdback', 'Escrow Holdback', 'currency', 'left', 28, true, false),
  ('loans_extended', 'cash_to_close', 'Cash to Close', 'currency', 'right', 29, true, false),
  ('loans_extended', 'combined_liquidity', 'Combined Liquidity', 'currency', 'left', 30, true, false),
  ('loans_extended', 'combined_net_worth', 'Combined Net Worth', 'currency', 'right', 31, true, false),
  -- Insurance
  ('loans_extended', 'insurance_company_name', 'Insurance Company', 'text', 'left', 32, true, false),
  ('loans_extended', 'insurance_agent_contact', 'Insurance Agent', 'text', 'right', 33, true, false),
  ('loans_extended', 'insurance_agent_email', 'Insurance Email', 'email', 'left', 34, true, false),
  ('loans_extended', 'insurance_agent_phone', 'Insurance Phone', 'phone', 'right', 35, true, false),
  -- Title
  ('loans_extended', 'title_company_name', 'Title Company', 'text', 'left', 36, true, false),
  ('loans_extended', 'title_company_contact', 'Title Contact', 'text', 'right', 37, true, false),
  ('loans_extended', 'title_company_email', 'Title Email', 'email', 'left', 38, true, false),
  ('loans_extended', 'title_company_phone', 'Title Phone', 'phone', 'right', 39, true, false),
  -- Prepayment
  ('loans_extended', 'prepayment_penalty_type', 'Prepayment Type', 'dropdown', 'left', 40, true, false),
  ('loans_extended', 'prepayment_penalty_pct', 'Prepayment Penalty %', 'percentage', 'right', 41, true, false),
  ('loans_extended', 'prepayment_penalty_months', 'Prepayment Months', 'number', 'left', 42, true, false),
  ('loans_extended', 'prepayment_terms', 'Prepayment Terms', 'text', 'right', 43, true, false),
  -- Extension
  ('loans_extended', 'extension_options', 'Extension Options', 'text', 'left', 44, true, false),
  ('loans_extended', 'extension_term_months', 'Extension Term (months)', 'number', 'right', 45, true, false),
  ('loans_extended', 'extension_fee_pct', 'Extension Fee %', 'percentage', 'left', 46, true, false),
  ('loans_extended', 'extension_maturity_date', 'Extension Maturity', 'date', 'right', 47, true, false),
  -- Co-Borrower & Other
  ('loans_extended', 'has_co_borrower', 'Has Co-Borrower', 'boolean', 'left', 48, true, false),
  ('loans_extended', 'co_borrower_name', 'Co-Borrower Name', 'text', 'right', 49, true, false),
  ('loans_extended', 'broker_sourced', 'Broker Sourced', 'boolean', 'left', 50, true, false),
  ('loans_extended', 'capital_partner', 'Capital Partner', 'text', 'right', 51, true, false),
  ('loans_extended', 'originator', 'Originator', 'text', 'left', 52, true, false),
  ('loans_extended', 'processor', 'Processor', 'text', 'right', 53, true, false),
  ('loans_extended', 'underwriter', 'Underwriter', 'text', 'left', 54, true, false),
  ('loans_extended', 'note_sold', 'Note Sold', 'boolean', 'right', 55, true, false),
  ('loans_extended', 'note_sold_to', 'Note Sold To', 'text', 'left', 56, true, false),
  ('loans_extended', 'note_sold_date', 'Note Sold Date', 'date', 'right', 57, true, false),
  ('loans_extended', 'is_in_flood_zone', 'In Flood Zone', 'boolean', 'left', 58, true, false),
  ('loans_extended', 'flood_zone_type', 'Flood Zone Type', 'text', 'right', 59, true, false),
  ('loans_extended', 'is_short_term_rental', 'Short-Term Rental', 'boolean', 'left', 60, true, false),
  ('loans_extended', 'servicing_platform', 'Servicing Platform', 'text', 'right', 61, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 2. Servicing Loan
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('servicing_loan', 'servicer_loan_number', 'Servicer Loan #', 'text', 'left', 0, true, true),
  ('servicing_loan', 'borrower_name', 'Borrower', 'text', 'right', 1, true, false),
  ('servicing_loan', 'entity_name', 'Entity', 'text', 'left', 2, true, false),
  ('servicing_loan', 'property_address', 'Property Address', 'text', 'right', 3, true, false),
  ('servicing_loan', 'city_state_zip', 'City/State/Zip', 'text', 'left', 4, true, false),
  ('servicing_loan', 'loan_type', 'Loan Type', 'dropdown', 'right', 5, true, false),
  ('servicing_loan', 'loan_purpose', 'Loan Purpose', 'dropdown', 'left', 6, true, false),
  ('servicing_loan', 'loan_status', 'Loan Status', 'dropdown', 'right', 7, true, false),
  ('servicing_loan', 'servicing_status', 'Servicing Status', 'dropdown', 'left', 8, true, false),
  ('servicing_loan', 'total_loan_amount', 'Total Loan Amount', 'currency', 'right', 9, true, false),
  ('servicing_loan', 'current_balance', 'Current Balance', 'currency', 'left', 10, true, false),
  ('servicing_loan', 'interest_rate', 'Interest Rate', 'percentage', 'right', 11, true, false),
  ('servicing_loan', 'effective_rate', 'Effective Rate', 'percentage', 'left', 12, true, false),
  ('servicing_loan', 'default_rate', 'Default Rate', 'percentage', 'right', 13, true, false),
  ('servicing_loan', 'payment_structure', 'Payment Structure', 'dropdown', 'left', 14, true, false),
  ('servicing_loan', 'interest_method', 'Interest Method', 'dropdown', 'right', 15, true, false),
  ('servicing_loan', 'monthly_payment', 'Monthly Payment', 'currency', 'left', 16, true, false),
  ('servicing_loan', 'term_months', 'Term (months)', 'number', 'right', 17, true, false),
  ('servicing_loan', 'origination_date', 'Origination Date', 'date', 'left', 18, true, false),
  ('servicing_loan', 'first_payment_date', 'First Payment Date', 'date', 'right', 19, true, false),
  ('servicing_loan', 'next_payment_due', 'Next Payment Due', 'date', 'left', 20, true, false),
  ('servicing_loan', 'maturity_date', 'Maturity Date', 'date', 'right', 21, true, false),
  ('servicing_loan', 'default_date', 'Default Date', 'date', 'left', 22, true, false),
  ('servicing_loan', 'default_status', 'Default Status', 'dropdown', 'right', 23, true, false),
  ('servicing_loan', 'days_past_due', 'Days Past Due', 'number', 'left', 24, true, false),
  ('servicing_loan', 'dutch_interest', 'Dutch Interest', 'boolean', 'right', 25, true, false),
  ('servicing_loan', 'late_fee_type', 'Late Fee Type', 'dropdown', 'left', 26, true, false),
  ('servicing_loan', 'late_fee_amount', 'Late Fee Amount', 'currency', 'right', 27, true, false),
  ('servicing_loan', 'grace_period_days', 'Grace Period (days)', 'number', 'left', 28, true, false),
  ('servicing_loan', 'origination_fee', 'Origination Fee', 'currency', 'right', 29, true, false),
  ('servicing_loan', 'exit_fee', 'Exit Fee', 'currency', 'left', 30, true, false),
  ('servicing_loan', 'construction_holdback', 'Construction Holdback', 'currency', 'right', 31, true, false),
  ('servicing_loan', 'draw_funds_available', 'Draw Funds Available', 'currency', 'left', 32, true, false),
  ('servicing_loan', 'funds_released', 'Funds Released', 'currency', 'right', 33, true, false),
  ('servicing_loan', 'purchase_price', 'Purchase Price', 'currency', 'left', 34, true, false),
  ('servicing_loan', 'origination_value', 'Origination Value', 'currency', 'right', 35, true, false),
  ('servicing_loan', 'stabilized_value', 'Stabilized Value', 'currency', 'left', 36, true, false),
  ('servicing_loan', 'additional_collateral_value', 'Additional Collateral', 'currency', 'right', 37, true, false),
  ('servicing_loan', 'ltv_origination', 'LTV at Origination', 'percentage', 'left', 38, true, false),
  ('servicing_loan', 'ltc', 'LTC', 'percentage', 'right', 39, true, false),
  ('servicing_loan', 'borrower_credit_score', 'Credit Score', 'number', 'left', 40, true, false),
  ('servicing_loan', 'fund_name', 'Fund', 'text', 'right', 41, true, false),
  ('servicing_loan', 'fund_ownership_pct', 'Fund Ownership %', 'percentage', 'left', 42, true, false),
  ('servicing_loan', 'originator', 'Originator', 'text', 'right', 43, true, false),
  ('servicing_loan', 'program', 'Program', 'text', 'left', 44, true, false),
  ('servicing_loan', 'asset_class', 'Asset Class', 'text', 'right', 45, true, false),
  ('servicing_loan', 'ach_status', 'ACH Status', 'dropdown', 'left', 46, true, false),
  ('servicing_loan', 'account_type', 'Account Type', 'dropdown', 'right', 47, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 3. Fund Details
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('fund_details', 'fund_type', 'Fund Type', 'dropdown', 'left', 0, true, false),
  ('fund_details', 'strategy', 'Strategy', 'text', 'right', 1, true, false),
  ('fund_details', 'target_size', 'Target Size', 'currency', 'left', 2, true, false),
  ('fund_details', 'current_size', 'Current Size', 'currency', 'right', 3, true, false),
  ('fund_details', 'current_aum', 'Current AUM', 'currency', 'left', 4, true, false),
  ('fund_details', 'gp_commitment', 'GP Commitment', 'currency', 'right', 5, true, false),
  ('fund_details', 'management_fee_pct', 'Management Fee %', 'percentage', 'left', 6, true, false),
  ('fund_details', 'management_fee', 'Management Fee $', 'currency', 'right', 7, true, false),
  ('fund_details', 'carry_pct', 'Carry %', 'percentage', 'left', 8, true, false),
  ('fund_details', 'hurdle_rate_pct', 'Hurdle Rate %', 'percentage', 'right', 9, true, false),
  ('fund_details', 'preferred_return_pct', 'Preferred Return %', 'percentage', 'left', 10, true, false),
  ('fund_details', 'preferred_return', 'Preferred Return $', 'currency', 'right', 11, true, false),
  ('fund_details', 'irr_target', 'IRR Target %', 'percentage', 'left', 12, true, false),
  ('fund_details', 'term_years', 'Term (years)', 'number', 'right', 13, true, false),
  ('fund_details', 'vintage_year', 'Vintage Year', 'number', 'left', 14, true, false),
  ('fund_details', 'inception_date', 'Inception Date', 'date', 'right', 15, true, false),
  ('fund_details', 'close_date', 'Close Date', 'date', 'left', 16, true, false),
  ('fund_details', 'bank_account_info', 'Bank Account Info', 'text', 'right', 17, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 4. Opportunity / Origination
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('opportunity', 'deal_name', 'Deal Name', 'text', 'left', 0, true, true),
  ('opportunity', 'loan_type', 'Loan Type', 'dropdown', 'right', 1, true, false),
  ('opportunity', 'loan_purpose', 'Loan Purpose', 'dropdown', 'left', 2, true, false),
  ('opportunity', 'funding_channel', 'Funding Channel', 'dropdown', 'right', 3, true, false),
  ('opportunity', 'funding_source', 'Funding Source', 'text', 'left', 4, true, false),
  ('opportunity', 'investment_strategy', 'Investment Strategy', 'dropdown', 'right', 5, true, false),
  ('opportunity', 'debt_tranche', 'Debt Tranche', 'dropdown', 'left', 6, true, false),
  ('opportunity', 'capital_partner', 'Capital Partner', 'text', 'right', 7, true, false),
  ('opportunity', 'proposed_loan_amount', 'Proposed Loan Amount', 'currency', 'left', 8, true, false),
  ('opportunity', 'proposed_interest_rate', 'Proposed Rate', 'percentage', 'right', 9, true, false),
  ('opportunity', 'proposed_ltv', 'Proposed LTV', 'percentage', 'left', 10, true, false),
  ('opportunity', 'proposed_ltarv', 'Proposed LT-ARV', 'percentage', 'right', 11, true, false),
  ('opportunity', 'proposed_loan_term_months', 'Proposed Term (months)', 'number', 'left', 12, true, false),
  ('opportunity', 'cash_to_close', 'Cash to Close', 'currency', 'right', 13, true, false),
  ('opportunity', 'combined_liquidity', 'Combined Liquidity', 'currency', 'left', 14, true, false),
  ('opportunity', 'combined_net_worth', 'Combined Net Worth', 'currency', 'right', 15, true, false),
  ('opportunity', 'occupancy_pct', 'Occupancy %', 'percentage', 'left', 16, true, false),
  ('opportunity', 'rental_status', 'Rental Status', 'dropdown', 'right', 17, true, false),
  ('opportunity', 'lease_type', 'Lease Type', 'dropdown', 'left', 18, true, false),
  ('opportunity', 'secondary_liens', 'Secondary Liens', 'boolean', 'right', 19, true, false),
  ('opportunity', 'originator', 'Originator', 'text', 'left', 20, true, false),
  ('opportunity', 'processor', 'Processor', 'text', 'right', 21, true, false),
  ('opportunity', 'assigned_underwriter', 'Underwriter', 'text', 'left', 22, true, false),
  ('opportunity', 'source_of_funds', 'Source of Funds', 'text', 'right', 23, true, false),
  ('opportunity', 'prepayment_penalty_type', 'Prepayment Type', 'dropdown', 'left', 24, true, false),
  ('opportunity', 'prepayment_penalty_pct', 'Prepayment Penalty %', 'percentage', 'right', 25, true, false),
  ('opportunity', 'prepayment_penalty_months', 'Prepayment Months', 'number', 'left', 26, true, false),
  ('opportunity', 'model_type', 'Model Type', 'dropdown', 'right', 27, true, false),
  ('opportunity', 'value_method', 'Value Method', 'dropdown', 'left', 28, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 5. Standalone Property
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('standalone_property', 'address_line1', 'Address Line 1', 'text', 'left', 0, true, false),
  ('standalone_property', 'address_line2', 'Address Line 2', 'text', 'right', 1, true, false),
  ('standalone_property', 'city', 'City', 'text', 'left', 2, true, false),
  ('standalone_property', 'state', 'State', 'text', 'right', 3, true, false),
  ('standalone_property', 'zip', 'Zip', 'text', 'left', 4, true, false),
  ('standalone_property', 'county', 'County', 'text', 'right', 5, true, false),
  ('standalone_property', 'property_type', 'Property Type', 'dropdown', 'left', 6, true, false),
  ('standalone_property', 'asset_type', 'Asset Type', 'dropdown', 'right', 7, true, false),
  ('standalone_property', 'asset_sub_type', 'Asset Sub-Type', 'dropdown', 'left', 8, true, false),
  ('standalone_property', 'building_class', 'Building Class', 'dropdown', 'right', 9, true, false),
  ('standalone_property', 'building_status', 'Building Status', 'dropdown', 'left', 10, true, false),
  ('standalone_property', 'number_of_units', 'Units', 'number', 'right', 11, true, false),
  ('standalone_property', 'number_of_buildings', 'Buildings', 'number', 'left', 12, true, false),
  ('standalone_property', 'number_of_stories', 'Stories', 'number', 'right', 13, true, false),
  ('standalone_property', 'gross_building_area_sqft', 'Gross Building Area (sqft)', 'number', 'left', 14, true, false),
  ('standalone_property', 'net_rentable_area_sqft', 'Net Rentable Area (sqft)', 'number', 'right', 15, true, false),
  ('standalone_property', 'lot_size_acres', 'Lot Size (acres)', 'number', 'left', 16, true, false),
  ('standalone_property', 'year_built', 'Year Built', 'number', 'right', 17, true, false),
  ('standalone_property', 'zoning', 'Zoning', 'text', 'left', 18, true, false),
  ('standalone_property', 'flood_zone', 'Flood Zone', 'text', 'right', 19, true, false),
  ('standalone_property', 'parcel_id', 'Parcel ID', 'text', 'left', 20, true, false),
  ('standalone_property', 'listing_status', 'Listing Status', 'dropdown', 'right', 21, true, false),
  ('standalone_property', 'condo_status', 'Condo Status', 'dropdown', 'left', 22, true, false),
  ('standalone_property', 'permitting_status', 'Permitting Status', 'dropdown', 'right', 23, true, false),
  ('standalone_property', 'water_system', 'Water System', 'dropdown', 'left', 24, true, false),
  ('standalone_property', 'sewer_system', 'Sewer System', 'dropdown', 'right', 25, true, false),
  ('standalone_property', 'survey_required', 'Survey Required', 'boolean', 'left', 26, true, false),
  ('standalone_property', 'rural_check_usda', 'Rural (USDA)', 'boolean', 'right', 27, true, false),
  ('standalone_property', 'rural_check_consumer_finance', 'Rural (Consumer Finance)', 'boolean', 'left', 28, true, false),
  ('standalone_property', 'tiered_llc_check', 'Tiered LLC', 'boolean', 'right', 29, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- ============================================================================
-- TIER 2: Medium Priority
-- ============================================================================

-- 6. Borrower Entity (actual borrower_entities table, not the loan-level borrower module)
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('borrower_entity_detail', 'entity_name', 'Entity Name', 'text', 'left', 0, true, true),
  ('borrower_entity_detail', 'entity_type', 'Entity Type', 'dropdown', 'right', 1, true, false),
  ('borrower_entity_detail', 'state_of_formation', 'State of Formation', 'text', 'left', 2, true, false),
  ('borrower_entity_detail', 'ein', 'EIN', 'text', 'right', 3, true, false),
  ('borrower_entity_detail', 'formation_date', 'Formation Date', 'date', 'left', 4, true, false),
  ('borrower_entity_detail', 'is_foreign_filed', 'Foreign Filed', 'boolean', 'right', 5, true, false),
  ('borrower_entity_detail', 'address_line1', 'Address Line 1', 'text', 'left', 6, true, false),
  ('borrower_entity_detail', 'address_line2', 'Address Line 2', 'text', 'right', 7, true, false),
  ('borrower_entity_detail', 'city', 'City', 'text', 'left', 8, true, false),
  ('borrower_entity_detail', 'state', 'State', 'text', 'right', 9, true, false),
  ('borrower_entity_detail', 'zip', 'Zip', 'text', 'left', 10, true, false),
  ('borrower_entity_detail', 'country', 'Country', 'text', 'right', 11, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 7. Investing Entity
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('investing_entity', 'entity_name', 'Entity Name', 'text', 'left', 0, true, true),
  ('investing_entity', 'entity_type', 'Entity Type', 'dropdown', 'right', 1, true, false),
  ('investing_entity', 'state_of_formation', 'State of Formation', 'text', 'left', 2, true, false),
  ('investing_entity', 'ein', 'EIN', 'text', 'right', 3, true, false),
  ('investing_entity', 'address_line1', 'Address Line 1', 'text', 'left', 4, true, false),
  ('investing_entity', 'address_line2', 'Address Line 2', 'text', 'right', 5, true, false),
  ('investing_entity', 'city', 'City', 'text', 'left', 6, true, false),
  ('investing_entity', 'state', 'State', 'text', 'right', 7, true, false),
  ('investing_entity', 'zip', 'Zip', 'text', 'left', 8, true, false),
  ('investing_entity', 'country', 'Country', 'text', 'right', 9, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 8. Investor Commitment
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('investor_commitment', 'commitment_amount', 'Commitment Amount', 'currency', 'left', 0, true, true),
  ('investor_commitment', 'funded_amount', 'Funded Amount', 'currency', 'right', 1, true, false),
  ('investor_commitment', 'unfunded_amount', 'Unfunded Amount', 'currency', 'left', 2, true, false),
  ('investor_commitment', 'commitment_date', 'Commitment Date', 'date', 'right', 3, true, false),
  ('investor_commitment', 'effective_date', 'Effective Date', 'date', 'left', 4, true, false),
  ('investor_commitment', 'status', 'Status', 'dropdown', 'right', 5, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 9. Capital Call
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('capital_call', 'call_number', 'Call Number', 'number', 'left', 0, true, true),
  ('capital_call', 'total_amount', 'Total Amount', 'currency', 'right', 1, true, false),
  ('capital_call', 'call_amount', 'Call Amount', 'currency', 'left', 2, true, false),
  ('capital_call', 'call_date', 'Call Date', 'date', 'right', 3, true, false),
  ('capital_call', 'due_date', 'Due Date', 'date', 'left', 4, true, false),
  ('capital_call', 'paid_date', 'Paid Date', 'date', 'right', 5, true, false),
  ('capital_call', 'status', 'Status', 'dropdown', 'left', 6, true, false),
  ('capital_call', 'purpose', 'Purpose', 'text', 'right', 7, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 10. Distribution
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('distribution', 'distribution_number', 'Distribution #', 'number', 'left', 0, true, true),
  ('distribution', 'distribution_type', 'Type', 'dropdown', 'right', 1, true, false),
  ('distribution', 'total_amount', 'Total Amount', 'currency', 'left', 2, true, false),
  ('distribution', 'amount', 'Amount', 'currency', 'right', 3, true, false),
  ('distribution', 'distribution_date', 'Distribution Date', 'date', 'left', 4, true, false),
  ('distribution', 'period_start', 'Period Start', 'date', 'right', 5, true, false),
  ('distribution', 'period_end', 'Period End', 'date', 'left', 6, true, false),
  ('distribution', 'status', 'Status', 'dropdown', 'right', 7, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- ============================================================================
-- TIER 3: Lower Priority
-- ============================================================================

-- 11. Draw Request
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('draw_request', 'draw_number', 'Draw #', 'number', 'left', 0, true, true),
  ('draw_request', 'request_number', 'Request #', 'text', 'right', 1, true, false),
  ('draw_request', 'amount_requested', 'Amount Requested', 'currency', 'left', 2, true, false),
  ('draw_request', 'amount_approved', 'Amount Approved', 'currency', 'right', 3, true, false),
  ('draw_request', 'status', 'Status', 'dropdown', 'left', 4, true, false),
  ('draw_request', 'completion_pct', 'Completion %', 'percentage', 'right', 5, true, false),
  ('draw_request', 'request_date', 'Request Date', 'date', 'left', 6, true, false),
  ('draw_request', 'submitted_at', 'Submitted At', 'date', 'right', 7, true, false),
  ('draw_request', 'funded_at', 'Funded At', 'date', 'left', 8, true, false),
  ('draw_request', 'inspection_type', 'Inspection Type', 'dropdown', 'right', 9, true, false),
  ('draw_request', 'inspection_date', 'Inspection Date', 'date', 'left', 10, true, false),
  ('draw_request', 'inspector_name', 'Inspector', 'text', 'right', 11, true, false),
  ('draw_request', 'wire_amount', 'Wire Amount', 'currency', 'left', 12, true, false),
  ('draw_request', 'wire_date', 'Wire Date', 'date', 'right', 13, true, false),
  ('draw_request', 'wire_confirmation_number', 'Wire Confirmation #', 'text', 'left', 14, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 12. Payoff Statement
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('payoff_statement', 'borrower_name', 'Borrower', 'text', 'left', 0, true, false),
  ('payoff_statement', 'entity_name', 'Entity', 'text', 'right', 1, true, false),
  ('payoff_statement', 'property_address', 'Property', 'text', 'left', 2, true, false),
  ('payoff_statement', 'unpaid_principal', 'Unpaid Principal', 'currency', 'right', 3, true, false),
  ('payoff_statement', 'accrued_interest', 'Accrued Interest', 'currency', 'left', 4, true, false),
  ('payoff_statement', 'interest_rate', 'Interest Rate', 'percentage', 'right', 5, true, false),
  ('payoff_statement', 'per_diem', 'Per Diem', 'currency', 'left', 6, true, false),
  ('payoff_statement', 'prepayment_penalty', 'Prepayment Penalty', 'currency', 'right', 7, true, false),
  ('payoff_statement', 'exit_fee', 'Exit Fee', 'currency', 'left', 8, true, false),
  ('payoff_statement', 'outstanding_late_fees', 'Late Fees', 'currency', 'right', 9, true, false),
  ('payoff_statement', 'release_fee', 'Release Fee', 'currency', 'left', 10, true, false),
  ('payoff_statement', 'wire_fee', 'Wire Fee', 'currency', 'right', 11, true, false),
  ('payoff_statement', 'other_fees', 'Other Fees', 'currency', 'left', 12, true, false),
  ('payoff_statement', 'total_payoff', 'Total Payoff', 'currency', 'right', 13, true, true),
  ('payoff_statement', 'good_through_date', 'Good Through Date', 'date', 'left', 14, true, false),
  ('payoff_statement', 'status', 'Status', 'dropdown', 'right', 15, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 13. Wire Instructions
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('wire_instructions', 'wire_type', 'Wire Type', 'dropdown', 'left', 0, true, false),
  ('wire_instructions', 'bank_name', 'Bank Name', 'text', 'right', 1, true, false),
  ('wire_instructions', 'account_name', 'Account Name', 'text', 'left', 2, true, false),
  ('wire_instructions', 'account_number', 'Account Number', 'text', 'right', 3, true, false),
  ('wire_instructions', 'routing_number', 'Routing Number', 'text', 'left', 4, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 14. CRM Activity
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('crm_activity', 'activity_type', 'Activity Type', 'dropdown', 'left', 0, true, false),
  ('crm_activity', 'subject', 'Subject', 'text', 'right', 1, true, false),
  ('crm_activity', 'direction', 'Direction', 'dropdown', 'left', 2, true, false),
  ('crm_activity', 'is_completed', 'Completed', 'boolean', 'right', 3, true, false),
  ('crm_activity', 'scheduled_at', 'Scheduled At', 'date', 'left', 4, true, false),
  ('crm_activity', 'completed_at', 'Completed At', 'date', 'right', 5, true, false),
  ('crm_activity', 'performed_by_name', 'Performed By', 'text', 'left', 6, true, false),
  ('crm_activity', 'call_disposition', 'Call Disposition', 'dropdown', 'right', 7, true, false),
  ('crm_activity', 'call_duration_seconds', 'Call Duration (sec)', 'number', 'left', 8, true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- 15. Equity Underwriting
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('equity_underwriting', 'total_project_cost', 'Total Project Cost', 'currency', 'left', 0, true, false),
  ('equity_underwriting', 'equity_required', 'Equity Required', 'currency', 'right', 1, true, false),
  ('equity_underwriting', 'debt_amount', 'Debt Amount', 'currency', 'left', 2, true, false),
  ('equity_underwriting', 'debt_rate', 'Debt Rate', 'percentage', 'right', 3, true, false),
  ('equity_underwriting', 'debt_ltv', 'Debt LTV', 'percentage', 'left', 4, true, false),
  ('equity_underwriting', 'capex_budget', 'CapEx Budget', 'currency', 'right', 5, true, false),
  ('equity_underwriting', 'noi_year1', 'NOI Year 1', 'currency', 'left', 6, true, false),
  ('equity_underwriting', 'noi_stabilized', 'NOI Stabilized', 'currency', 'right', 7, true, false),
  ('equity_underwriting', 'going_in_cap_rate', 'Going-In Cap Rate', 'percentage', 'left', 8, true, false),
  ('equity_underwriting', 'stabilized_cap_rate', 'Stabilized Cap Rate', 'percentage', 'right', 9, true, false),
  ('equity_underwriting', 'exit_cap_rate', 'Exit Cap Rate', 'percentage', 'left', 10, true, false),
  ('equity_underwriting', 'vacancy_rate_pct', 'Vacancy Rate %', 'percentage', 'right', 11, true, false),
  ('equity_underwriting', 'rent_growth_pct', 'Rent Growth %', 'percentage', 'left', 12, true, false),
  ('equity_underwriting', 'expense_growth_pct', 'Expense Growth %', 'percentage', 'right', 13, true, false),
  ('equity_underwriting', 'hold_period_years', 'Hold Period (years)', 'number', 'left', 14, true, false),
  ('equity_underwriting', 'levered_irr', 'Levered IRR', 'percentage', 'right', 15, true, false),
  ('equity_underwriting', 'unlevered_irr', 'Unlevered IRR', 'percentage', 'left', 16, true, false),
  ('equity_underwriting', 'equity_multiple', 'Equity Multiple', 'number', 'right', 17, true, false),
  ('equity_underwriting', 'cash_on_cash', 'Cash-on-Cash', 'percentage', 'left', 18, true, false),
  ('equity_underwriting', 'management_fee_pct', 'Management Fee %', 'percentage', 'right', 19, true, false)
ON CONFLICT (module, field_key) DO NOTHING;
