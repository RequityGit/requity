-- ============================================================
-- DSCR PRICING ENGINE — CORE TABLES
-- ============================================================

-- Lender partners we broker DSCR loans through
CREATE TABLE dscr_lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  nmls_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  account_executive TEXT,
  ae_email TEXT,
  ae_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each lender can have multiple products/programs
CREATE TABLE dscr_lender_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES dscr_lenders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'dscr',
  lock_period_days INTEGER DEFAULT 45,
  floor_rate NUMERIC(6,4),
  min_rate NUMERIC(6,4),
  servicing TEXT DEFAULT 'released',
  max_price NUMERIC(8,4),
  min_price NUMERIC(8,4),
  max_ltv_purchase NUMERIC(5,2),
  max_ltv_rate_term NUMERIC(5,2),
  max_ltv_cashout NUMERIC(5,2),
  max_loan_amount NUMERIC(15,2),
  min_loan_amount NUMERIC(15,2),
  max_financed_points NUMERIC(4,2),
  funding_fee NUMERIC(10,2),
  underwriting_fee NUMERIC(10,2),
  processing_fee NUMERIC(10,2),
  desk_review_fee NUMERIC(10,2),
  entity_review_fee NUMERIC(10,2),
  other_fees JSONB DEFAULT '{}',
  state_restrictions JSONB DEFAULT '[]',
  state_license_required JSONB DEFAULT '[]',
  eligible_property_types JSONB DEFAULT '[]',
  eligible_borrower_types JSONB DEFAULT '[]',
  eligible_vesting JSONB DEFAULT '[]',
  rate_sheet_date DATE,
  rate_sheet_effective_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Base rate/price ladder for each product
CREATE TABLE dscr_base_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES dscr_lender_products(id) ON DELETE CASCADE,
  note_rate NUMERIC(6,4) NOT NULL,
  base_price NUMERIC(8,4) NOT NULL,
  UNIQUE(product_id, note_rate)
);

-- FICO x LTV adjustment grids (one per product per loan purpose)
CREATE TABLE dscr_fico_ltv_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES dscr_lender_products(id) ON DELETE CASCADE,
  loan_purpose TEXT NOT NULL,
  fico_min INTEGER NOT NULL,
  fico_max INTEGER,
  fico_label TEXT,
  ltv_min NUMERIC(5,2) NOT NULL,
  ltv_max NUMERIC(5,2) NOT NULL,
  ltv_label TEXT,
  adjustment NUMERIC(8,4),
  UNIQUE(product_id, loan_purpose, fico_min, ltv_min)
);

-- Loan-Level Price Adjustments (LLPAs) with fixed LTV band columns
CREATE TABLE dscr_price_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES dscr_lender_products(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  condition_label TEXT NOT NULL,
  condition_key TEXT NOT NULL,
  adj_ltv_0_50 NUMERIC(8,4),
  adj_ltv_50_55 NUMERIC(8,4),
  adj_ltv_55_60 NUMERIC(8,4),
  adj_ltv_60_65 NUMERIC(8,4),
  adj_ltv_65_70 NUMERIC(8,4),
  adj_ltv_70_75 NUMERIC(8,4),
  adj_ltv_75_80 NUMERIC(8,4),
  adj_ltv_80_85 NUMERIC(8,4),
  adj_ltv_85_90 NUMERIC(8,4),
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(product_id, category, condition_key)
);

-- Prepayment penalty restrictions by state
CREATE TABLE dscr_prepay_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES dscr_lender_products(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  restriction_type TEXT NOT NULL,
  max_ppp_tier TEXT,
  max_ppp_term_months INTEGER,
  requires_llc BOOLEAN DEFAULT FALSE,
  max_interest_rate NUMERIC(6,4),
  notes TEXT,
  UNIQUE(product_id, state_code)
);

