-- Add missing version and status columns to deal_commercial_uw
ALTER TABLE deal_commercial_uw
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Backfill existing rows: set version=1, status='active'
UPDATE deal_commercial_uw
SET version = 1, status = 'active'
WHERE version = 1 AND status = 'draft';

-- Add index for the common query pattern: lookup by opportunity_id ordered by version
CREATE INDEX IF NOT EXISTS idx_deal_commercial_uw_opp_version
  ON deal_commercial_uw (opportunity_id, version DESC);
