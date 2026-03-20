-- Email-to-Deal Routing: schema additions for smart matching, merge safeguards,
-- and dual storage (Supabase + Google Drive).

-- Phase 1: Enhanced matching columns on intake_items
ALTER TABLE intake_items
  ADD COLUMN IF NOT EXISTS auto_matched_deal_id uuid REFERENCES unified_deals(id),
  ADD COLUMN IF NOT EXISTS match_confidence numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS match_details jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_intake_items_auto_matched_deal
  ON intake_items(auto_matched_deal_id)
  WHERE auto_matched_deal_id IS NOT NULL;

-- Phase 2: Link documents directly to deals (not just loans)
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES unified_deals(id),
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS google_drive_file_id text,
  ADD COLUMN IF NOT EXISTS google_drive_url text;

CREATE INDEX IF NOT EXISTS idx_documents_deal_id
  ON documents(deal_id)
  WHERE deal_id IS NOT NULL;

-- Phase 3: Google Drive folder per deal
ALTER TABLE unified_deals
  ADD COLUMN IF NOT EXISTS google_drive_folder_id text,
  ADD COLUMN IF NOT EXISTS google_drive_folder_url text;
