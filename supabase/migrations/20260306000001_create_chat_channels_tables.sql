-- ============================================================
-- CHAT CHANNELS SYSTEM
-- Full messaging infrastructure with channels, members,
-- messages, presence, typing indicators, mentions,
-- bookmarks, pinned messages, activity feed, and escalation rules.
-- ============================================================

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE chat_channel_type AS ENUM (
  'deal_room',
  'team',
  'direct',
  'group',
  'investor_room',
  'borrower_room',
  'project_room'
);

CREATE TYPE chat_entity_type AS ENUM (
  'loan',
  'property',
  'fund',
  'investor',
  'borrower',
  'borrower_entity',
  'ops_project',
  'crm_contact',
  'opportunity'
);

CREATE TYPE chat_member_role AS ENUM (
  'owner',
  'admin',
  'member',
  'guest',
  'observer'
);

CREATE TYPE chat_message_type AS ENUM (
  'text',
  'system',
  'file',
  'ai_response',
  'action_item',
  'status_update',
  'mention_link'
);

-- ============================================================
-- Helper Functions (required before RLS policies)
-- ============================================================

-- Check if a user has chat admin privileges (admin or super_admin role)
CREATE OR REPLACE FUNCTION is_chat_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
$$;

-- Check if a user is an active member of a channel
CREATE OR REPLACE FUNCTION is_channel_member(p_channel_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_channel_members
    WHERE channel_id = p_channel_id
      AND user_id = p_user_id
      AND left_at IS NULL
  );
$$;

-- ============================================================
-- Tables
-- ============================================================

-- chat_channels: top-level channel definitions
CREATE TABLE chat_channels (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      TEXT NOT NULL,
  description               TEXT,
  channel_type              chat_channel_type NOT NULL,
  icon                      TEXT,
  linked_entity_type        chat_entity_type,
  linked_entity_id          UUID,
  is_archived               BOOLEAN NOT NULL DEFAULT false,
  is_private                BOOLEAN NOT NULL DEFAULT true,
  allow_external            BOOLEAN NOT NULL DEFAULT false,
  auto_created              BOOLEAN NOT NULL DEFAULT false,
  default_notification_level TEXT NOT NULL DEFAULT 'all',
  pinned_context            JSONB DEFAULT '{}',
  metadata                  JSONB DEFAULT '{}',
  last_message_at           TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enforce one channel per entity+type combination
CREATE UNIQUE INDEX unique_entity_channel
  ON chat_channels (linked_entity_type, linked_entity_id, channel_type);

-- chat_channel_members: per-user membership and preferences
CREATE TABLE chat_channel_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  role                chat_member_role NOT NULL DEFAULT 'member',
  notification_level  TEXT,
  last_read_message_id UUID,
  last_read_at        TIMESTAMPTZ,
  unread_count        INT NOT NULL DEFAULT 0,
  is_muted            BOOLEAN NOT NULL DEFAULT false,
  is_pinned           BOOLEAN NOT NULL DEFAULT false,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at             TIMESTAMPTZ,
  metadata            JSONB DEFAULT '{}',
  CONSTRAINT unique_channel_member UNIQUE (channel_id, user_id)
);

