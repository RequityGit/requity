-- Merge Key Dates into Deal Summary: move date_created and closing_date to the bottom
-- of the Deal Summary section, then remove the separate Key Dates section.

DO $$
DECLARE
  v_deal_summary_section_id UUID;
  v_fc_date_created_id UUID;
  v_fc_closing_date_id UUID;
BEGIN
  SELECT id INTO v_deal_summary_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_deal_summary';

  IF v_deal_summary_section_id IS NULL THEN
    RETURN;
  END IF;

  -- Add date_created and closing_date to Deal Summary at the bottom (display_order 10, 11)
  SELECT id INTO v_fc_date_created_id
  FROM field_configurations
  WHERE module = 'uw_deal' AND field_key = 'date_created';

  SELECT id INTO v_fc_closing_date_id
  FROM field_configurations
  WHERE module = 'uw_deal' AND field_key = 'closing_date';

  IF v_fc_date_created_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    VALUES
      (v_deal_summary_section_id, v_fc_date_created_id, 'date_created', 10, 'left', true, 'native', NULL, 'half')
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  IF v_fc_closing_date_id IS NOT NULL THEN
    INSERT INTO page_layout_fields
      (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
    VALUES
      (v_deal_summary_section_id, v_fc_closing_date_id, 'closing_date', 11, 'left', true, 'native', NULL, 'half')
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- Remove the Key Dates section (cascade deletes its fields)
  DELETE FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_key_dates';
END $$;
