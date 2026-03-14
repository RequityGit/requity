-- Backfill dropdown_options for uw_deal loan_purpose when null (e.g. if seed UPDATE didn't run or row was created without options)
UPDATE field_configurations
SET dropdown_options = '["acquisition","refinance","cash_out","value_add","construction"]'::jsonb
WHERE module = 'uw_deal' AND field_key = 'loan_purpose' AND (dropdown_options IS NULL OR dropdown_options = '[]'::jsonb);
