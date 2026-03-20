-- Add Asset Class as a configurable field so it appears in Object Manager and can be
-- added to the Deal Summary (or any section) on the pipeline deal page.
-- Value is stored on unified_deals.asset_class (see FIELD_MAPPING_MAP in app).

INSERT INTO field_configurations
  (module, field_key, field_label, field_type, is_visible, is_locked, display_order)
VALUES
  ('uw_deal', 'asset_class', 'Asset Class', 'dropdown', true, false, 0)
ON CONFLICT (module, field_key) DO UPDATE
  SET field_label = EXCLUDED.field_label,
      field_type = EXCLUDED.field_type,
      is_visible = true,
      is_archived = false,
      updated_at = now();

UPDATE field_configurations
SET dropdown_options = '["sfr","duplex_fourplex","multifamily","mhc","rv_park","campground","commercial","mixed_use","land"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'asset_class';

-- Add Asset Class to Deal Summary section on overview (so it appears by default)
INSERT INTO page_layout_fields
  (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
SELECT
  s.id,
  fc.id,
  'asset_class',
  1,
  'left',
  true,
  'native',
  NULL,
  'half'
FROM page_layout_sections s
CROSS JOIN field_configurations fc
WHERE s.page_type = 'deal_detail' AND s.section_key = 'overview_deal_summary'
  AND fc.module = 'uw_deal' AND fc.field_key = 'asset_class'
ON CONFLICT (section_id, field_key) DO NOTHING;
