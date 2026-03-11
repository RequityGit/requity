-- Expand card type field definitions to include comprehensive deal data
-- that was present in the old loans-based pipeline but missing from the unified pipeline.

-- ═══════════════════════════════════════════════════════════════
-- Commercial Debt (comm_debt)
-- ═══════════════════════════════════════════════════════════════
UPDATE unified_card_types
SET
  uw_fields = '[
    {"key":"loan_amount","type":"currency","label":"Loan Amount","required":true},
    {"key":"loan_purpose","type":"select","label":"Loan Purpose","options":["acquisition","refinance","cash_out","value_add","construction"]},
    {"key":"interest_rate","type":"percent","label":"Interest Rate","required":true},
    {"key":"default_rate","type":"percent","label":"Default Rate"},
    {"key":"term_months","type":"number","label":"Loan Term (months)","required":true},
    {"key":"amortization_months","type":"number","label":"Amortization (months)"},
    {"key":"interest_only","type":"boolean","label":"Interest Only"},
    {"key":"recourse","type":"select","label":"Recourse Type","options":["full_recourse","partial_recourse","non_recourse"]},
    {"key":"extension_term_months","type":"number","label":"Extension Term (months)"},
    {"key":"extension_fee_pct","type":"percent","label":"Extension Fee %"},
    {"key":"prepayment_penalty_type","type":"select","label":"Prepayment Penalty Type","options":["none","yield_maintenance","defeasance","step_down","fixed"]},
    {"key":"prepayment_penalty_pct","type":"percent","label":"Prepayment Penalty %"},
    {"key":"prepayment_penalty_months","type":"number","label":"Prepayment Penalty (months)"},

    {"key":"property_value","type":"currency","label":"Property Value / Appraisal","required":true},
    {"key":"property_type","type":"select","label":"Property Type","options":["multifamily","office","retail","industrial","self_storage","hospitality","healthcare","mobile_home_park","rv_park","marina","mixed_use","warehouse","specialty","other"]},
    {"key":"property_address","type":"text","label":"Property Address"},
    {"key":"property_city","type":"text","label":"City"},
    {"key":"property_state","type":"text","label":"State"},
    {"key":"property_zip","type":"text","label":"ZIP"},
    {"key":"property_county","type":"text","label":"County"},
    {"key":"parcel_id","type":"text","label":"Parcel ID / APN"},
    {"key":"number_of_units","type":"number","label":"Units / Lots / Sites"},
    {"key":"year_built","type":"number","label":"Year Built"},
    {"key":"total_sf","type":"number","label":"Total Sq Ft"},
    {"key":"is_short_term_rental","type":"boolean","label":"Short-Term Rental"},
    {"key":"is_in_flood_zone","type":"boolean","label":"In Flood Zone"},
    {"key":"flood_zone_type","type":"text","label":"Flood Zone Type"},

    {"key":"noi","type":"currency","label":"Net Operating Income","required":true},
    {"key":"noi_current","type":"currency","label":"Current NOI (T12)"},
    {"key":"noi_stabilized","type":"currency","label":"Stabilized NOI"},
    {"key":"occupancy","type":"percent","label":"Occupancy %"},
    {"key":"avg_rent_rate","type":"currency","label":"Avg Rent / Rate"},
    {"key":"operating_expense_ratio","type":"percent","label":"Expense Ratio %"},

    {"key":"origination_fee_pct","type":"percent","label":"Origination Fee %"},
    {"key":"origination_fee_amount","type":"currency","label":"Origination Fee $"},
    {"key":"processing_fee","type":"currency","label":"Processing Fee"},
    {"key":"legal_fee","type":"currency","label":"Legal Fee"},
    {"key":"broker_fee_pct","type":"percent","label":"Broker Fee %"},
    {"key":"broker_fee_amount","type":"currency","label":"Broker Fee $"},
    {"key":"points","type":"percent","label":"Points"},
    {"key":"escrow_holdback","type":"currency","label":"Escrow Holdback"},
    {"key":"interest_reserve","type":"currency","label":"Interest Reserve"},
    {"key":"cash_to_close","type":"currency","label":"Cash to Close"},

    {"key":"borrower_experience","type":"text","label":"Borrower Experience"},
    {"key":"borrower_fico","type":"number","label":"Borrower FICO"},
    {"key":"guarantor_net_worth","type":"currency","label":"Guarantor Net Worth"},
    {"key":"guarantor_liquidity","type":"currency","label":"Guarantor Liquidity"},
    {"key":"combined_net_worth","type":"currency","label":"Combined Net Worth"},
    {"key":"combined_liquidity","type":"currency","label":"Combined Liquidity"},
    {"key":"source_of_funds","type":"text","label":"Source of Funds"},

    {"key":"bridge_loan_amount","type":"currency","label":"Bridge Loan Amount"},
    {"key":"bridge_rate","type":"percent","label":"Bridge Rate"},
    {"key":"bridge_term_months","type":"number","label":"Bridge Term (months)"},
    {"key":"bridge_amortization_months","type":"number","label":"Bridge Amortization (months)"},
    {"key":"bridge_io_months","type":"number","label":"Bridge IO Period (months)"},
    {"key":"bridge_origination_pts","type":"percent","label":"Bridge Origination Points"},

    {"key":"exit_loan_amount","type":"currency","label":"Exit / Takeout Loan Amount"},
    {"key":"exit_rate","type":"percent","label":"Exit Rate"},
    {"key":"exit_amortization_years","type":"number","label":"Exit Amortization (years)"},
    {"key":"exit_io_months","type":"number","label":"Exit IO Period (months)"},
    {"key":"exit_lender_name","type":"text","label":"Exit Lender"},
    {"key":"exit_cap_rate","type":"percent","label":"Exit Cap Rate"},
    {"key":"exit_strategy","type":"select","label":"Exit Strategy","options":["refinance_perm","sell","hold"]},
    {"key":"disposition_cost_pct","type":"percent","label":"Disposition Cost %"},

    {"key":"funding_source","type":"text","label":"Funding Source"},
    {"key":"funding_channel","type":"select","label":"Funding Channel","options":["balance_sheet","fund","warehouse_line","table_fund","participation"]},
    {"key":"capital_partner","type":"text","label":"Capital Partner"},
    {"key":"debt_tranche","type":"text","label":"Debt Tranche"},
    {"key":"note_rate","type":"percent","label":"Note Rate"},
    {"key":"note_sold","type":"boolean","label":"Note Sold"},
    {"key":"note_sold_to","type":"text","label":"Note Sold To"},
    {"key":"note_sold_date","type":"date","label":"Note Sold Date"},

    {"key":"application_date","type":"date","label":"Application Date"},
    {"key":"approval_date","type":"date","label":"Approval Date"},
    {"key":"expected_close_date","type":"date","label":"Expected Close Date"},
    {"key":"closing_date","type":"date","label":"Closing Date"},
    {"key":"funding_date","type":"date","label":"Funding Date"},
    {"key":"first_payment_date","type":"date","label":"First Payment Date"},
    {"key":"maturity_date","type":"date","label":"Maturity Date"},
    {"key":"extension_maturity_date","type":"date","label":"Extension Maturity Date"},
    {"key":"origination_date","type":"date","label":"Origination Date"},

    {"key":"originator","type":"text","label":"Originator"},
    {"key":"processor","type":"text","label":"Processor"},
    {"key":"underwriter","type":"text","label":"Underwriter"},
    {"key":"title_company_name","type":"text","label":"Title Company"},
    {"key":"title_company_contact","type":"text","label":"Title Contact"},
    {"key":"title_company_email","type":"text","label":"Title Email"},
    {"key":"closing_attorney_name","type":"text","label":"Closing Attorney"},
    {"key":"insurance_company_name","type":"text","label":"Insurance Company"},
    {"key":"insurance_agent_contact","type":"text","label":"Insurance Contact"},
    {"key":"insurance_agent_email","type":"text","label":"Insurance Email"},

    {"key":"lender_name","type":"text","label":"Lender"},
    {"key":"is_brokered","type":"boolean","label":"Brokered Deal"},
    {"key":"broker_sourced","type":"boolean","label":"Broker Sourced"},

    {"key":"investment_strategy","type":"text","label":"Investment Strategy"},
    {"key":"deal_programs","type":"text","label":"Deal Programs"},
    {"key":"priority","type":"select","label":"Priority","options":["low","normal","high","urgent"]},
    {"key":"source","type":"text","label":"Lead Source"}
  ]'::jsonb,

  uw_outputs = '[
    {"key":"ltv","type":"percent","label":"LTV","formula":"loan_amount / property_value * 100"},
    {"key":"dscr","type":"ratio","label":"DSCR","formula":"noi / annual_debt_service"},
    {"key":"debt_yield","type":"percent","label":"Debt Yield","formula":"noi / loan_amount * 100"},
    {"key":"cap_rate_going_in","type":"percent","label":"Going-In Cap Rate","formula":"noi_current / property_value * 100"},
    {"key":"cap_rate_stabilized","type":"percent","label":"Stabilized Cap Rate","formula":"noi_stabilized / property_value * 100"},
    {"key":"annual_debt_service","type":"currency","label":"Annual Debt Service"},
    {"key":"price_per_unit","type":"currency","label":"Price Per Unit"},
    {"key":"bridge_ltv","type":"percent","label":"Bridge LTV","formula":"bridge_loan_amount / property_value * 100"},
    {"key":"exit_dscr","type":"ratio","label":"Exit DSCR","formula":"noi_stabilized / exit_annual_debt_service"}
  ]'::jsonb,

  detail_field_groups = '[
    {"label":"Deal Summary","fields":["loan_amount","loan_purpose","investment_strategy","priority","deal_programs","source"]},
    {"label":"Loan Terms","fields":["interest_rate","default_rate","term_months","amortization_months","interest_only","recourse","extension_term_months","extension_fee_pct","prepayment_penalty_type","prepayment_penalty_pct","prepayment_penalty_months"]},
    {"label":"Property","fields":["property_type","property_address","property_city","property_state","property_zip","property_county","parcel_id","number_of_units","year_built","total_sf","is_short_term_rental","is_in_flood_zone","flood_zone_type"]},
    {"label":"Property Financials","fields":["property_value","noi","noi_current","noi_stabilized","occupancy","avg_rent_rate","operating_expense_ratio"]},
    {"label":"Fees & Costs","fields":["origination_fee_pct","origination_fee_amount","processing_fee","legal_fee","broker_fee_pct","broker_fee_amount","points","escrow_holdback","interest_reserve","cash_to_close"]},
    {"label":"Borrower / Guarantor","fields":["borrower_experience","borrower_fico","guarantor_net_worth","guarantor_liquidity","combined_net_worth","combined_liquidity","source_of_funds"]},
    {"label":"Going-In Loan (Bridge)","fields":["bridge_loan_amount","bridge_rate","bridge_term_months","bridge_amortization_months","bridge_io_months","bridge_origination_pts"]},
    {"label":"Takeout / Exit Loan","fields":["exit_loan_amount","exit_rate","exit_amortization_years","exit_io_months","exit_lender_name","exit_cap_rate","exit_strategy","disposition_cost_pct"]},
    {"label":"Capital & Funding","fields":["funding_source","funding_channel","capital_partner","debt_tranche","note_rate","note_sold","note_sold_to","note_sold_date"]},
    {"label":"Key Dates","fields":["application_date","approval_date","expected_close_date","closing_date","funding_date","first_payment_date","maturity_date","extension_maturity_date","origination_date"]},
    {"label":"Team & Third Parties","fields":["originator","processor","underwriter","title_company_name","title_company_contact","title_company_email","closing_attorney_name","insurance_company_name","insurance_agent_contact","insurance_agent_email"]},
    {"label":"Lender / Broker","fields":["lender_name","is_brokered","broker_sourced"]}
  ]'::jsonb

