-- ============================================================
-- DEAL CHAT TRIGGERS & FUNCTIONS + ACTIVITY VIEW
-- ============================================================

-- Trigger 1: Auto-create chat channel when a loan is created
CREATE OR REPLACE FUNCTION create_deal_chat_channel()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deal_chat_channels (loan_id, channel_name, channel_type)
    VALUES (
        NEW.id,
        COALESCE(NEW.property_address, 'New Deal') || ' — ' || COALESCE(NEW.type, 'Loan'),
        'deal'
    )
    ON CONFLICT (loan_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_create_deal_chat_on_loan'
    ) THEN
        CREATE TRIGGER trigger_create_deal_chat_on_loan
            AFTER INSERT ON loans
            FOR EACH ROW
            EXECUTE FUNCTION create_deal_chat_channel();
    END IF;
END $$;

-- Trigger 2: Update channel metadata when a message is sent
CREATE OR REPLACE FUNCTION update_deal_channel_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update channel last message info
    UPDATE deal_chat_channels
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        last_message_by = NEW.sent_by,
        updated_at = now()
    WHERE id = NEW.channel_id;

    -- Increment unread count for all users except sender (skip muted)
    UPDATE deal_chat_read_status
    SET unread_count = unread_count + 1
    WHERE channel_id = NEW.channel_id
    AND user_id != NEW.sent_by
    AND is_muted = false;

    -- Update thread metadata if this is a reply
    IF NEW.thread_parent_id IS NOT NULL THEN
        UPDATE deal_chat_messages
        SET thread_reply_count = thread_reply_count + 1,
            thread_last_reply_at = NEW.created_at
        WHERE id = NEW.thread_parent_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_deal_channel_on_message'
    ) THEN
        CREATE TRIGGER trigger_update_deal_channel_on_message
            AFTER INSERT ON deal_chat_messages
            FOR EACH ROW
            EXECUTE FUNCTION update_deal_channel_on_message();
    END IF;
END $$;

-- Trigger 3: Initialize read status for admin/super_admin users when channel is created
CREATE OR REPLACE FUNCTION init_deal_channel_read_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO deal_chat_read_status (channel_id, user_id)
    SELECT NEW.id, ur.user_id
    FROM user_roles ur
    WHERE ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_init_deal_read_status'
    ) THEN
        CREATE TRIGGER trigger_init_deal_read_status
            AFTER INSERT ON deal_chat_channels
            FOR EACH ROW
            EXECUTE FUNCTION init_deal_channel_read_status();
    END IF;
END $$;

-- Trigger 4: Cross-post email sends to deal chat
CREATE OR REPLACE FUNCTION log_deal_email_to_chat()
RETURNS TRIGGER AS $$
DECLARE
    v_channel_id UUID;
    v_to_names TEXT;
BEGIN
    -- Find the loan's chat channel
    SELECT id INTO v_channel_id
    FROM deal_chat_channels
    WHERE loan_id = NEW.loan_id;

    IF v_channel_id IS NOT NULL AND NEW.delivery_status = 'sent' THEN
        -- Build recipient names from JSONB array
        SELECT string_agg(elem->>'name', ', ')
        INTO v_to_names
        FROM jsonb_array_elements(NEW.to_emails) AS elem;

        INSERT INTO deal_chat_messages (
            channel_id, loan_id, sent_by, content,
            message_type
        ) VALUES (
            v_channel_id,
            NEW.loan_id,
            NEW.sent_by,
            'Email sent to ' || COALESCE(v_to_names, 'recipient') || ': "' || NEW.subject || '"',
            'email_notification'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_log_deal_email_to_chat'
    ) THEN
        CREATE TRIGGER trigger_log_deal_email_to_chat
            AFTER UPDATE OF delivery_status ON deal_emails
            FOR EACH ROW
            WHEN (NEW.delivery_status = 'sent' AND OLD.delivery_status != 'sent')
            EXECUTE FUNCTION log_deal_email_to_chat();
    END IF;
END $$;

-- ============================================================
-- UNIFIED ACTIVITY VIEW
-- ============================================================
CREATE OR REPLACE VIEW deal_activity_feed AS
-- Email activities
SELECT
    de.loan_id,
    de.id AS source_id,
    'email' AS activity_type,
    de.sent_by AS actor_id,
    'Sent email: "' || de.subject || '"' AS description,
    jsonb_build_object(
        'to', de.to_emails,
        'status', de.delivery_status,
        'opened', de.open_count > 0
    ) AS metadata,
    de.created_at
FROM deal_emails de
WHERE de.delivery_status != 'draft'

UNION ALL

-- Chat messages (non-system, non-deleted)
SELECT
    dcm.loan_id,
    dcm.id AS source_id,
    'chat_message' AS activity_type,
    dcm.sent_by AS actor_id,
    LEFT(dcm.content, 150) AS description,
    jsonb_build_object(
        'is_pinned', dcm.is_pinned,
        'has_attachments', jsonb_array_length(COALESCE(dcm.attachments, '[]'::jsonb)) > 0,
        'thread_replies', dcm.thread_reply_count
    ) AS metadata,
    dcm.created_at
FROM deal_chat_messages dcm
WHERE dcm.message_type = 'message'
AND dcm.is_deleted = false

UNION ALL

-- Existing loan activity log entries
SELECT
    al.loan_id,
    al.id AS source_id,
    COALESCE(al.action, 'activity') AS activity_type,
    al.performed_by AS actor_id,
    al.description,
    al.metadata::jsonb AS metadata,
    al.created_at
FROM loan_activity_log al;

-- ============================================================
-- BACKFILL: Create channels for existing loans
-- ============================================================
INSERT INTO deal_chat_channels (loan_id, channel_name, channel_type)
SELECT
    l.id,
    COALESCE(l.property_address, 'Loan ' || COALESCE(l.loan_number, l.id::text)) || ' — ' || COALESCE(l.type, 'Loan'),
    'deal'
FROM loans l
WHERE l.deleted_at IS NULL
AND NOT EXISTS (
    SELECT 1 FROM deal_chat_channels dcc WHERE dcc.loan_id = l.id
)
ON CONFLICT (loan_id) DO NOTHING;

-- Initialize read status for existing channels
INSERT INTO deal_chat_read_status (channel_id, user_id)
SELECT dcc.id, ur.user_id
FROM deal_chat_channels dcc
CROSS JOIN user_roles ur
WHERE ur.role IN ('admin', 'super_admin')
AND ur.is_active = true
ON CONFLICT (channel_id, user_id) DO NOTHING;
