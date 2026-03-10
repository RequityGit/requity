-- Create admin_audit_log table for tracking impersonation events
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  impersonated_user_id uuid NOT NULL REFERENCES auth.users(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
  ON admin_audit_log FOR SELECT
  USING (is_super_admin());

-- Only super admins can insert audit logs (via service role in practice)
CREATE POLICY "Super admins can insert audit logs"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_super_admin());

-- Only super admins can update audit logs (to set ended_at)
CREATE POLICY "Super admins can update audit logs"
  ON admin_audit_log FOR UPDATE
  USING (is_super_admin());

-- Index for efficient querying
CREATE INDEX idx_admin_audit_log_super_admin ON admin_audit_log(super_admin_user_id);
CREATE INDEX idx_admin_audit_log_impersonated ON admin_audit_log(impersonated_user_id);
CREATE INDEX idx_admin_audit_log_started_at ON admin_audit_log(started_at DESC);