WHERE slug = 'comm_debt';


-- ═══════════════════════════════════════════════════════════════
-- Residential Debt — DSCR (res_debt_dscr)
-- ═══════════════════════════════════════════════════════════════
UPDATE unified_card_types
SET
  uw_fields = '[
    {"key":"property_value","type":"currency","label":"Property Value","required":true},
    {"key":"loan_amount","type":"currency","label":"Loan Amount","required":true},
    {"key":"monthly_rent","type":"currency","label":"Monthly Rent (Gross)","required":true},
    {"key":"monthly_expenses","type":"currency","label":"Monthly Expenses (PITIA est.)","required":true},
    {"key":"interest_rate","type":"percent","label":"Interest Rate","required":true},
    {"key":"term_months","type":"number","label":"Loan Term (months)","required":true},
    {"key":"amortization_months","type":"number","label":"Amortization (months)"},
    {"key":"interest_only","type":"boolean","label":"Interest Only"},
    {"key":"origination_fee_pct","type":"percent","label":"Origination Fee %"},
    {"key":"origination_fee_amount","type":"currency","label":"Origination Fee $"},
    {"key":"processing_fee","type":"currency","label":"Processing Fee"},
    {"key":"legal_fee","type":"currency","label":"Legal Fee"},
    {"key":"points","type":"percent","label":"Points"},
    {"key":"prepayment_penalty_type","type":"select","label":"Prepayment Penalty Type","options":["none","yield_maintenance","step_down","fixed"]},
    {"key":"prepayment_penalty_pct","type":"percent","label":"Prepayment Penalty %"},
    {"key":"prepayment_penalty_months","type":"number","label":"Prepayment Penalty (months)"},
    {"key":"escrow_holdback","type":"currency","label":"Escrow Holdback"},
    {"key":"interest_reserve","type":"currency","label":"Interest Reserve"},
    {"key":"cash_to_close","type":"currency","label":"Cash to Close"},

    {"key":"property_type","type":"select","label":"Property Type","options":["sfr","duplex","triplex","fourplex","condo","townhouse","pud","2_4_unit"]},
    {"key":"property_address","type":"text","label":"Property Address"},
    {"key":"property_city","type":"text","label":"City"},
    {"key":"property_state","type":"text","label":"State"},
    {"key":"property_zip","type":"text","label":"ZIP"},
    {"key":"property_county","type":"text","label":"County"},
    {"key":"number_of_units","type":"number","label":"Number of Units"},
    {"key":"is_short_term_rental","type":"boolean","label":"Short-Term Rental"},
    {"key":"is_in_flood_zone","type":"boolean","label":"In Flood Zone"},
    {"key":"flood_zone_type","type":"text","label":"Flood Zone Type"},

    {"key":"borrower_fico","type":"number","label":"Borrower FICO","required":true},
    {"key":"borrower_experience","type":"text","label":"Borrower Experience"},
    {"key":"exit_strategy","type":"select","label":"Exit Strategy","options":["refinance_perm","sell","hold"]},

    {"key":"application_date","type":"date","label":"Application Date"},
    {"key":"approval_date","type":"date","label":"Approval Date"},
    {"key":"expected_close_date","type":"date","label":"Expected Close Date"},
    {"key":"closing_date","type":"date","label":"Closing Date"},
    {"key":"funding_date","type":"date","label":"Funding Date"},
    {"key":"first_payment_date","type":"date","label":"First Payment Date"},
    {"key":"maturity_date","type":"date","label":"Maturity Date"},
    {"key":"origination_date","type":"date","label":"Origination Date"},

    {"key":"originator","type":"text","label":"Originator"},
    {"key":"processor","type":"text","label":"Processor"},
    {"key":"underwriter","type":"text","label":"Underwriter"},
    {"key":"title_company_name","type":"text","label":"Title Company"},
    {"key":"title_company_contact","type":"text","label":"Title Contact"},
    {"key":"insurance_company_name","type":"text","label":"Insurance Company"},
    {"key":"insurance_agent_contact","type":"text","label":"Insurance Contact"},

    {"key":"lender_name","type":"text","label":"Lender"},
    {"key":"is_brokered","type":"boolean","label":"Brokered Deal"},
    {"key":"broker_fee_pct","type":"percent","label":"Broker Fee %"},
    {"key":"broker_sourced","type":"boolean","label":"Broker Sourced"},
    {"key":"source","type":"text","label":"Lead Source"},
    {"key":"priority","type":"select","label":"Priority","options":["low","normal","high","urgent"]}
  ]'::jsonb,

  detail_field_groups = '[
    {"label":"Deal Summary","fields":["loan_amount","property_value","interest_rate","term_months","priority","source"]},
    {"label":"Loan Terms","fields":["amortization_months","interest_only","origination_fee_pct","prepayment_penalty_type","prepayment_penalty_pct","prepayment_penalty_months"]},
    {"label":"Property","fields":["property_type","property_address","property_city","property_state","property_zip","property_county","number_of_units","is_short_term_rental","is_in_flood_zone","flood_zone_type"]},
    {"label":"Rental Income","fields":["monthly_rent","monthly_expenses"]},
    {"label":"Fees & Costs","fields":["origination_fee_amount","processing_fee","legal_fee","points","escrow_holdback","interest_reserve","cash_to_close"]},
    {"label":"Borrower","fields":["borrower_fico","borrower_experience","exit_strategy"]},
    {"label":"Key Dates","fields":["application_date","approval_date","expected_close_date","closing_date","funding_date","first_payment_date","maturity_date","origination_date"]},
    {"label":"Team & Third Parties","fields":["originator","processor","underwriter","title_company_name","title_company_contact","insurance_company_name","insurance_agent_contact"]},
    {"label":"Lender / Broker","fields":["lender_name","is_brokered","broker_sourced","broker_fee_pct"]}
  ]'::jsonb

