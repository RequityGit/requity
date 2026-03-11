-- ============================================================
-- COMMERCIAL DEAL UNDERWRITING SCHEMA
-- ============================================================

-- Main underwriting record per deal version
CREATE TABLE IF NOT EXISTS deal_commercial_uw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Property Details
  property_name TEXT,
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_type TEXT,
  num_units INT,
  total_sf NUMERIC,
  year_built INT,
  lot_size_acres NUMERIC,
  zoning TEXT,

  -- Acquisition
  purchase_price NUMERIC,
  closing_costs NUMERIC,
  capex_reserve NUMERIC,
  working_capital NUMERIC,

  -- Loan Details
  lender_name TEXT,
  loan_amount NUMERIC,
  interest_rate NUMERIC,
  amortization_years INT,
  loan_term_years INT,
  io_period_months INT DEFAULT 0,
  loan_type TEXT CHECK (loan_type IN ('fixed', 'variable', 'bridge')),
  origination_fee_pct NUMERIC,
  prepay_type TEXT,
  prepay_schedule TEXT,

  -- Growth & Exit Assumptions
  exit_cap_rate NUMERIC,
  hold_period_years INT DEFAULT 5,
  sale_costs_pct NUMERIC DEFAULT 0.02,
  disposition_fee_pct NUMERIC DEFAULT 0.01,

  UNIQUE(opportunity_id, version)
);

-- T12 Income line items
CREATE TABLE IF NOT EXISTS deal_commercial_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  line_item TEXT NOT NULL,
  t12_amount NUMERIC DEFAULT 0,
  year_1_amount NUMERIC DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  is_deduction BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- T12 Expense line items
CREATE TABLE IF NOT EXISTS deal_commercial_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  t12_amount NUMERIC DEFAULT 0,
  year_1_amount NUMERIC DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  is_percentage BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rent roll (unit-level)
CREATE TABLE IF NOT EXISTS deal_commercial_rent_roll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  bedrooms INT,
  bathrooms NUMERIC,
  sq_ft NUMERIC,
  current_rent NUMERIC DEFAULT 0,
  market_rent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'occupied' CHECK (status IN ('occupied', 'vacant', 'down', 'model')),
  lease_start DATE,
  lease_end DATE,
  tenant_name TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scope of work / rehab budget
CREATE TABLE IF NOT EXISTS deal_commercial_scope_of_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sources & Uses
CREATE TABLE IF NOT EXISTS deal_commercial_sources_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('source', 'use')),
  line_item TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Debt tranches
CREATE TABLE IF NOT EXISTS deal_commercial_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  tranche_name TEXT DEFAULT 'Senior Debt',
  lender_name TEXT,
  loan_amount NUMERIC,
  interest_rate NUMERIC,
  amortization_years INT,
  term_years INT,
  io_period_months INT DEFAULT 0,
  loan_type TEXT CHECK (loan_type IN ('fixed', 'variable', 'bridge')),
  origination_fee_pct NUMERIC,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Distribution waterfall tiers
CREATE TABLE IF NOT EXISTS deal_commercial_waterfall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uw_id UUID NOT NULL REFERENCES deal_commercial_uw(id) ON DELETE CASCADE,
  tier_order INT NOT NULL,
  tier_name TEXT NOT NULL,
  hurdle_rate NUMERIC,
  sponsor_split NUMERIC,
  investor_split NUMERIC,
  is_catch_up BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add model_type to opportunities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'model_type_enum') THEN
    CREATE TYPE model_type_enum AS ENUM ('residential', 'commercial');
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS model_type TEXT,
  ADD COLUMN IF NOT EXISTS primary_residential_model TEXT CHECK (primary_residential_model IN ('rtl', 'dscr'));

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE deal_commercial_uw ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_rent_roll ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_scope_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_sources_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_commercial_waterfall ENABLE ROW LEVEL SECURITY;

-- Admin full access (mirrors opportunities RLS pattern)
CREATE POLICY "admin_full_access" ON deal_commercial_uw FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_income FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_expenses FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_rent_roll FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_scope_of_work FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_sources_uses FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_debt FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON deal_commercial_waterfall FOR ALL USING (is_admin());

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deal_commercial_uw_opportunity ON deal_commercial_uw(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_income_uw ON deal_commercial_income(uw_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_expenses_uw ON deal_commercial_expenses(uw_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_rent_roll_uw ON deal_commercial_rent_roll(uw_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_scope_uw ON deal_commercial_scope_of_work(uw_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_su_uw ON deal_commercial_sources_uses(uw_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_debt_uw ON deal_commercial_debt(uw_id);
CREATE INDEX IF NOT EXISTS idx_deal_commercial_waterfall_uw ON deal_commercial_waterfall(uw_id);
