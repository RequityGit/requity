-- Underwriter Approval Workflow
-- Adds approval gating between Analysis and Negotiation stages on unified_deals.
-- Reuses the existing approval_requests infrastructure.

-- 1. Add approval columns to unified_deals
ALTER TABLE unified_deals
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approval_requested_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS approval_requested_by uuid DEFAULT NULL REFERENCES auth.users(id);

-- 2. Add a check constraint for valid approval_status values
ALTER TABLE unified_deals
  ADD CONSTRAINT unified_deals_approval_status_check
  CHECK (approval_status IS NULL OR approval_status IN ('pending', 'approved', 'changes_requested', 'declined'));

-- 3. Index for fast kanban queries filtering by approval_status
CREATE INDEX IF NOT EXISTS idx_unified_deals_approval_status
  ON unified_deals (approval_status)
  WHERE approval_status IS NOT NULL;

-- 4. Insert default routing rule for unified_deal approvals (routes to first super_admin)
INSERT INTO approval_routing_rules (
  is_active, name, entity_type, priority_order, conditions,
  approver_id, sla_hours, auto_priority
)
SELECT
  true,
  'Default UW Approval - Super Admin',
  'unified_deal',
  1,
  '{}'::jsonb,
  ur.user_id,
  24,
  'normal'
FROM user_roles ur
WHERE ur.role = 'super_admin' AND ur.is_active = true
ORDER BY ur.created_at ASC
LIMIT 1
ON CONFLICT DO NOTHING;
