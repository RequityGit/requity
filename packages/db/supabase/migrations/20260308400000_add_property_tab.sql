-- Add "Property" tab to all unified card types
-- Places it after "Overview" (position 1.5 sorts between index 1 and 2)

UPDATE unified_card_types
SET detail_tabs = (
  SELECT jsonb_agg(tab ORDER BY idx)
  FROM (
    SELECT tab, idx
    FROM jsonb_array_elements_text(detail_tabs) WITH ORDINALITY AS t(tab, idx)
    WHERE tab != 'Property'
    UNION ALL
    SELECT 'Property'::text, 1.5
  ) sub
)
WHERE slug IN ('comm_debt', 'res_debt_dscr', 'res_debt_rtl', 'comm_equity')
  AND NOT detail_tabs @> '"Property"'::jsonb;

-- Seed field_configurations for the property module (Control Center support)
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked)
VALUES
  ('property', 'property_type',        'Property Type',       'dropdown', 'left',  0,  true, true),
  ('property', 'property_address',     'Address',             'text',     'left',  1,  true, true),
  ('property', 'property_city',        'City',                'text',     'left',  2,  true, false),
  ('property', 'property_state',       'State',               'text',     'right', 3,  true, false),
  ('property', 'property_zip',         'ZIP',                 'text',     'right', 4,  true, false),
  ('property', 'property_county',      'County',              'text',     'right', 5,  true, false),
  ('property', 'parcel_id',            'Parcel ID / APN',     'text',     'right', 6,  true, false),
  ('property', 'number_of_units',      'Number of Units',     'number',   'left',  7,  true, false),
  ('property', 'total_sf',             'Total Sq Ft',         'number',   'right', 8,  true, false),
  ('property', 'year_built',           'Year Built (Vintage)','number',   'left',  9,  true, false),
  ('property', 'is_in_flood_zone',     'In Flood Zone',       'boolean',  'left',  10, true, false),
  ('property', 'flood_zone_type',      'Flood Zone Type',     'text',     'right', 11, true, false),
  ('property', 'is_short_term_rental', 'Short-Term Rental',   'boolean',  'right', 12, true, false)
ON CONFLICT (module, field_key) DO NOTHING;