-- chat_messages: individual messages within a channel
CREATE TABLE chat_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id          UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id           UUID REFERENCES auth.users(id),
  message_type        chat_message_type NOT NULL DEFAULT 'text',
  content             TEXT,
  content_html        TEXT,
  parent_message_id   UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  thread_count        INT NOT NULL DEFAULT 0,
  thread_last_reply_at TIMESTAMPTZ,
  linked_entities     JSONB DEFAULT '[]',
  attachments         JSONB DEFAULT '[]',
  reactions           JSONB DEFAULT '{}',
  action_item         JSONB,
  is_edited           BOOLEAN NOT NULL DEFAULT false,
  edited_at           TIMESTAMPTZ,
  is_deleted          BOOLEAN NOT NULL DEFAULT false,
  deleted_at          TIMESTAMPTZ,
  ai_metadata         JSONB,
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_typing_indicators: ephemeral typing state per user per channel
CREATE TABLE chat_typing_indicators (
  channel_id  UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- chat_user_presence: online/away/busy/offline status
CREATE TABLE chat_user_presence (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id),
  status        TEXT NOT NULL DEFAULT 'offline'
                  CHECK (status IN ('online','away','busy','offline')),
  custom_status TEXT,
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_mentions: explicit @-mentions within messages
CREATE TABLE chat_mentions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id            UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  channel_id            UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  mentioned_user_id     UUID REFERENCES auth.users(id),
  mention_type          TEXT NOT NULL DEFAULT 'user',
  mentioned_entity_type chat_entity_type,
  mentioned_entity_id   UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_bookmarks: per-user message bookmarks
CREATE TABLE chat_bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_id)
);

-- chat_pinned_messages: channel-level pinned messages
CREATE TABLE chat_pinned_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by  UUID NOT NULL REFERENCES auth.users(id),
  pinned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel_id, message_id)
);

-- chat_activity_feed: system-generated event log per channel
CREATE TABLE chat_activity_feed (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  event_source TEXT NOT NULL,
  event_data   JSONB NOT NULL DEFAULT '{}',
  summary      TEXT NOT NULL,
  icon         TEXT,
  source_table TEXT,
  source_id    UUID,
  actor_id     UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chat_escalation_rules: routing/escalation rules per channel type
CREATE TABLE chat_escalation_rules (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type              chat_channel_type,
  entity_type               chat_entity_type,
  event_pattern             TEXT NOT NULL,
  primary_assignee_id       UUID REFERENCES auth.users(id),
  escalation_assignee_id    UUID REFERENCES auth.users(id),
  escalation_timeout_minutes INT NOT NULL DEFAULT 240,
  priority                  TEXT NOT NULL DEFAULT 'normal',
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  metadata                  JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_chat_channels_type          ON chat_channels (channel_type);
CREATE INDEX idx_chat_channels_entity        ON chat_channels (linked_entity_type, linked_entity_id);
CREATE INDEX idx_chat_channels_last_message  ON chat_channels (last_message_at DESC NULLS LAST);
CREATE INDEX idx_chat_channels_archived      ON chat_channels (is_archived) WHERE NOT is_archived;

CREATE INDEX idx_chat_members_user     ON chat_channel_members (user_id);
CREATE INDEX idx_chat_members_channel  ON chat_channel_members (channel_id);
CREATE INDEX idx_chat_members_unread   ON chat_channel_members (user_id, unread_count)
  WHERE unread_count > 0;

CREATE INDEX idx_chat_messages_channel_created ON chat_messages (channel_id, created_at DESC);
CREATE INDEX idx_chat_messages_not_deleted     ON chat_messages (channel_id, created_at DESC)
  WHERE NOT is_deleted;
CREATE INDEX idx_chat_messages_sender          ON chat_messages (sender_id);
CREATE INDEX idx_chat_messages_thread          ON chat_messages (parent_message_id)
  WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_chat_messages_type            ON chat_messages (message_type);
CREATE INDEX idx_chat_messages_action_items    ON chat_messages (channel_id)
  WHERE action_item IS NOT NULL;
CREATE INDEX idx_chat_messages_search          ON chat_messages
  USING gin (to_tsvector('english', COALESCE(content, '')));

CREATE INDEX idx_chat_mentions_message  ON chat_mentions (message_id);
CREATE INDEX idx_chat_mentions_channel  ON chat_mentions (channel_id);
CREATE INDEX idx_chat_mentions_user     ON chat_mentions (mentioned_user_id);

CREATE INDEX idx_chat_bookmarks_user     ON chat_bookmarks (user_id, created_at DESC);
CREATE INDEX idx_chat_bookmarks_message  ON chat_bookmarks (message_id);

CREATE INDEX idx_chat_activity_channel  ON chat_activity_feed (channel_id, created_at DESC);
CREATE INDEX idx_chat_activity_type     ON chat_activity_feed (event_type);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE chat_channels          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_presence     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mentions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_bookmarks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_pinned_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_activity_feed     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_escalation_rules  ENABLE ROW LEVEL SECURITY;

-- chat_channels policies
CREATE POLICY channels_select ON chat_channels FOR SELECT
  USING (is_chat_admin(auth.uid()) OR is_channel_member(id, auth.uid()) OR NOT is_private);

CREATE POLICY channels_insert ON chat_channels FOR INSERT
  WITH CHECK (is_chat_admin(auth.uid()));

CREATE POLICY channels_update ON chat_channels FOR UPDATE
  USING (is_chat_admin(auth.uid()));

-- chat_channel_members policies
CREATE POLICY members_select ON chat_channel_members FOR SELECT
  USING (is_chat_admin(auth.uid()) OR is_channel_member(channel_id, auth.uid()));

CREATE POLICY members_insert ON chat_channel_members FOR INSERT
  WITH CHECK (is_chat_admin(auth.uid()));

CREATE POLICY members_update_own ON chat_channel_members FOR UPDATE
  USING (user_id = auth.uid() OR is_chat_admin(auth.uid()));

-- chat_messages policies
CREATE POLICY messages_select ON chat_messages FOR SELECT
  USING (is_channel_member(channel_id, auth.uid()) OR is_chat_admin(auth.uid()));

CREATE POLICY messages_insert ON chat_messages FOR INSERT
  WITH CHECK (
    is_channel_member(channel_id, auth.uid())
    AND (sender_id = auth.uid() OR sender_id IS NULL)
  );

CREATE POLICY messages_update ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid() OR is_chat_admin(auth.uid()));

-- chat_typing_indicators policies
CREATE POLICY typing_select ON chat_typing_indicators FOR SELECT
  USING (is_channel_member(channel_id, auth.uid()));

CREATE POLICY typing_insert ON chat_typing_indicators FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_channel_member(channel_id, auth.uid()));