-- Rate sheet upload history / audit trail
CREATE TABLE dscr_rate_sheet_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES dscr_lenders(id),
  product_id UUID REFERENCES dscr_lender_products(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  effective_date DATE,
  parsed_at TIMESTAMPTZ,
  parsed_by UUID REFERENCES auth.users(id),
  parsing_status TEXT DEFAULT 'pending',
  parsing_notes TEXT,
  raw_parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEAL / PRICING RESULTS TABLES
-- ============================================================

CREATE TABLE dscr_pricing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_by UUID REFERENCES auth.users(id),
  loan_id UUID,
  borrower_name TEXT,
  borrower_entity TEXT,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT NOT NULL,
  property_zip TEXT,
  property_type TEXT NOT NULL,
  property_value NUMERIC(15,2) NOT NULL,
  monthly_rent NUMERIC(10,2) NOT NULL,
  num_units INTEGER DEFAULT 1,
  loan_purpose TEXT NOT NULL,
  loan_amount NUMERIC(15,2) NOT NULL,
  fico_score INTEGER NOT NULL,
  borrower_type TEXT NOT NULL DEFAULT 'us_citizen',
  income_doc_type TEXT DEFAULT 'dscr_only',
  is_interest_only BOOLEAN DEFAULT FALSE,
  is_short_term_rental BOOLEAN DEFAULT FALSE,
  escrow_waiver BOOLEAN DEFAULT FALSE,
  prepay_preference TEXT,
  monthly_taxes NUMERIC(10,2),
  monthly_insurance NUMERIC(10,2),
  monthly_hoa NUMERIC(10,2) DEFAULT 0,
  monthly_flood NUMERIC(10,2) DEFAULT 0,
  lock_period_days INTEGER DEFAULT 45,
  broker_points NUMERIC(4,2) DEFAULT 2.00,
  ltv NUMERIC(5,2),
  results JSONB NOT NULL DEFAULT '{}',
  best_execution_lender TEXT,
  best_execution_rate NUMERIC(6,4),
  best_execution_price NUMERIC(8,4),
  status TEXT DEFAULT 'draft',
  quoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dscr_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_run_id UUID NOT NULL REFERENCES dscr_pricing_runs(id) ON DELETE CASCADE,
  loan_id UUID,
  borrower_name TEXT,
  borrower_email TEXT,
  selected_lender_product_id UUID REFERENCES dscr_lender_products(id),
  selected_rate NUMERIC(6,4),
  selected_price NUMERIC(8,4),
  broker_points NUMERIC(4,2),
  quote_pdf_path TEXT,
  status TEXT DEFAULT 'draft',
  expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_dscr_lender_products_lender ON dscr_lender_products(lender_id);
CREATE INDEX idx_dscr_lender_products_active ON dscr_lender_products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_dscr_base_rates_product ON dscr_base_rates(product_id);
CREATE INDEX idx_dscr_fico_ltv_product ON dscr_fico_ltv_adjustments(product_id, loan_purpose);
CREATE INDEX idx_dscr_price_adj_product ON dscr_price_adjustments(product_id, category);
CREATE INDEX idx_dscr_pricing_runs_user ON dscr_pricing_runs(run_by);
CREATE INDEX idx_dscr_pricing_runs_status ON dscr_pricing_runs(status);
CREATE INDEX idx_dscr_quotes_run ON dscr_quotes(pricing_run_id);

-- ROW LEVEL SECURITY
ALTER TABLE dscr_lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_lender_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_base_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_fico_ltv_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_price_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_prepay_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_rate_sheet_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_pricing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dscr_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dscr_lenders_read" ON dscr_lenders FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_lenders_write" ON dscr_lenders FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_products_read" ON dscr_lender_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_products_write" ON dscr_lender_products FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_base_rates_read" ON dscr_base_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_base_rates_write" ON dscr_base_rates FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_fico_ltv_read" ON dscr_fico_ltv_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_fico_ltv_write" ON dscr_fico_ltv_adjustments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_price_adj_read" ON dscr_price_adjustments FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_price_adj_write" ON dscr_price_adjustments FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_prepay_restrict_read" ON dscr_prepay_restrictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_prepay_restrict_write" ON dscr_prepay_restrictions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_uploads_read" ON dscr_rate_sheet_uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "dscr_uploads_write" ON dscr_rate_sheet_uploads FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "dscr_runs_read_own" ON dscr_pricing_runs FOR SELECT TO authenticated
  USING (run_by = (SELECT auth.uid()) OR is_admin());
CREATE POLICY "dscr_runs_insert" ON dscr_pricing_runs FOR INSERT TO authenticated
  WITH CHECK (run_by = (SELECT auth.uid()) OR is_admin());
CREATE POLICY "dscr_runs_update" ON dscr_pricing_runs FOR UPDATE TO authenticated
  USING (run_by = (SELECT auth.uid()) OR is_admin());
CREATE POLICY "dscr_quotes_read" ON dscr_quotes FOR SELECT TO authenticated
  USING (pricing_run_id IN (SELECT id FROM dscr_pricing_runs WHERE run_by = (SELECT auth.uid())) OR is_admin());
CREATE POLICY "dscr_quotes_write" ON dscr_quotes FOR INSERT TO authenticated
  WITH CHECK (pricing_run_id IN (SELECT id FROM dscr_pricing_runs WHERE run_by = (SELECT auth.uid())) OR is_admin());

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_dscr_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dscr_lenders_updated_at BEFORE UPDATE ON dscr_lenders
  FOR EACH ROW EXECUTE FUNCTION update_dscr_updated_at();
CREATE TRIGGER trg_dscr_products_updated_at BEFORE UPDATE ON dscr_lender_products
  FOR EACH ROW EXECUTE FUNCTION update_dscr_updated_at();
CREATE TRIGGER trg_dscr_pricing_runs_updated_at BEFORE UPDATE ON dscr_pricing_runs
  FOR EACH ROW EXECUTE FUNCTION update_dscr_updated_at();