WHERE slug = 'res_debt_dscr';


-- ═══════════════════════════════════════════════════════════════
-- Residential Debt — RTL (res_debt_rtl)
-- ═══════════════════════════════════════════════════════════════
UPDATE unified_card_types
SET
  uw_fields = '[
    {"key":"purchase_price","type":"currency","label":"Purchase Price","required":true},
    {"key":"as_is_value","type":"currency","label":"As-Is Value","required":true},
    {"key":"rehab_budget","type":"currency","label":"Rehab Budget","required":true},
    {"key":"arv","type":"currency","label":"After Repair Value (ARV)","required":true},
    {"key":"loan_amount","type":"currency","label":"Initial Loan Amount","required":true},
    {"key":"rehab_holdback","type":"currency","label":"Rehab Holdback"},
    {"key":"total_loan","type":"currency","label":"Total Loan (Initial + Holdback)"},
    {"key":"interest_rate","type":"percent","label":"Interest Rate","required":true},
    {"key":"term_months","type":"number","label":"Term (months)","required":true},
    {"key":"extension_months","type":"number","label":"Extension Option (months)"},
    {"key":"extension_fee_pct","type":"percent","label":"Extension Fee %"},
    {"key":"origination_fee_pct","type":"percent","label":"Origination Fee %"},
    {"key":"origination_fee_amount","type":"currency","label":"Origination Fee $"},
    {"key":"processing_fee","type":"currency","label":"Processing Fee"},
    {"key":"legal_fee","type":"currency","label":"Legal Fee"},
    {"key":"points","type":"percent","label":"Points"},
    {"key":"escrow_holdback","type":"currency","label":"Escrow Holdback"},
    {"key":"interest_reserve","type":"currency","label":"Interest Reserve"},
    {"key":"cash_to_close","type":"currency","label":"Cash to Close"},
    {"key":"prepayment_penalty_type","type":"select","label":"Prepayment Penalty Type","options":["none","step_down","fixed"]},
    {"key":"prepayment_penalty_pct","type":"percent","label":"Prepayment Penalty %"},

    {"key":"property_type","type":"select","label":"Property Type","options":["sfr","duplex","triplex","fourplex","condo","townhouse","mixed_use"]},
    {"key":"property_address","type":"text","label":"Property Address"},
    {"key":"property_city","type":"text","label":"City"},
    {"key":"property_state","type":"text","label":"State"},
    {"key":"property_zip","type":"text","label":"ZIP"},
    {"key":"property_county","type":"text","label":"County"},
    {"key":"is_in_flood_zone","type":"boolean","label":"In Flood Zone"},
    {"key":"flood_zone_type","type":"text","label":"Flood Zone Type"},

    {"key":"rehab_scope","type":"select","label":"Rehab Scope","options":["cosmetic","moderate","heavy","gut"]},
    {"key":"estimated_rehab_months","type":"number","label":"Estimated Rehab Timeline (months)"},

    {"key":"borrower_fico","type":"number","label":"Borrower FICO","required":true},
    {"key":"flips_completed","type":"number","label":"Flips Completed (experience)"},
    {"key":"exit_strategy","type":"select","label":"Exit Strategy","options":["sell","refinance_rental","refinance_perm"]},

    {"key":"application_date","type":"date","label":"Application Date"},
    {"key":"approval_date","type":"date","label":"Approval Date"},
    {"key":"expected_close_date","type":"date","label":"Expected Close Date"},
    {"key":"closing_date","type":"date","label":"Closing Date"},
    {"key":"funding_date","type":"date","label":"Funding Date"},
    {"key":"maturity_date","type":"date","label":"Maturity Date"},
    {"key":"origination_date","type":"date","label":"Origination Date"},

    {"key":"originator","type":"text","label":"Originator"},
    {"key":"processor","type":"text","label":"Processor"},
    {"key":"underwriter","type":"text","label":"Underwriter"},
    {"key":"title_company_name","type":"text","label":"Title Company"},
    {"key":"title_company_contact","type":"text","label":"Title Contact"},
    {"key":"insurance_company_name","type":"text","label":"Insurance Company"},

    {"key":"lender_name","type":"text","label":"Lender"},
    {"key":"is_brokered","type":"boolean","label":"Brokered Deal"},
    {"key":"broker_fee_pct","type":"percent","label":"Broker Fee %"},
    {"key":"broker_sourced","type":"boolean","label":"Broker Sourced"},
    {"key":"source","type":"text","label":"Lead Source"},
    {"key":"priority","type":"select","label":"Priority","options":["low","normal","high","urgent"]}
  ]'::jsonb,

  detail_field_groups = '[
    {"label":"Deal Summary","fields":["loan_amount","total_loan","purchase_price","arv","interest_rate","term_months","priority","source"]},
    {"label":"Loan Terms","fields":["extension_months","extension_fee_pct","origination_fee_pct","prepayment_penalty_type","prepayment_penalty_pct"]},
    {"label":"Property","fields":["property_type","property_address","property_city","property_state","property_zip","property_county","is_in_flood_zone","flood_zone_type"]},
    {"label":"Acquisition & Rehab","fields":["as_is_value","rehab_budget","rehab_holdback","rehab_scope","estimated_rehab_months"]},
    {"label":"Fees & Costs","fields":["origination_fee_amount","processing_fee","legal_fee","points","escrow_holdback","interest_reserve","cash_to_close"]},
    {"label":"Borrower","fields":["borrower_fico","flips_completed","exit_strategy"]},
    {"label":"Key Dates","fields":["application_date","approval_date","expected_close_date","closing_date","funding_date","maturity_date","origination_date"]},
    {"label":"Team & Third Parties","fields":["originator","processor","underwriter","title_company_name","title_company_contact","insurance_company_name"]},
    {"label":"Lender / Broker","fields":["lender_name","is_brokered","broker_sourced","broker_fee_pct"]}
  ]'::jsonb

