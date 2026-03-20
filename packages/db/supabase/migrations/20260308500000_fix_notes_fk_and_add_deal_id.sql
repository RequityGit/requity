-- 1. Add deal_id column referencing unified_deals for pipeline-v2 deals
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES unified_deals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_notes_deal_id ON notes(deal_id) WHERE deal_id IS NOT NULL;

-- 2. Rename crm_chatter_posts_* FK constraints on notes table to notes_*
ALTER TABLE notes RENAME CONSTRAINT crm_chatter_posts_author_id_fkey TO notes_author_id_fkey;
ALTER TABLE notes RENAME CONSTRAINT crm_chatter_posts_company_id_fkey TO notes_company_id_fkey;
ALTER TABLE notes RENAME CONSTRAINT crm_chatter_posts_contact_id_fkey TO notes_contact_id_fkey;
ALTER TABLE notes RENAME CONSTRAINT crm_chatter_posts_loan_id_fkey TO notes_loan_id_fkey;
ALTER TABLE notes RENAME CONSTRAINT crm_chatter_posts_pinned_by_fkey TO notes_pinned_by_fkey;

-- 3. Rename crm_chatter_mentions FK on note_mentions table
ALTER TABLE note_mentions RENAME CONSTRAINT crm_chatter_mentions_mentioned_user_id_fkey TO note_mentions_mentioned_user_id_fkey;

-- 4. Remove notify_on_chatter column from crm_followers
ALTER TABLE crm_followers DROP COLUMN IF EXISTS notify_on_chatter;
