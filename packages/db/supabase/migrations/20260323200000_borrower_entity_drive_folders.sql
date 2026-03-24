-- Add Google Drive folder columns to crm_contacts and deal_borrowing_entities
-- and create google_drive_shortcuts table for tracking shortcuts in deal folders

-- 1. Add drive folder columns to crm_contacts (borrower people)
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS google_drive_folder_id text,
  ADD COLUMN IF NOT EXISTS google_drive_folder_url text;

-- 2. Add drive folder columns to deal_borrowing_entities
ALTER TABLE deal_borrowing_entities
  ADD COLUMN IF NOT EXISTS google_drive_folder_id text,
  ADD COLUMN IF NOT EXISTS google_drive_folder_url text;

-- 3. Create google_drive_shortcuts table
CREATE TABLE IF NOT EXISTS google_drive_shortcuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('borrower', 'entity')),
  target_id uuid NOT NULL,
  shortcut_drive_id text NOT NULL,
  target_folder_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, target_type, target_id)
);

ALTER TABLE google_drive_shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages shortcuts"
  ON google_drive_shortcuts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view shortcuts"
  ON google_drive_shortcuts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
  ));
