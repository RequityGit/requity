-- ============================================================
-- Create contact_files table (mirrors company_files)
-- Code already references this table but it was never created
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE contact_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact files"
  ON contact_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = (SELECT auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
  );

-- Index for quick lookup by contact
CREATE INDEX idx_contact_files_contact_id ON contact_files(contact_id);
