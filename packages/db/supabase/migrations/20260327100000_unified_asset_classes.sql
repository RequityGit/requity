-- Unified asset class list: add new values to the unified_deals check constraint
-- and update the field_configurations dropdown options.
--
-- Canonical list (13 options):
--   residential_1_4, multifamily, mixed_use, retail, office, industrial,
--   mhc, land, rv_park, self_storage, hospitality, marina, other
--
-- Legacy values kept for backward compat with existing data:
--   sfr, duplex_fourplex, campground, commercial

ALTER TABLE unified_deals DROP CONSTRAINT IF EXISTS unified_deals_asset_class_check;
ALTER TABLE unified_deals ADD CONSTRAINT unified_deals_asset_class_check
  CHECK (asset_class = ANY (ARRAY[
    -- Canonical
    'residential_1_4', 'multifamily', 'mixed_use', 'retail', 'office',
    'industrial', 'mhc', 'land', 'rv_park', 'self_storage',
    'hospitality', 'marina', 'other',
    -- Legacy (kept for existing data)
    'sfr', 'duplex_fourplex', 'campground', 'commercial'
  ]));

-- Update the asset_class dropdown options in field_configurations
-- to show only the 13 canonical options
UPDATE field_configurations
SET dropdown_options = '["residential_1_4", "multifamily", "mixed_use", "retail", "office", "industrial", "mhc", "land", "rv_park", "self_storage", "hospitality", "marina", "other"]'::jsonb
WHERE field_key = 'asset_class' AND module = 'uw_deal';
