-- Seed page_layout_sections and page_layout_fields for the Property tab
-- on the deal_detail page type. This brings the Property tab into the
-- Page Layout editor so admins can reorder fields and manage sections.
-- tab_order = 1 places it between Overview (0) and Financials (2).

DO $$
DECLARE
  v_section_id UUID;
BEGIN
  -- ═══════════════════════════════════════════════════════════════
  -- Section: Property Info (core address/type fields, section_group IS NULL or 'Property Details')
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_info', 'Property Info', 'building-2', 0,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_info';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND (fc.section_group IS NULL OR fc.section_group = 'Property Details')
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Land & Parcel
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_land_parcel', 'Land & Parcel', 'map-pin', 1,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_land_parcel';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Land & Parcel'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Structure
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_structure', 'Structure', 'hard-hat', 2,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_structure';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Structure'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Valuation & Tax
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_valuation', 'Valuation & Tax', 'dollar-sign', 3,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_valuation';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Valuation & Tax'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Ownership
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_ownership', 'Ownership', 'user', 4,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_ownership';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Ownership'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Mortgage & Liens
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_liens', 'Mortgage & Liens', 'landmark', 5,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_liens';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Mortgage & Liens'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Sale History
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_sale_history', 'Sale History', 'history', 6,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_sale_history';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Sale History'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- Section: Location
  -- ═══════════════════════════════════════════════════════════════
  INSERT INTO page_layout_sections
    (page_type, section_key, section_label, section_icon, display_order,
     is_visible, is_locked, section_type, tab_key, tab_label, tab_icon, tab_order, tab_locked)
  VALUES
    ('deal_detail', 'property_location', 'Location', 'map', 7,
     true, false, 'fields', 'property', 'Property', 'building-2', 1, true)
  ON CONFLICT (page_type, section_key) DO NOTHING;

  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'property_location';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, 'left', true, 'native', 'property', 'half'
    FROM field_configurations fc
    WHERE fc.module = 'property'
      AND (fc.is_archived = false OR fc.is_archived IS NULL)
      AND fc.section_group = 'Location'
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

END $$;
