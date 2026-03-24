-- ═══════════════════════════════════════════════════════════
-- Seed UW Output Formulas into field_configurations
--
-- Migrates all computed output definitions (LTV, DSCR, etc.)
-- from unified_card_types.uw_outputs into field_configurations
-- as formula-type fields. After this migration, the Object
-- Manager is the single source of truth for output formulas.
-- ═══════════════════════════════════════════════════════════

INSERT INTO field_configurations
  (module, field_key, field_label, field_type, formula_expression, formula_output_format, formula_decimal_places, is_read_only, is_visible, is_archived, display_order)
VALUES
  ('uw_deal', 'ltv', 'LTV', 'formula',
   'loan_amount / property_value * 100', 'percent', 2,
   true, true, false, 900),

  ('uw_deal', 'ltv_as_is', 'LTV (As-Is)', 'formula',
   'loan_amount / as_is_value * 100', 'percent', 2,
   true, true, false, 901),

  ('uw_deal', 'ltc', 'LTC', 'formula',
   'total_loan / (purchase_price + rehab_budget) * 100', 'percent', 2,
   true, true, false, 902),

  ('uw_deal', 'ltv_arv', 'LTV (ARV)', 'formula',
   'total_loan / arv * 100', 'percent', 2,
   true, true, false, 903),

  ('uw_deal', 'dscr', 'DSCR', 'formula',
   'monthly_rent / monthly_expenses', 'number', 2,
   true, true, false, 904),

  ('uw_deal', 'debt_yield', 'Debt Yield', 'formula',
   'COALESCE(noi, noi_current) / loan_amount * 100', 'percent', 2,
   true, true, false, 905),

  ('uw_deal', 'cap_rate_going_in', 'Going-In Cap Rate', 'formula',
   'COALESCE(noi_current, noi) / COALESCE(property_value, offer_price) * 100', 'percent', 2,
   true, true, false, 906),

  ('uw_deal', 'cap_rate_stabilized', 'Stabilized Cap Rate', 'formula',
   'noi_stabilized / COALESCE(offer_price, property_value) * 100', 'percent', 2,
   true, true, false, 907),

  ('uw_deal', 'cap_rate_in', 'Cap Rate (In-Place)', 'formula',
   'noi_current / offer_price * 100', 'percent', 2,
   true, true, false, 908),

  ('uw_deal', 'price_per_unit', 'Price Per Unit', 'formula',
   'COALESCE(offer_price, property_value) / units_lots_sites', 'currency', 0,
   true, true, false, 909),

  ('uw_deal', 'bridge_ltv', 'Bridge LTV', 'formula',
   'bridge_loan_amount / property_value * 100', 'percent', 2,
   true, true, false, 910),

  ('uw_deal', 'exit_dscr', 'Exit DSCR', 'formula',
   'COALESCE(noi_stabilized, noi_current, noi) / (PMT(exit_rate / 1200, exit_amortization_years * 12, -exit_loan_amount) * 12)', 'number', 2,
   true, true, false, 911),

  ('uw_deal', 'annual_debt_service', 'Annual Debt Service', 'formula',
   NULL, 'currency', 0,
   true, true, false, 912)

ON CONFLICT (module, field_key) DO UPDATE
  SET field_label          = EXCLUDED.field_label,
      field_type           = EXCLUDED.field_type,
      formula_expression   = EXCLUDED.formula_expression,
      formula_output_format = EXCLUDED.formula_output_format,
      formula_decimal_places = EXCLUDED.formula_decimal_places,
      is_read_only         = true,
      is_visible           = true,
      is_archived          = false,
      updated_at           = now();
