-- Add 'industrial' to the unified_deals asset_class check constraint
ALTER TABLE unified_deals DROP CONSTRAINT IF EXISTS unified_deals_asset_class_check;
ALTER TABLE unified_deals ADD CONSTRAINT unified_deals_asset_class_check
  CHECK (asset_class = ANY (ARRAY[
    'sfr', 'duplex_fourplex', 'multifamily', 'mhc',
    'rv_park', 'campground', 'commercial', 'industrial',
    'mixed_use', 'land'
  ]));

-- Update asset_class dropdown_options to use DB-valid values (snake_case)
UPDATE field_configurations
SET dropdown_options = '["sfr", "duplex_fourplex", "multifamily", "mhc", "rv_park", "campground", "commercial", "industrial", "mixed_use", "land"]'::jsonb
WHERE field_key = 'asset_class' AND module = 'uw_deal';
