-- Create the opportunities table (THE DEAL)
-- Migration applied via Supabase MCP
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  stage text NOT NULL DEFAULT 'awaiting_info' CHECK (stage IN ('awaiting_info','uw','quoting','offer_placed','processing','closed','onboarding','closed_lost')),
  stage_changed_at timestamptz DEFAULT now(),
  stage_changed_by uuid REFERENCES auth.users(id),
  loss_reason text CHECK (loss_reason IS NULL OR loss_reason IN ('unqualified','pricing_lost_to_competitor','non_responsive_borrower','business_plan_change','ice')),
  property_id uuid REFERENCES properties(id),
  borrower_entity_id uuid REFERENCES borrower_entities(id),
  loan_id uuid REFERENCES loans(id),
  deal_name text,
  loan_type text CHECK (loan_type IS NULL OR loan_type IN ('commercial','dscr','guc','rtl','transactional')),
  loan_purpose text CHECK (loan_purpose IS NULL OR loan_purpose IN ('purchase','refinance','cash_out_refinance','guc','transactional')),
  funding_channel text CHECK (funding_channel IS NULL OR funding_channel IN ('balance_sheet','brokered','correspondent')),
  deal_programs text[],
  debt_tranche text CHECK (debt_tranche IS NULL OR debt_tranche IN ('mezzanine','senior_financing','preferred_equity')),
  investment_strategy text CHECK (investment_strategy IS NULL OR investment_strategy IN ('core','core_plus','value_add','opportunistic','distressed','debt','fund_of_funds','secondaries')),
  deal_financing text CHECK (deal_financing IS NULL OR deal_financing IN ('all_cash','financed_by_buyer','financed_by_competitor','debt_assumed','financed_by_requity')),
  loan_type_interest text[],
  proposed_loan_amount numeric,
  proposed_interest_rate numeric,
  proposed_loan_term_months integer,
  proposed_ltv numeric,
  proposed_ltarv numeric,
  value_method text CHECK (value_method IS NULL OR value_method IN ('underwritten_arv','borrower_arv','appraisal_1_arv','appraisal_2_arv')),
  occupancy_pct numeric,
  lease_type text CHECK (lease_type IS NULL OR lease_type IN ('nnn','nn','gross')),
  rental_status text CHECK (rental_status IS NULL OR rental_status IN ('owner_occupied','non_owner_occupied','partially_owner_occupied','vacant','partially_vacant')),
  secondary_liens boolean,
  cash_to_close numeric,
  source_of_funds text,
  combined_liquidity numeric DEFAULT 0,
  combined_net_worth numeric DEFAULT 0,
  capital_partner text,
  funding_source text,
  approval_status text DEFAULT 'not_required' CHECK (approval_status IN ('not_required','pending','approved','denied','auto_approved','auto_flagged')),
  approval_requested_at timestamptz,
  approval_requested_by uuid REFERENCES auth.users(id),
  approval_decided_at timestamptz,
  approval_decided_by uuid REFERENCES auth.users(id),
  approval_notes text,
  approval_type text CHECK (approval_type IS NULL OR approval_type IN ('manual','auto_offer','auto_stage')),
  prepayment_penalty_type text CHECK (prepayment_penalty_type IS NULL OR prepayment_penalty_type IN ('none','flat','step_down','yield_maintenance','defeasance')),
  prepayment_penalty_pct numeric,
  prepayment_penalty_months integer,
  prepayment_terms text,
  originator uuid REFERENCES auth.users(id),
  processor uuid REFERENCES auth.users(id),
  assigned_underwriter uuid REFERENCES auth.users(id),
  internal_notes text
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_opportunities" ON opportunities FOR ALL USING (EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = (SELECT auth.uid()) AND ur.role IN ('admin', 'super_admin')));
CREATE TRIGGER set_updated_at_opportunities BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_property ON opportunities(property_id);
CREATE INDEX idx_opportunities_entity ON opportunities(borrower_entity_id);
CREATE INDEX idx_opportunities_loan ON opportunities(loan_id);
CREATE INDEX idx_opportunities_originator ON opportunities(originator);

-- Add opportunity_id to loans
ALTER TABLE loans ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES opportunities(id);
CREATE INDEX IF NOT EXISTS idx_loans_opportunity ON loans(opportunity_id);
