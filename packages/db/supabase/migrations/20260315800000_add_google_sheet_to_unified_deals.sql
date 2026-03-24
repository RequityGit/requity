-- Link commercial underwriting / financial model to a Google Sheet per deal.
-- Phase 1: store sheet ID and optional URL for "Open in Sheets" and future sync.
ALTER TABLE unified_deals
  ADD COLUMN IF NOT EXISTS google_sheet_id text;

ALTER TABLE unified_deals
  ADD COLUMN IF NOT EXISTS google_sheet_url text;

COMMENT ON COLUMN unified_deals.google_sheet_id IS 'Google Spreadsheet ID for financial model / commercial UW (open in Sheets, future sync)';
COMMENT ON COLUMN unified_deals.google_sheet_url IS 'Full Google Sheet URL for display; derived from google_sheet_id if not set';
