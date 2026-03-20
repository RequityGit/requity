-- Fix: Update draw_requests status check constraint to include 'denied'
-- The frontend (loan-detail-actions.tsx) sends 'denied' when rejecting a draw request
-- but the existing constraint only allows 'rejected'. The loan_draws table already uses
-- 'denied', so we align draw_requests to be consistent.

-- Step 1: Drop the existing constraint
ALTER TABLE draw_requests DROP CONSTRAINT IF EXISTS draw_requests_status_check;

-- Step 2: Migrate any existing 'rejected' rows to 'denied' for consistency
UPDATE draw_requests SET status = 'denied' WHERE status = 'rejected';

-- Step 3: Re-create constraint with 'denied' instead of 'rejected'
ALTER TABLE draw_requests ADD CONSTRAINT draw_requests_status_check
  CHECK (status IN ('submitted', 'under_review', 'approved', 'funded', 'denied'));

NOTIFY pgrst, 'reload schema';
