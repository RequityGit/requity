-- Remove "Funding Date", "Origination Date", and "Actual Close Date" everywhere;
-- keep only "Closing Date" for pipeline deals.
-- 1. Backfill uw_data.closing_date from actual_close_date where missing
-- 2. Strip funding_date, origination_date, actual_close_date from uw_data
-- 3. Remove from page_layout_fields and field_configurations
-- 4. Drop actual_close_date column from unified_deals

-- 1. Backfill: set uw_data.closing_date from actual_close_date where we have it and closing_date not set
UPDATE unified_deals
SET uw_data = jsonb_set(
  COALESCE(uw_data, '{}'::jsonb),
  '{closing_date}',
  to_jsonb(actual_close_date::text)
)
WHERE actual_close_date IS NOT NULL
  AND (uw_data IS NULL OR uw_data->'closing_date' IS NULL);

-- 2. Strip the three keys from uw_data
UPDATE unified_deals
SET uw_data = uw_data - 'funding_date' - 'origination_date' - 'actual_close_date'
WHERE uw_data ?| ARRAY['funding_date', 'origination_date', 'actual_close_date'];

-- 3. Remove layout placements for these fields
DELETE FROM page_layout_fields
WHERE field_config_id IN (
  SELECT id FROM field_configurations
  WHERE (module = 'uw_deal' AND field_key IN ('funding_date', 'origination_date'))
     OR (module = 'loans_extended' AND field_key IN ('actual_close_date', 'funding_date', 'origination_date'))
     OR (module = 'servicing_loan' AND field_key = 'origination_date')
);

-- 4. Remove field definitions
DELETE FROM field_configurations
WHERE (module = 'uw_deal' AND field_key IN ('funding_date', 'origination_date'))
   OR (module = 'loans_extended' AND field_key IN ('actual_close_date', 'funding_date', 'origination_date'))
   OR (module = 'servicing_loan' AND field_key = 'origination_date');

-- 5. Drop actual_close_date column from unified_deals
ALTER TABLE unified_deals DROP COLUMN IF EXISTS actual_close_date;
