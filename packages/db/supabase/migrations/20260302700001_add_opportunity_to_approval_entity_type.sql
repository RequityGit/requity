-- Fix: Add 'opportunity' to the valid_entity_type CHECK constraint on approval_requests.
-- Without this, inserts with entity_type = 'opportunity' are rejected by the database,
-- causing deal approvals to not appear in the operations approvals queue.

ALTER TABLE approval_requests
  DROP CONSTRAINT valid_entity_type;

ALTER TABLE approval_requests
  ADD CONSTRAINT valid_entity_type
  CHECK (entity_type IN ('loan', 'draw_request', 'payoff', 'exception', 'investor_distribution', 'opportunity'));
