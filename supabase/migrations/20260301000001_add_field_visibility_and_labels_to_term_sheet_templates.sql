-- Add field_visibility JSONB column to control per-field toggles
-- Structure: { "section_key": { "field_key": true/false } }
ALTER TABLE term_sheet_templates
  ADD COLUMN IF NOT EXISTS field_visibility jsonb DEFAULT NULL;

-- Add field_labels JSONB column for custom label overrides
-- Structure: { "section_key.field_key": "Custom Label" }
ALTER TABLE term_sheet_templates
  ADD COLUMN IF NOT EXISTS field_labels jsonb DEFAULT NULL;
