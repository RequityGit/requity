-- Phase 2: add admin-created field tracking columns to field_configurations
ALTER TABLE field_configurations ADD COLUMN IF NOT EXISTS is_admin_created BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE field_configurations ADD COLUMN IF NOT EXISTS dropdown_options JSONB DEFAULT NULL;
ALTER TABLE field_configurations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Backfill: all existing rows are system-created (not admin-created)
UPDATE field_configurations SET is_admin_created = false WHERE is_admin_created IS DISTINCT FROM false;
