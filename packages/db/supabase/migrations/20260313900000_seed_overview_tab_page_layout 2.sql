-- Seed page_layout_sections and page_layout_fields for the Overview tab
-- on the deal_detail page type. This replaces the bloated detail_field_groups
-- fallback (88 fields / 12 sections for comm_debt) with a focused summary:
--   Deal Summary, Loan Terms, Key Dates, Team, Capital & Funding
-- (~22 fields total; visibility conditions trim per deal type)
--
-- Fields removed from overview live in their dedicated tabs:
--   Property fields       → Property tab
--   Borrower/Guarantor    → Contacts tab
--   Fees & Costs          → Underwriting tab
--   Bridge / Exit Loan    → Underwriting tab
--   Property Financials   → Property tab / Underwriting tab
--   Lender / Broker       → Contacts tab
--   Third-party contacts  → Contacts tab
--
-- Admins can rearrange from Object Manager without code changes.

DO $$
DECLARE
  v_section_id UUID;
BEGIN

  -- ═══════════════════════════════════════════════════════════════
  -- Hide old bloated overview sections (previously seeded).
  -- Data is preserved; admins can re-enable from Object Manager.
  -- ═══════════════════════════════════════════════════════════════
  UPDATE page_layout_sections
  SET is_visible = false
  WHERE page_type = 'deal_detail'
    AND tab_key = 'overview'
    AND section_key IN (
      'deal_summary', 'loan_terms', 'property_overview',
      'property_financials', 'acquisition_rehab', 'borrower_info',
      'fees_costs', 'capital_funding', 'exit_strategy_section',
      'key_dates', 'team_third_parties'
    );

  -- ═══════════════════════════════════════════════════════════════
  -- Section 1: Deal Summary
  -- Core identity fields visible across all card types.
  -- Visibility conditions on field_configurations handle per-type filtering.
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'overview_deal_summary', 'Deal Summary', 'dollar-sign', 0,
     true, false, 'fields', 'overview', 'Overview', 'panel-right', 0, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_deal_summary';

  IF v_section_id IS NOT NULL THEN
    -- Debt deal fields
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key,
      CASE fc.field_key
        WHEN 'loan_amount' THEN 0
        WHEN 'property_value' THEN 1
        WHEN 'loan_purpose' THEN 2
        WHEN 'investment_strategy' THEN 3
        WHEN 'priority' THEN 4
        WHEN 'source' THEN 5
        WHEN 'offer_price' THEN 0
        WHEN 'asking_price' THEN 1
        WHEN 'acquisition_type' THEN 2
        WHEN 'fund_vehicle' THEN 3
        ELSE 10
      END,
      'left', true, 'native', NULL, 'half'
    FROM field_configurations fc
    WHERE fc.module = 'uw_deal'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.field_key IN (
        'loan_amount', 'property_value', 'loan_purpose', 'investment_strategy',
        'priority', 'source',
        'offer_price', 'asking_price', 'acquisition_type', 'fund_vehicle'
      )
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section 2: Loan Terms
  -- Core terms people quote; detailed terms live in UW tab.
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'overview_loan_terms', 'Loan Terms', 'file-text', 1,
     true, false, 'fields', 'overview', 'Overview', 'panel-right', 0, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_loan_terms';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key,
      CASE fc.field_key
        WHEN 'interest_rate' THEN 0
        WHEN 'term_months' THEN 1
        WHEN 'amortization_months' THEN 2
        WHEN 'interest_only' THEN 3
        WHEN 'recourse' THEN 4
        WHEN 'origination_fee_pct' THEN 5
        ELSE 10
      END,
      'left', true, 'native', NULL, 'half'
    FROM field_configurations fc
    WHERE fc.module = 'uw_deal'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.field_key IN (
        'interest_rate', 'term_months', 'amortization_months',
        'interest_only', 'recourse', 'origination_fee_pct'
      )
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section 3: Key Dates
  -- Four dates people actually check; full timeline in a sub-section.
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'overview_key_dates', 'Key Dates', 'calendar', 2,
     true, false, 'fields', 'overview', 'Overview', 'panel-right', 0, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_key_dates';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key,
      CASE fc.field_key
        WHEN 'application_date' THEN 0
        WHEN 'approval_date' THEN 1
        WHEN 'expected_close_date' THEN 2
        WHEN 'closing_date' THEN 3
        ELSE 10
      END,
      'left', true, 'native', NULL, 'half'
    FROM field_configurations fc
    WHERE fc.module = 'uw_deal'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.field_key IN (
        'application_date', 'approval_date', 'expected_close_date', 'closing_date'
      )
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section 4: Team
  -- Internal team only; third-party contacts belong in Contacts tab.
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'overview_team', 'Team', 'users', 3,
     true, false, 'fields', 'overview', 'Overview', 'panel-right', 0, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_team';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key,
      CASE fc.field_key
        WHEN 'originator' THEN 0
        WHEN 'processor' THEN 1
        WHEN 'underwriter' THEN 2
        ELSE 10
      END,
      'left', true, 'native', NULL, 'half'
    FROM field_configurations fc
    WHERE fc.module = 'uw_deal'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.field_key IN ('originator', 'processor', 'underwriter')
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section 5: Capital & Funding
  -- Trimmed to 3 key fields; full capital structure in UW tab.
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'overview_capital', 'Capital & Funding', 'landmark', 4,
     true, false, 'fields', 'overview', 'Overview', 'panel-right', 0, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_capital';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key,
      CASE fc.field_key
        WHEN 'capital_partner' THEN 0
        WHEN 'funding_channel' THEN 1
        WHEN 'funding_source' THEN 2
        ELSE 10
      END,
      'left', true, 'native', NULL, 'half'
    FROM field_configurations fc
    WHERE fc.module = 'uw_deal'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.field_key IN ('capital_partner', 'funding_channel', 'funding_source')
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

END $$;
