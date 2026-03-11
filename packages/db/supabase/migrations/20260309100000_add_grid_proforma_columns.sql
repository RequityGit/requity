-- Add grid pro forma template to card types and overrides to deals
-- The uw_grid column stores the grid template definition (rows + formulas)
-- The uw_grid_overrides column stores per-cell overrides on individual deals

ALTER TABLE unified_card_types
  ADD COLUMN IF NOT EXISTS uw_grid JSONB DEFAULT NULL;

ALTER TABLE unified_deals
  ADD COLUMN IF NOT EXISTS uw_grid_overrides JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN unified_card_types.uw_grid IS
  'Grid pro forma template: rows with formulas evaluated across time periods';

COMMENT ON COLUMN unified_deals.uw_grid_overrides IS
  'Per-cell overrides for grid pro forma. Key format: {row_key}:{period}';
