-- Fix: Add 'unified_deal' to the valid_entity_type CHECK constraint on approval_requests.
-- The underwriter approval workflow migration (20260404000000) added unified_deal support
-- (columns, routing rules) but missed updating this constraint, causing submit-for-approval
-- to fail with: "violates check constraint valid_entity_type".

ALTER TABLE approval_requests
  DROP CONSTRAINT valid_entity_type;

ALTER TABLE approval_requests
  ADD CONSTRAINT valid_entity_type
  CHECK (entity_type IN ('loan', 'draw_request', 'payoff', 'exception', 'investor_distribution', 'opportunity', 'unified_deal'));
