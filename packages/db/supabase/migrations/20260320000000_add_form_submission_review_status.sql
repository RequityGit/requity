-- Add 'pending_review' status to form_submissions for submissions that need manual review
-- This allows form submissions that fail to create opportunities to be queued for review

-- Expand status CHECK constraint
ALTER TABLE form_submissions
  DROP CONSTRAINT IF EXISTS form_submissions_status_check;

ALTER TABLE form_submissions
  ADD CONSTRAINT form_submissions_status_check
  CHECK (status IN ('partial', 'pending_borrower', 'submitted', 'pending_review', 'reviewed', 'processed'));

-- Add internal_notes column if it doesn't exist (for storing review notes and errors)
ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Add index for pending_review status to make review queue queries fast
CREATE INDEX IF NOT EXISTS idx_form_submissions_pending_review 
  ON form_submissions(status, created_at DESC) 
  WHERE status = 'pending_review';
