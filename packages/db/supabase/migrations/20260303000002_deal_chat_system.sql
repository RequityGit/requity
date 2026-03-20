-- ============================================================
-- DEAL CHAT SYSTEM
-- Tables: deal_chat_channels, deal_chat_messages, deal_chat_read_status
-- ============================================================

-- Each loan automatically gets a chat channel
CREATE TABLE IF NOT EXISTS deal_chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL UNIQUE REFERENCES loans(id) ON DELETE CASCADE,

    -- Auto-generated channel name from deal data
    channel_name TEXT NOT NULL,
    channel_type TEXT NOT NULL DEFAULT 'deal'
        CHECK (channel_type IN ('deal', 'opportunity')),

    -- Tracks last activity for sorting in Messaging Hub
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    last_message_by UUID REFERENCES auth.users(id),

    -- Pinned context
    pinned_message_ids UUID[] DEFAULT '{}',

    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual messages within a deal chat
CREATE TABLE IF NOT EXISTS deal_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES deal_chat_channels(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,

    -- Author
    sent_by UUID NOT NULL REFERENCES auth.users(id),

    -- Content
    content TEXT NOT NULL,
    content_html TEXT,

    -- Threading
    thread_parent_id UUID REFERENCES deal_chat_messages(id) ON DELETE SET NULL,
    thread_reply_count INT DEFAULT 0,
    thread_last_reply_at TIMESTAMPTZ,

    -- Mentions
    mentioned_user_ids UUID[] DEFAULT '{}',

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Message type
    message_type TEXT NOT NULL DEFAULT 'message'
        CHECK (message_type IN (
            'message',
            'system',
            'email_notification',
            'note',
            'file_share'
        )),

    -- State
    is_pinned BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user read tracking for unread indicators
CREATE TABLE IF NOT EXISTS deal_chat_read_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES deal_chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_message_id UUID REFERENCES deal_chat_messages(id) ON DELETE SET NULL,
    unread_count INT DEFAULT 0,
    is_muted BOOLEAN DEFAULT false,
    UNIQUE(channel_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_channel ON deal_chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_loan ON deal_chat_messages(loan_id);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_thread ON deal_chat_messages(thread_parent_id);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_mentions ON deal_chat_messages USING GIN (mentioned_user_ids);
CREATE INDEX IF NOT EXISTS idx_deal_chat_messages_type ON deal_chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_deal_chat_channels_loan ON deal_chat_channels(loan_id);
CREATE INDEX IF NOT EXISTS idx_deal_chat_channels_last_msg ON deal_chat_channels(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_chat_read_status_user ON deal_chat_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_chat_read_status_channel ON deal_chat_read_status(channel_id);

-- RLS
ALTER TABLE deal_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_chat_read_status ENABLE ROW LEVEL SECURITY;

-- Admins can view/manage deal chat channels
CREATE POLICY "Admins can view deal chat channels"
    ON deal_chat_channels FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can insert deal chat channels"
    ON deal_chat_channels FOR INSERT TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update deal chat channels"
    ON deal_chat_channels FOR UPDATE TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admins can view/send deal chat messages
CREATE POLICY "Admins can view deal chat messages"
    ON deal_chat_messages FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can send deal chat messages"
    ON deal_chat_messages FOR INSERT TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update own messages"
    ON deal_chat_messages FOR UPDATE TO authenticated
    USING (is_admin() AND sent_by = (SELECT auth.uid()))
    WITH CHECK (is_admin());

-- Users manage their own read status
CREATE POLICY "Users can view own read status"
    ON deal_chat_read_status FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own read status"
    ON deal_chat_read_status FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own read status"
    ON deal_chat_read_status FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_deal_chat_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_channels_updated_at
    BEFORE UPDATE ON deal_chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_chat_channels_updated_at();

CREATE OR REPLACE FUNCTION update_deal_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_chat_messages_updated_at
    BEFORE UPDATE ON deal_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_deal_chat_messages_updated_at();
