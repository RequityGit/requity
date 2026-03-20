-- Migration 007: Alter crm_activities — add new columns
-- Adds scheduling, completion tracking, direction, and entity linking fields.

ALTER TABLE crm_activities
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS direction activity_direction_enum,
  ADD COLUMN IF NOT EXISTS linked_entity_type linked_entity_type_enum,
  ADD COLUMN IF NOT EXISTS linked_entity_id uuid;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled_at ON crm_activities (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_is_completed ON crm_activities (is_completed);
CREATE INDEX IF NOT EXISTS idx_crm_activities_linked_entity_type ON crm_activities (linked_entity_type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_linked_entity_id ON crm_activities (linked_entity_id);
