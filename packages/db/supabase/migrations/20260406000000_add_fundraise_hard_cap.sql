-- Add fundraise_hard_cap column to unified_deals
-- When total active commitments reach this amount, the public form shows a "fully committed" banner
-- and new submissions are marked as waitlist entries.

ALTER TABLE unified_deals
ADD COLUMN IF NOT EXISTS fundraise_hard_cap numeric;

COMMENT ON COLUMN unified_deals.fundraise_hard_cap IS
  'When total active commitments reach this amount, the deal shows as fully committed and new submissions go to the waitlist.';
