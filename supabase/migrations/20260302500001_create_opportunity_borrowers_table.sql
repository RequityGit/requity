-- Opportunity borrowers junction table
CREATE TABLE IF NOT EXISTS opportunity_borrowers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL REFERENCES borrowers(id),
  role text DEFAULT 'primary' CHECK (role IN ('primary','co_borrower','guarantor','key_principal')),
  sort_order integer DEFAULT 1,
  credit_score_at_intake integer,
  credit_report_date_at_intake date,
  stated_liquidity_at_intake numeric,
  verified_liquidity_at_intake numeric,
  stated_net_worth_at_intake numeric,
  verified_net_worth_at_intake numeric,
  notes text,
  UNIQUE (opportunity_id, borrower_id)
);

ALTER TABLE opportunity_borrowers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_opportunity_borrowers" ON opportunity_borrowers FOR ALL USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role IN ('admin', 'super_admin')));
CREATE INDEX idx_opp_borrowers_opportunity ON opportunity_borrowers(opportunity_id);
CREATE INDEX idx_opp_borrowers_borrower ON opportunity_borrowers(borrower_id);