CREATE POLICY typing_delete ON chat_typing_indicators FOR DELETE
  USING (user_id = auth.uid());

-- chat_user_presence policies
CREATE POLICY presence_select ON chat_user_presence FOR SELECT
  USING (true);

CREATE POLICY presence_insert ON chat_user_presence FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY presence_update ON chat_user_presence FOR UPDATE
  USING (user_id = auth.uid());

-- chat_mentions policies
CREATE POLICY mentions_select ON chat_mentions FOR SELECT
  USING (
    is_channel_member(channel_id, auth.uid())
    OR mentioned_user_id = auth.uid()
    OR is_chat_admin(auth.uid())
  );

CREATE POLICY mentions_insert ON chat_mentions FOR INSERT
  WITH CHECK (is_channel_member(channel_id, auth.uid()));

-- chat_bookmarks policies
CREATE POLICY bookmarks_select_own ON chat_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY bookmarks_insert_own ON chat_bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY bookmarks_delete_own ON chat_bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- chat_pinned_messages policies
CREATE POLICY pinned_select ON chat_pinned_messages FOR SELECT
  USING (is_channel_member(channel_id, auth.uid()) OR is_chat_admin(auth.uid()));

CREATE POLICY pinned_insert ON chat_pinned_messages FOR INSERT
  WITH CHECK (is_channel_member(channel_id, auth.uid()));

CREATE POLICY pinned_delete ON chat_pinned_messages FOR DELETE
  USING (pinned_by = auth.uid() OR is_chat_admin(auth.uid()));

-- chat_activity_feed policies
CREATE POLICY activity_select ON chat_activity_feed FOR SELECT
  USING (is_channel_member(channel_id, auth.uid()) OR is_chat_admin(auth.uid()));

