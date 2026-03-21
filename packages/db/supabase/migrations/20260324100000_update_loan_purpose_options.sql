-- Update loan_purpose dropdown options: Purchase, Refinance, New Construction
-- Removes: acquisition, cash_out, value_add
-- Adds: purchase, new_construction
UPDATE field_configurations
SET dropdown_options = '["purchase","refinance","new_construction"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'loan_purpose';

-- Rename "Property Value / Appraisal" to "As-Is Value" for clarity
UPDATE field_configurations
SET field_label = 'As-Is Value'
WHERE module = 'uw_deal' AND field_key = 'as_is_value';

-- Update property_type dropdown: merge SFR + Duplex/Fourplex into Residential (1-4), remove Campground
-- Rename field label from "Property Type" to "Asset Class"
UPDATE field_configurations
SET field_label = 'Asset Class',
    dropdown_options = '["residential_1_4","multifamily","mhc","rv_park","commercial","mixed_use","land"]'::jsonb
WHERE module = 'uw_property' AND field_key = 'property_type';

-- Migrate existing deals: sfr and duplex_fourplex -> residential_1_4, campground -> rv_park
UPDATE unified_deals
SET uw_data = jsonb_set(uw_data, '{property_type}', '"residential_1_4"')
WHERE uw_data->>'property_type' IN ('sfr', 'duplex_fourplex');

UPDATE unified_deals
SET uw_data = jsonb_set(uw_data, '{property_type}', '"rv_park"')
WHERE uw_data->>'property_type' = 'campground';

-- Also update the properties table if it has these values
UPDATE properties
SET property_type = 'residential_1_4'
WHERE property_type IN ('sfr', 'duplex_fourplex');

UPDATE properties
SET property_type = 'rv_park'
WHERE property_type = 'campground';

-- Update funding_channel dropdown: Balance Sheet, Correspondent, Brokered
UPDATE field_configurations
SET dropdown_options = '["balance_sheet","correspondent","brokered"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'funding_channel';

-- Archive funding_source, investment_strategy, capital_partner (no longer used)
UPDATE field_configurations
SET is_visible = false, is_archived = true
WHERE module = 'uw_deal' AND field_key IN ('funding_source', 'investment_strategy', 'capital_partner');

-- Convert Lead Source from text to dropdown with standard options
UPDATE field_configurations
SET field_type = 'dropdown',
    dropdown_options = '["broker","direct","referral","website","repeat_borrower","marketing","correspondent","other"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'source';
