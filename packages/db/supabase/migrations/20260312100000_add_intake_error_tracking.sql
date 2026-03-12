-- Add error tracking columns to email_intake_queue for observability.
-- error_message: stores the last processing error for debugging
-- processing_attempts: retry counter, capped at 3 to prevent infinite loops

ALTER TABLE email_intake_queue ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE email_intake_queue ADD COLUMN IF NOT EXISTS processing_attempts INTEGER NOT NULL DEFAULT 0;
