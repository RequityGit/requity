-- =============================================================================
-- Migration: Inbound Email Sync Schema
-- Extends crm_emails for Gmail inbound sync, adds gmail_sync_state and
-- email_participants tables.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend crm_emails with Gmail sync columns
-- ---------------------------------------------------------------------------

-- Gmail identifiers for dedup and threading
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS gmail_message_id text;
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS gmail_thread_id text;

-- Direction: inbound vs outbound
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'outbound';

-- Richer participant data for inbound emails
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS from_name text;
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS to_emails text[];
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS to_names text[];
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS reply_to text;

-- Sync metadata
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS synced_at timestamptz;
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS synced_by uuid REFERENCES auth.users(id);
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT true;
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS gmail_labels text[];

-- Additional entity linking
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS linked_fund_id uuid REFERENCES funds(id);

-- Contact match status
ALTER TABLE crm_emails ADD COLUMN IF NOT EXISTS match_status text DEFAULT 'auto';

-- Make from_email nullable for inbound emails (will be populated from headers)
ALTER TABLE crm_emails ALTER COLUMN from_email DROP NOT NULL;
ALTER TABLE crm_emails ALTER COLUMN from_email SET DEFAULT NULL;

-- Make to_email nullable (inbound emails use to_emails array instead)
ALTER TABLE crm_emails ALTER COLUMN to_email DROP NOT NULL;

-- Make subject nullable (edge case: some emails have no subject)
ALTER TABLE crm_emails ALTER COLUMN subject DROP NOT NULL;

-- Unique constraint on gmail_message_id for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_emails_gmail_message_id
  ON crm_emails(gmail_message_id) WHERE gmail_message_id IS NOT NULL;

-- Index for thread lookups
CREATE INDEX IF NOT EXISTS idx_crm_emails_gmail_thread_id
  ON crm_emails(gmail_thread_id) WHERE gmail_thread_id IS NOT NULL;

-- Index for direction filtering
CREATE INDEX IF NOT EXISTS idx_crm_emails_direction
  ON crm_emails(direction);

-- Index for synced_by (team member's mailbox)
CREATE INDEX IF NOT EXISTS idx_crm_emails_synced_by
  ON crm_emails(synced_by) WHERE synced_by IS NOT NULL;

-- Composite index for entity timeline queries
CREATE INDEX IF NOT EXISTS idx_crm_emails_linked_borrower_created
  ON crm_emails(linked_borrower_id, created_at DESC) WHERE linked_borrower_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_emails_linked_investor_created
  ON crm_emails(linked_investor_id, created_at DESC) WHERE linked_investor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_emails_linked_loan_created
  ON crm_emails(linked_loan_id, created_at DESC) WHERE linked_loan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_emails_linked_fund_created
  ON crm_emails(linked_fund_id, created_at DESC) WHERE linked_fund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_emails_linked_contact_created
  ON crm_emails(linked_contact_id, created_at DESC) WHERE linked_contact_id IS NOT NULL;

-- Check constraint on direction
ALTER TABLE crm_emails ADD CONSTRAINT crm_emails_direction_check
  CHECK (direction IN ('inbound', 'outbound'));

-- Check constraint on match_status
ALTER TABLE crm_emails ADD CONSTRAINT crm_emails_match_status_check
  CHECK (match_status IN ('auto', 'manual', 'unmatched'));


-- ---------------------------------------------------------------------------
-- 2. Create gmail_sync_state table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gmail_sync_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_email     text NOT NULL,
  history_id      bigint,
  last_full_sync_at  timestamptz,
  last_sync_at    timestamptz,
  sync_status     text NOT NULL DEFAULT 'idle',
  error_message   text,
  messages_synced integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gmail_sync_state_status_check
    CHECK (sync_status IN ('idle', 'syncing', 'error'))
);

-- Index for finding users that need syncing
CREATE INDEX IF NOT EXISTS idx_gmail_sync_state_status
  ON gmail_sync_state(sync_status, last_sync_at);

-- RLS
ALTER TABLE gmail_sync_state ENABLE ROW LEVEL SECURITY;

-- Super admins can see all sync states
CREATE POLICY "Super admins can manage all gmail_sync_state"
  ON gmail_sync_state FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admins can view sync states (for monitoring)
CREATE POLICY "Admins can view gmail_sync_state"
  ON gmail_sync_state FOR SELECT
  USING (is_admin());

-- Users can view and update their own sync state
CREATE POLICY "Users can view own gmail_sync_state"
  ON gmail_sync_state FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own gmail_sync_state"
  ON gmail_sync_state FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));


-- ---------------------------------------------------------------------------
-- 3. Create email_participants table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_participants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id        uuid NOT NULL REFERENCES crm_emails(id) ON DELETE CASCADE,
  email_address   text NOT NULL,
  display_name    text,
  participant_role text NOT NULL,
  -- Matched entity references (null if unmatched)
  contact_id      uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  borrower_id     uuid REFERENCES borrowers(id) ON DELETE SET NULL,
  investor_id     uuid REFERENCES investors(id) ON DELETE SET NULL,
  profile_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_participants_role_check
    CHECK (participant_role IN ('from', 'to', 'cc', 'bcc'))
);

-- Prevent duplicate participants per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_participants_unique
  ON email_participants(email_id, email_address, participant_role);

