-- Migration 011: Create dialer_calls table
-- Tracks phone calls made via Twilio integration, linked to CRM contacts and optionally loans.

CREATE TABLE dialer_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  twilio_call_sid text,
  direction call_direction_enum NOT NULL,
  status call_status_enum DEFAULT 'initiated',
  duration_seconds integer,
  recording_url text,
  notes text,
  performed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  called_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dialer_calls ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_dialer_calls" ON dialer_calls
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
CREATE POLICY "admin_full_access_dialer_calls" ON dialer_calls
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
CREATE INDEX idx_dialer_calls_contact_id ON dialer_calls (contact_id);
CREATE INDEX idx_dialer_calls_loan_id ON dialer_calls (loan_id);
CREATE INDEX idx_dialer_calls_direction ON dialer_calls (direction);
CREATE INDEX idx_dialer_calls_status ON dialer_calls (status);
CREATE INDEX idx_dialer_calls_performed_by ON dialer_calls (performed_by);
CREATE INDEX idx_dialer_calls_called_at ON dialer_calls (called_at);
