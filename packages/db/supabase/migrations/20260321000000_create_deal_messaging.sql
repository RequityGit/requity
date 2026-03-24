-- ============================================================
-- Deal Messaging System - Phase 1
-- Centralized deal-level messaging thread
-- ============================================================

-- 1. deal_messages: core messages table
CREATE TABLE IF NOT EXISTS deal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'borrower', 'system')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'portal' CHECK (source IN ('portal', 'email', 'sms')),
  body text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 10000),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_deal_messages_deal_id ON deal_messages(deal_id, created_at DESC);
CREATE INDEX idx_deal_messages_sender ON deal_messages(sender_id) WHERE sender_id IS NOT NULL;
CREATE INDEX idx_deal_messages_contact ON deal_messages(contact_id) WHERE contact_id IS NOT NULL;

-- 2. deal_message_routing: maps reply-to tokens to deals for inbound email/sms
CREATE TABLE IF NOT EXISTS deal_message_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  routing_token text NOT NULL UNIQUE,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deal_message_routing_token ON deal_message_routing(routing_token);
CREATE INDEX idx_deal_message_routing_deal ON deal_message_routing(deal_id);

-- 3. deal_contact_preferences: per-contact notification settings per deal
CREATE TABLE IF NOT EXISTS deal_contact_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  notify_email boolean NOT NULL DEFAULT true,
  notify_sms boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id, contact_id)
);

CREATE INDEX idx_deal_contact_prefs_deal ON deal_contact_preferences(deal_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_message_routing ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_contact_preferences ENABLE ROW LEVEL SECURITY;

-- deal_messages: admin/super_admin full access
CREATE POLICY "admin_select_deal_messages" ON deal_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_insert_deal_messages" ON deal_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Borrowers read their own deal messages (if they have a linked auth user)
CREATE POLICY "borrower_select_deal_messages" ON deal_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN crm_contacts cc ON cc.borrower_id = ur.user_id
      JOIN deal_contacts dc ON dc.contact_id = cc.id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'borrower'
        AND dc.deal_id = deal_messages.deal_id
    )
  );

-- deal_message_routing: admin only
CREATE POLICY "admin_select_deal_message_routing" ON deal_message_routing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_insert_deal_message_routing" ON deal_message_routing
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- deal_contact_preferences: admin full access
CREATE POLICY "admin_select_deal_contact_prefs" ON deal_contact_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "admin_all_deal_contact_prefs" ON deal_contact_preferences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- Enable Realtime on deal_messages
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE deal_messages;
