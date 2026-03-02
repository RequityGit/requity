-- =============================================================================
-- Approval Workflow System
-- Creates: approval_requests, approval_routing_rules, approval_audit_log,
--          approval_checklists tables with indexes and RLS policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. approval_requests — core approvals table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- What is being approved
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,

  -- Who submitted and who decides
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID NOT NULL REFERENCES auth.users(id),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',

  -- SLA
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,

  -- Decision details
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,

  -- Snapshot of the deal at time of submission (JSONB)
  deal_snapshot JSONB NOT NULL DEFAULT '{}',

  -- Submission context
  submission_notes TEXT,
  checklist_results JSONB DEFAULT '{}',

  -- Linking to task system
  task_id UUID REFERENCES ops_tasks(id),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'changes_requested', 'declined', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('loan', 'draw_request', 'payoff', 'exception', 'investor_distribution'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_approval_requests_assigned ON approval_requests(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status, sla_deadline);
CREATE INDEX IF NOT EXISTS idx_approval_requests_submitted ON approval_requests(submitted_by, created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_approval_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_requests_updated_at();

-- ---------------------------------------------------------------------------
-- 2. approval_routing_rules — configurable routing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,

  -- Rule definition
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  priority_order INT NOT NULL DEFAULT 0,

  -- Conditions (all must match for rule to trigger)
  conditions JSONB NOT NULL DEFAULT '{}',

  -- Routing
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  fallback_approver_id UUID REFERENCES auth.users(id),

  -- SLA config
  sla_hours INT NOT NULL DEFAULT 24,
  auto_priority TEXT DEFAULT 'normal'
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_active ON approval_routing_rules(is_active, entity_type, priority_order);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_approval_routing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_approval_routing_rules_updated_at
  BEFORE UPDATE ON approval_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_routing_rules_updated_at();

-- ---------------------------------------------------------------------------
-- 3. approval_audit_log — immutable audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  approval_id UUID NOT NULL REFERENCES approval_requests(id),
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  deal_snapshot JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_log_approval ON approval_audit_log(approval_id, created_at);

-- ---------------------------------------------------------------------------
-- 4. approval_checklists — validation before submission
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS approval_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,

  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'
);

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_checklists ENABLE ROW LEVEL SECURITY;

-- approval_requests policies
CREATE POLICY "Users view own approvals" ON approval_requests
  FOR SELECT USING (
    (select auth.uid()) = submitted_by OR
    (select auth.uid()) = assigned_to OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Approvers can update" ON approval_requests
  FOR UPDATE USING (
    (select auth.uid()) = assigned_to OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Authenticated users can submit" ON approval_requests
  FOR INSERT WITH CHECK (
    (select auth.uid()) = submitted_by
  );

-- approval_audit_log policies
CREATE POLICY "View audit log" ON approval_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM approval_requests ar
      WHERE ar.id = approval_audit_log.approval_id
      AND (ar.submitted_by = (select auth.uid()) OR ar.assigned_to = (select auth.uid()))
    ) OR
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin'))
  );

CREATE POLICY "Authenticated users can insert audit log" ON approval_audit_log
  FOR INSERT WITH CHECK (
    (select auth.uid()) = performed_by
  );

-- approval_routing_rules policies (admin only)
CREATE POLICY "Admin manage routing rules" ON approval_routing_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin'))
  );

-- approval_checklists policies (admin only)
CREATE POLICY "Admin manage checklists" ON approval_checklists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role IN ('super_admin', 'admin'))
  );

-- ---------------------------------------------------------------------------
-- 6. Seed: Default Loan Submission Checklist
-- ---------------------------------------------------------------------------
INSERT INTO approval_checklists (entity_type, name, items) VALUES
('loan', 'Loan Submission Checklist', '[
  {"field": "loan_amount", "rule": "required", "label": "Loan Amount"},
  {"field": "type", "rule": "required", "label": "Loan Type"},
  {"field": "property_type", "rule": "required", "label": "Property Type"},
  {"field": "property_address", "rule": "required", "label": "Property Address"},
  {"field": "property_city", "rule": "required", "label": "Property City"},
  {"field": "property_state", "rule": "required", "label": "Property State"},
  {"field": "borrower_id", "rule": "required", "label": "Borrower"},
  {"field": "interest_rate", "rule": "required", "label": "Interest Rate"},
  {"field": "loan_term_months", "rule": "required", "label": "Loan Term"}
]'),
('draw_request', 'Draw Request Checklist', '[
  {"field": "amount_requested", "rule": "required", "label": "Amount Requested"},
  {"field": "description", "rule": "required", "label": "Description"}
]');
