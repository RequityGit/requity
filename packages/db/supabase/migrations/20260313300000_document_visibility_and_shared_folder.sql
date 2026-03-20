-- Add visibility (internal/external) to deal documents
ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'external'));

-- Track Google Drive file ID for synced documents
ALTER TABLE unified_deal_documents
  ADD COLUMN IF NOT EXISTS google_drive_file_id text;

-- Store the "Shared" subfolder ID per deal
ALTER TABLE unified_deals
  ADD COLUMN IF NOT EXISTS google_drive_shared_folder_id text;
