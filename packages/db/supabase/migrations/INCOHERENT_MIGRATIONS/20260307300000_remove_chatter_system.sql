-- Chatter system tear-down: removing unused 14-table chat system for V1 cleanup
-- Includes both chat_* (Chatter) and deal_chat_* tables, views, functions, triggers, and RLS policies

-- ============================================================
-- 1. Drop trigger on non-chat table (loans)
-- ============================================================
DROP TRIGGER IF EXISTS trg_loan_status_to_chat ON loans;

-- ============================================================
-- 2. Drop views (must go before tables they reference)
-- ============================================================
DROP VIEW IF EXISTS chat_channels_with_unread CASCADE;
DROP VIEW IF EXISTS chat_my_mentions CASCADE;

-- ============================================================
-- 3. Drop all chat_* tables (CASCADE handles FKs between them)
-- ============================================================
DROP TABLE IF EXISTS chat_activity_feed CASCADE;
DROP TABLE IF EXISTS chat_bookmarks CASCADE;
DROP TABLE IF EXISTS chat_escalation_rules CASCADE;
DROP TABLE IF EXISTS chat_mentions CASCADE;
DROP TABLE IF EXISTS chat_pinned_messages CASCADE;
DROP TABLE IF EXISTS chat_typing_indicators CASCADE;
DROP TABLE IF EXISTS chat_user_presence CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channel_members CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;

-- ============================================================
-- 4. Drop all deal_chat_* tables
-- ============================================================
DROP TABLE IF EXISTS deal_chat_archived_messages CASCADE;
DROP TABLE IF EXISTS deal_chat_read_status CASCADE;
DROP TABLE IF EXISTS deal_chat_messages CASCADE;
DROP TABLE IF EXISTS deal_chat_channels CASCADE;

-- ============================================================
-- 5. Drop all chat-related functions
-- ============================================================
DROP FUNCTION IF EXISTS is_chat_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_channel_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS increment_unread_counts() CASCADE;
DROP FUNCTION IF EXISTS update_thread_count() CASCADE;
DROP FUNCTION IF EXISTS update_chat_updated_at() CASCADE;
DROP FUNCTION IF EXISTS log_loan_status_to_chat() CASCADE;
DROP FUNCTION IF EXISTS sync_deal_chat_to_chat_channels() CASCADE;
DROP FUNCTION IF EXISTS increment_deal_chat_unread() CASCADE;
DROP FUNCTION IF EXISTS update_deal_chat_channel_last_message() CASCADE;
DROP FUNCTION IF EXISTS update_deal_chat_channels_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_deal_chat_messages_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_deal_chat_thread_count() CASCADE;
