-- Expand intake_items status CHECK to include 'auto_matched' and 'merged'
-- Needed by process-intake-email (sets 'auto_matched' for high-confidence matches)
-- and resolveIntakeItemAction (sets 'merged' when attaching to existing deal).
ALTER TABLE intake_items DROP CONSTRAINT intake_items_status_check;
ALTER TABLE intake_items ADD CONSTRAINT intake_items_status_check
  CHECK (status IN ('pending', 'auto_matched', 'processed', 'merged', 'dismissed'));
