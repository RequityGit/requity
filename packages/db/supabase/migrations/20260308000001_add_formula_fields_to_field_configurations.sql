-- Add formula field support to field_configurations
-- Formula fields are calculated client-side from other fields in the same module.
-- They do NOT create a database column.

ALTER TABLE field_configurations
  ADD COLUMN IF NOT EXISTS formula_expression TEXT,
  ADD COLUMN IF NOT EXISTS formula_source_fields TEXT[];

COMMENT ON COLUMN field_configurations.formula_expression IS 'Expression string for formula fields, e.g. "{loan_amount} * {interest_rate} / 100". Uses {field_key} references.';
COMMENT ON COLUMN field_configurations.formula_source_fields IS 'Array of field_keys this formula depends on. Used for dependency tracking and validation.';