WHERE slug = 'res_debt_rtl';


-- ═══════════════════════════════════════════════════════════════
-- Commercial Equity (comm_equity)
-- ═══════════════════════════════════════════════════════════════
UPDATE unified_card_types
SET
  uw_fields = '[
    {"key":"asking_price","type":"currency","label":"Asking Price"},
    {"key":"offer_price","type":"currency","label":"Offer / Acquisition Price","required":true},
    {"key":"units_lots_sites","type":"number","label":"Units / Lots / Sites","required":true},
    {"key":"noi_current","type":"currency","label":"Current NOI","required":true},
    {"key":"noi_stabilized","type":"currency","label":"Stabilized NOI"},
    {"key":"occupancy_current","type":"percent","label":"Current Occupancy %"},
    {"key":"occupancy_stabilized","type":"percent","label":"Stabilized Occupancy %"},
    {"key":"avg_rent_rate","type":"currency","label":"Avg Rent / Rate"},
    {"key":"capex_budget","type":"currency","label":"Capex Budget"},
    {"key":"hold_period_years","type":"number","label":"Hold Period (years)","required":true},
    {"key":"exit_cap_rate","type":"percent","label":"Exit Cap Rate"},
    {"key":"total_capitalization","type":"currency","label":"Total Capitalization"},
    {"key":"equity_required","type":"currency","label":"Equity Required"},
    {"key":"debt_amount","type":"currency","label":"Debt Amount"},
    {"key":"debt_rate","type":"percent","label":"Debt Rate"},
    {"key":"management_fee_pct","type":"percent","label":"Management Fee %"},
    {"key":"acquisition_type","type":"select","label":"Acquisition Type","options":["direct","fund","jv","syndication"]},
    {"key":"fund_vehicle","type":"text","label":"Fund Vehicle"},
    {"key":"earnest_money_deposit","type":"currency","label":"Earnest Money Deposit"},
    {"key":"dd_expiration_date","type":"date","label":"DD Expiration"},
    {"key":"disposition_cost_pct","type":"percent","label":"Disposition Cost %"},

    {"key":"property_type","type":"select","label":"Property Type","options":["multifamily","mobile_home_park","rv_park","campground","self_storage","marina","mixed_use","other"]},
    {"key":"property_address","type":"text","label":"Property Address"},
    {"key":"property_city","type":"text","label":"City"},
    {"key":"property_state","type":"text","label":"State"},
    {"key":"property_zip","type":"text","label":"ZIP"},
    {"key":"property_county","type":"text","label":"County"},
    {"key":"year_built","type":"number","label":"Year Built"},
    {"key":"total_sf","type":"number","label":"Total Sq Ft"},

    {"key":"debt_term_months","type":"number","label":"Debt Term (months)"},
    {"key":"debt_amortization_months","type":"number","label":"Debt Amortization (months)"},
    {"key":"debt_io_months","type":"number","label":"Debt IO Period (months)"},

    {"key":"application_date","type":"date","label":"Application Date"},
    {"key":"expected_close_date","type":"date","label":"Expected Close Date"},
    {"key":"closing_date","type":"date","label":"Closing Date"},
    {"key":"funding_date","type":"date","label":"Funding Date"},
    {"key":"origination_date","type":"date","label":"Origination Date"},

    {"key":"originator","type":"text","label":"Originator"},
    {"key":"processor","type":"text","label":"Processor"},
    {"key":"title_company_name","type":"text","label":"Title Company"},
    {"key":"closing_attorney_name","type":"text","label":"Closing Attorney"},
    {"key":"insurance_company_name","type":"text","label":"Insurance Company"},

    {"key":"source","type":"text","label":"Lead Source"},
    {"key":"priority","type":"select","label":"Priority","options":["low","normal","high","urgent"]},
    {"key":"investment_strategy","type":"text","label":"Investment Strategy"}
  ]'::jsonb,

  detail_field_groups = '[
    {"label":"Acquisition","fields":["offer_price","asking_price","acquisition_type","fund_vehicle","earnest_money_deposit","dd_expiration_date"]},
    {"label":"Property","fields":["property_type","property_address","property_city","property_state","property_zip","property_county","year_built","total_sf"]},
    {"label":"Property Performance","fields":["units_lots_sites","noi_current","noi_stabilized","occupancy_current","occupancy_stabilized","avg_rent_rate"]},
    {"label":"Capital Stack","fields":["total_capitalization","equity_required","debt_amount","debt_rate","debt_term_months","debt_amortization_months","debt_io_months"]},
    {"label":"Returns & Exit","fields":["hold_period_years","exit_cap_rate","management_fee_pct","capex_budget","disposition_cost_pct"]},
    {"label":"Key Dates","fields":["application_date","expected_close_date","closing_date","funding_date","origination_date"]},
    {"label":"Team & Third Parties","fields":["originator","processor","title_company_name","closing_attorney_name","insurance_company_name"]},
    {"label":"Deal Info","fields":["investment_strategy","priority","source"]}
  ]'::jsonb

WHERE slug = 'comm_equity';
