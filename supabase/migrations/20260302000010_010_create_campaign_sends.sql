-- Migration 010: Create campaign_sends table
-- Tracks individual email sends per campaign per contact, with delivery/engagement status.

CREATE TABLE campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  sent_at timestamptz,
  postmark_message_id text,
  status send_status_enum DEFAULT 'pending',
  opened_at timestamptz,
  clicked_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_campaign_sends" ON campaign_sends
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
CREATE POLICY "admin_full_access_campaign_sends" ON campaign_sends
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
CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends (campaign_id);
CREATE INDEX idx_campaign_sends_contact_id ON campaign_sends (contact_id);
CREATE INDEX idx_campaign_sends_status ON campaign_sends (status);
CREATE INDEX idx_campaign_sends_sent_at ON campaign_sends (sent_at);
