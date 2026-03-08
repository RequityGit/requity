-- Remove column_position and display_order from field_configurations.
-- Fields are now always sorted alphabetically by label.
ALTER TABLE field_configurations DROP COLUMN column_position;
ALTER TABLE field_configurations DROP COLUMN display_order;
