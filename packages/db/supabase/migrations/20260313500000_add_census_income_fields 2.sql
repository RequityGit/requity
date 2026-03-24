-- Add census tract and median household income fields to property modules.
-- These are populated automatically during property enrichment via the
-- Census Bureau ACS API (B19013_001E: Median Household Income by tract).

-- Pipeline underwriting property fields
INSERT INTO field_configurations (module, field_key, field_label, field_type, is_visible, is_locked)
VALUES
  ('uw_property', 'census_tract',         'Census Tract',              'text',     true, false),
  ('uw_property', 'median_tract_income',  'Median Household Income',   'currency', true, false)
ON CONFLICT (module, field_key) DO NOTHING;

-- Control Center / detail property fields
INSERT INTO field_configurations (module, field_key, field_label, field_type, display_order, is_visible, is_locked)
VALUES
  ('property', 'census_tract',         'Census Tract',              'text',     13, true, false),
  ('property', 'median_tract_income',  'Median Household Income',   'currency', 14, true, false)
ON CONFLICT (module, field_key) DO NOTHING;
