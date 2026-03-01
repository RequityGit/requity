-- Migration 006: Create contact_tags table
-- Free-form tagging system for CRM contacts.

CREATE TABLE contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Unique constraint: one tag per contact
ALTER TABLE contact_tags
  ADD CONSTRAINT uq_contact_tags_contact_tag UNIQUE (contact_id, tag);

-- Enable RLS
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_contact_tags" ON contact_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
    )
  );

-- Admin full access policy
CREATE POLICY "admin_full_access_contact_tags" ON contact_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_contact_tags_contact_id ON contact_tags (contact_id);
CREATE INDEX idx_contact_tags_tag ON contact_tags (tag);
