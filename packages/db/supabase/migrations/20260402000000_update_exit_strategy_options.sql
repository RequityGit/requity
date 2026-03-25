-- Update exit_strategy field to use new dropdown options: Refinance, Sale, Refinance or Sale
-- Default for new deals: refinance_or_sale

UPDATE field_configurations
SET dropdown_options = '["refinance","sale","refinance_or_sale"]'::jsonb
WHERE field_key = 'exit_strategy' AND module = 'uw_deal';

-- Migrate existing data to new option keys
UPDATE unified_deals
SET uw_data = jsonb_set(uw_data, '{exit_strategy}', '"refinance"')
WHERE uw_data->>'exit_strategy' IN ('refinance_perm', 'refinance_rental');

UPDATE unified_deals
SET uw_data = jsonb_set(uw_data, '{exit_strategy}', '"sale"')
WHERE uw_data->>'exit_strategy' = 'sell';

UPDATE unified_deals
SET uw_data = jsonb_set(uw_data, '{exit_strategy}', '"refinance_or_sale"')
WHERE uw_data->>'exit_strategy' = 'hold';

-- Set default for deals with no exit strategy
UPDATE unified_deals
SET uw_data = jsonb_set(COALESCE(uw_data, '{}'::jsonb), '{exit_strategy}', '"refinance_or_sale"')
WHERE uw_data->>'exit_strategy' IS NULL OR uw_data->>'exit_strategy' = '';
