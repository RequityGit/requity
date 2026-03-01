-- Migration 012: Create contact_audit_log table
-- Tracks all changes to compliance-sensitive fields on crm_contacts:
-- lifecycle_stage, marketing_consent, consent_granted_at, dnc, dnc_reason.

CREATE TABLE contact_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  action audit_action_enum NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid, -- No FK to profiles; system-level changes may not have a profile
  changed_at timestamptz DEFAULT now(),
  context text -- e.g., 'manual_update', 'import', 'api_sync'
);

-- Enable RLS
ALTER TABLE contact_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_contact_audit_log" ON contact_audit_log
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
CREATE POLICY "admin_full_access_contact_audit_log" ON contact_audit_log
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
CREATE INDEX idx_contact_audit_log_contact_id ON contact_audit_log (contact_id);
CREATE INDEX idx_contact_audit_log_field_name ON contact_audit_log (field_name);
CREATE INDEX idx_contact_audit_log_changed_at ON contact_audit_log (changed_at);
CREATE INDEX idx_contact_audit_log_changed_by ON contact_audit_log (changed_by);
