-- Add "Minimum Interest Earned (Months)" field to field_configurations
INSERT INTO field_configurations (module, field_key, field_label, field_type, is_visible, is_locked)
VALUES ('uw_deal', 'minimum_interest_months', 'Minimum Interest Earned (Months)', 'number', true, false)
ON CONFLICT (module, field_key) DO NOTHING;