-- Index for "find all emails for a contact"
CREATE INDEX IF NOT EXISTS idx_email_participants_contact
  ON email_participants(contact_id) WHERE contact_id IS NOT NULL;

-- Index for "find all emails for a borrower"
CREATE INDEX IF NOT EXISTS idx_email_participants_borrower
  ON email_participants(borrower_id) WHERE borrower_id IS NOT NULL;

-- Index for "find all emails for an investor"
CREATE INDEX IF NOT EXISTS idx_email_participants_investor
  ON email_participants(investor_id) WHERE investor_id IS NOT NULL;

-- Index for "find all emails involving a team member"
CREATE INDEX IF NOT EXISTS idx_email_participants_profile
  ON email_participants(profile_id) WHERE profile_id IS NOT NULL;

-- Index for looking up participants by email address (for contact matching)
CREATE INDEX IF NOT EXISTS idx_email_participants_email_address
  ON email_participants(email_address);

-- Index for joining back to emails
CREATE INDEX IF NOT EXISTS idx_email_participants_email_id
  ON email_participants(email_id);

-- RLS
ALTER TABLE email_participants ENABLE ROW LEVEL SECURITY;

-- Super admins see all participants
CREATE POLICY "Super admins can manage all email_participants"
  ON email_participants FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admins can view participants on emails they have access to
CREATE POLICY "Admins can view email_participants"
  ON email_participants FOR SELECT
  USING (is_admin());

-- Admins can insert participants (needed by sync process)
CREATE POLICY "Admins can insert email_participants"
  ON email_participants FOR INSERT
  WITH CHECK (is_admin());

-- Team members can see participants where they are the profile
CREATE POLICY "Users can view own email_participants"
  ON email_participants FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

-- Borrowers can see participants on emails linked to their borrower
CREATE POLICY "Borrowers can view own email_participants"
  ON email_participants FOR SELECT
  USING (
    borrower_id IN (SELECT my_borrower_ids())
  );

-- Investors can see participants on emails linked to their investor
CREATE POLICY "Investors can view own email_participants"
  ON email_participants FOR SELECT
  USING (
    investor_id IN (SELECT my_investor_ids())
  );


-- ---------------------------------------------------------------------------
-- 4. Update crm_emails RLS for role-based inbound email access
-- ---------------------------------------------------------------------------

-- Drop the overly permissive existing policies
DROP POLICY IF EXISTS "Authenticated users can view all crm_emails" ON crm_emails;
DROP POLICY IF EXISTS "Authenticated users can insert crm_emails" ON crm_emails;
DROP POLICY IF EXISTS "Authenticated users can update crm_emails" ON crm_emails;

-- Super admins: full access to all emails
CREATE POLICY "Super admins can manage all crm_emails"
  ON crm_emails FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Admins: can insert and update (needed for sync and compose)
CREATE POLICY "Admins can insert crm_emails"
  ON crm_emails FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update crm_emails"
  ON crm_emails FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins: can view emails they sent or synced from their own mailbox
CREATE POLICY "Admins can view own crm_emails"
  ON crm_emails FOR SELECT
  USING (
    is_admin() AND (
      sent_by = (SELECT auth.uid())
      OR synced_by = (SELECT auth.uid())
    )
  );

-- Borrowers: can view emails linked to their borrower record
CREATE POLICY "Borrowers can view linked crm_emails"
  ON crm_emails FOR SELECT
  USING (
    linked_borrower_id IN (SELECT my_borrower_ids())
  );

-- Investors: can view emails linked to their investor record
CREATE POLICY "Investors can view linked crm_emails"
  ON crm_emails FOR SELECT
  USING (
    linked_investor_id IN (SELECT my_investor_ids())
  );


-- ---------------------------------------------------------------------------
-- 5. Helper function: lookup contacts by email address
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION match_email_to_entities(lookup_email text)
RETURNS TABLE (
  source_type text,
  source_id uuid,
  contact_id uuid,
  borrower_id uuid,
  investor_id uuid,
  profile_id uuid,
  linked_loan_id uuid
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY

  -- Match against profiles (team members)
  SELECT
    'profile'::text AS source_type,
    p.id AS source_id,
    NULL::uuid AS contact_id,
    NULL::uuid AS borrower_id,
    NULL::uuid AS investor_id,
    p.id AS profile_id,
    NULL::uuid AS linked_loan_id
  FROM profiles p
  WHERE lower(p.email) = lower(lookup_email)

  UNION ALL

  -- Match against crm_contacts
  SELECT
    'contact'::text,
    c.id,
    c.id,
    c.borrower_id,
    c.linked_investor_id,
    c.user_id,  -- profile_id if contact has a user account
    c.linked_loan_id
  FROM crm_contacts c
  WHERE lower(c.email) = lower(lookup_email)
    AND c.deleted_at IS NULL

  UNION ALL

  -- Match against borrowers
  SELECT
    'borrower'::text,
    b.id,
    NULL::uuid,
    b.id,
    NULL::uuid,
    b.user_id,
    NULL::uuid
  FROM borrowers b
  WHERE lower(b.email) = lower(lookup_email)

  UNION ALL

  -- Match against investors
  SELECT
    'investor'::text,
    i.id,
    NULL::uuid,
    NULL::uuid,
    i.id,
    i.user_id,
    NULL::uuid
  FROM investors i
  WHERE lower(i.email) = lower(lookup_email);
END;
$$;
