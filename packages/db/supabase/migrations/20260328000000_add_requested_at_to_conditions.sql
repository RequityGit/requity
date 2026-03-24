-- Add requested_at timestamp to track when a condition was marked as requested
ALTER TABLE unified_deal_conditions
ADD COLUMN IF NOT EXISTS requested_at timestamptz;

-- Backfill: set requested_at for any existing conditions with status 'requested'
UPDATE unified_deal_conditions
SET requested_at = updated_at
WHERE status = 'requested' AND requested_at IS NULL;