CREATE POLICY activity_insert ON chat_activity_feed FOR INSERT
  WITH CHECK (is_chat_admin(auth.uid()));

-- chat_escalation_rules policies
CREATE POLICY escalation_select ON chat_escalation_rules FOR SELECT
  USING (
    is_chat_admin(auth.uid())
    OR primary_assignee_id = auth.uid()
    OR escalation_assignee_id = auth.uid()
  );

CREATE POLICY escalation_manage ON chat_escalation_rules FOR ALL
  USING (is_chat_admin(auth.uid()));

-- ============================================================
-- Trigger Functions
-- ============================================================

-- Shared updated_at setter for all chat tables
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Increment unread counts and update channel last_message_at on new message
CREATE OR REPLACE FUNCTION increment_unread_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_channel_members
  SET unread_count = unread_count + 1
  WHERE channel_id = NEW.channel_id
    AND user_id != COALESCE(NEW.sender_id, '00000000-0000-0000-0000-000000000000')
    AND left_at IS NULL;

  UPDATE chat_channels
  SET last_message_at = NEW.created_at
  WHERE id = NEW.channel_id;

  RETURN NEW;
END;
$$;

-- Update thread_count and thread_last_reply_at on parent message when a reply is inserted
CREATE OR REPLACE FUNCTION update_thread_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE chat_messages
    SET thread_count = thread_count + 1,
        thread_last_reply_at = NEW.created_at
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER trg_chat_channels_updated
  BEFORE UPDATE ON chat_channels
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER trg_chat_messages_updated
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER trg_chat_user_presence_updated
  BEFORE UPDATE ON chat_user_presence
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER trg_chat_escalation_rules_updated
  BEFORE UPDATE ON chat_escalation_rules
  FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at();

CREATE TRIGGER trg_chat_message_unread
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION increment_unread_counts();

CREATE TRIGGER trg_chat_thread_count
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_count();

-- ============================================================
-- Views
-- ============================================================

-- Channels visible to the current user, enriched with membership state and last message
CREATE OR REPLACE VIEW chat_channels_with_unread AS
SELECT
  c.id,
  c.name,
  c.description,
  c.channel_type,
  c.icon,
  c.linked_entity_type,
  c.linked_entity_id,
  c.is_archived,
  c.is_private,
  c.allow_external,
  c.auto_created,
  c.default_notification_level,
  c.pinned_context,
  c.metadata,
  c.created_at,
  c.updated_at,
  c.last_message_at,
  cm.unread_count,
  cm.is_muted,
  cm.is_pinned,
  cm.notification_level,
  cm.role AS member_role,
  cm.last_read_at,
  (
    SELECT json_build_object(
      'id',           m.id,
      'content',      left(m.content, 100),
      'sender_id',    m.sender_id,
      'message_type', m.message_type,
      'created_at',   m.created_at
    )
    FROM chat_messages m
    WHERE m.channel_id = c.id AND NOT m.is_deleted
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_message
FROM chat_channels c
JOIN chat_channel_members cm ON cm.channel_id = c.id
WHERE cm.left_at IS NULL
  AND NOT c.is_archived;

-- Current user's unread @-mentions with message and channel context
CREATE OR REPLACE VIEW chat_my_mentions AS
SELECT
  mn.id,
  mn.message_id,
  mn.channel_id,
  mn.mention_type,
  mn.created_at,
  m.content     AS message_content,
  m.sender_id,
  m.message_type,
  c.name        AS channel_name,
  c.channel_type,
  c.linked_entity_type,
  c.linked_entity_id,
  p.name        AS sender_name,
  p.avatar_url  AS sender_avatar
FROM chat_mentions mn
JOIN chat_messages m  ON m.id  = mn.message_id
JOIN chat_channels c  ON c.id  = mn.channel_id
JOIN profiles      p  ON p.id  = m.sender_id
WHERE NOT m.is_deleted;
