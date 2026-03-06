-- ============================================================================
-- Commercial Underwriting Module — Tables, Indexes, RLS
-- Applied via Supabase MCP on 2026-03-01
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. commercial_underwriting
CREATE TABLE commercial_underwriting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','rejected')),
  property_type TEXT NOT NULL,
  total_units_spaces INTEGER,
  total_sf NUMERIC,
  year_built INTEGER,
  operating_days_per_year INTEGER DEFAULT 365,
  current_lease_income NUMERIC DEFAULT 0,
  stabilized_lease_income NUMERIC DEFAULT 0,
  current_occupancy_revenue NUMERIC DEFAULT 0,
  stabilized_occupancy_revenue NUMERIC DEFAULT 0,
  current_ancillary_income NUMERIC DEFAULT 0,
  stabilized_ancillary_income NUMERIC DEFAULT 0,
  current_gpi NUMERIC GENERATED ALWAYS AS (
    GREATEST(COALESCE(current_lease_income,0), COALESCE(current_occupancy_revenue,0)) + COALESCE(current_ancillary_income,0)
  ) STORED,
  stabilized_gpi NUMERIC GENERATED ALWAYS AS (
    GREATEST(COALESCE(stabilized_lease_income,0), COALESCE(stabilized_occupancy_revenue,0)) + COALESCE(stabilized_ancillary_income,0)
  ) STORED,
  t12_gpi NUMERIC, t12_vacancy_pct NUMERIC, t12_bad_debt_pct NUMERIC,
  t12_mgmt_fee NUMERIC, t12_taxes NUMERIC, t12_insurance NUMERIC,
  t12_utilities NUMERIC, t12_repairs NUMERIC, t12_contract_services NUMERIC,
  t12_payroll NUMERIC, t12_marketing NUMERIC, t12_ga NUMERIC,
  t12_replacement_reserve NUMERIC,
  yr1_mgmt_fee_pct NUMERIC DEFAULT 8,
  yr1_taxes_override NUMERIC, yr1_insurance_override NUMERIC,
  yr1_utilities_override NUMERIC, yr1_repairs_override NUMERIC,
  yr1_contract_override NUMERIC, yr1_payroll_override NUMERIC,
  yr1_marketing_override NUMERIC, yr1_ga_override NUMERIC,
  yr1_reserve_override NUMERIC,
  rent_growth_yr1 NUMERIC DEFAULT 0, rent_growth_yr2 NUMERIC DEFAULT 3,
  rent_growth_yr3 NUMERIC DEFAULT 3, rent_growth_yr4 NUMERIC DEFAULT 3,
  rent_growth_yr5 NUMERIC DEFAULT 3,
  expense_growth_yr1 NUMERIC DEFAULT 0, expense_growth_yr2 NUMERIC DEFAULT 2,
  expense_growth_yr3 NUMERIC DEFAULT 2, expense_growth_yr4 NUMERIC DEFAULT 2,
  expense_growth_yr5 NUMERIC DEFAULT 2,
  vacancy_pct_yr1 NUMERIC DEFAULT 10, vacancy_pct_yr2 NUMERIC DEFAULT 8,
  vacancy_pct_yr3 NUMERIC DEFAULT 7, vacancy_pct_yr4 NUMERIC DEFAULT 5,
  vacancy_pct_yr5 NUMERIC DEFAULT 5,
  stabilized_vacancy_pct NUMERIC DEFAULT 5,
  bad_debt_pct NUMERIC DEFAULT 1,
  bridge_loan_amount NUMERIC, bridge_term_months INTEGER,
  bridge_rate NUMERIC, bridge_amortization_months INTEGER,
  bridge_io_months INTEGER DEFAULT 0, bridge_origination_pts NUMERIC,
  exit_loan_amount NUMERIC, exit_rate NUMERIC,
  exit_amortization_years INTEGER, exit_io_months INTEGER DEFAULT 0,
  exit_lender_name TEXT,
  purchase_price NUMERIC, going_in_cap_rate NUMERIC,
  exit_cap_rate NUMERIC, disposition_cost_pct NUMERIC DEFAULT 2,
  equity_invested NUMERIC,
  poh_rental_income NUMERIC, poh_expense_ratio NUMERIC DEFAULT 50,
  rent_roll_upload_id UUID, t12_upload_id UUID,
  CONSTRAINT unique_loan_uw UNIQUE(loan_id)
);

CREATE INDEX idx_comm_uw_loan ON commercial_underwriting(loan_id);
CREATE INDEX idx_comm_uw_status ON commercial_underwriting(status);
CREATE TRIGGER set_comm_uw_updated_at BEFORE UPDATE ON commercial_underwriting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. commercial_rent_roll
CREATE TABLE commercial_rent_roll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  underwriting_id UUID NOT NULL REFERENCES commercial_underwriting(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  unit_number TEXT, tenant_name TEXT, sf NUMERIC, beds_type TEXT, baths NUMERIC,
  lease_start DATE, lease_end DATE, lease_type TEXT DEFAULT 'Gross',
  current_monthly_rent NUMERIC DEFAULT 0, cam_nnn NUMERIC DEFAULT 0,
  other_income NUMERIC DEFAULT 0, poh_income NUMERIC DEFAULT 0,
  is_vacant BOOLEAN DEFAULT false,
  market_rent NUMERIC DEFAULT 0, market_cam_nnn NUMERIC DEFAULT 0,
  market_other NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_rent_roll_uw ON commercial_rent_roll(underwriting_id);

-- 3. commercial_occupancy_income
CREATE TABLE commercial_occupancy_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  underwriting_id UUID NOT NULL REFERENCES commercial_underwriting(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  space_type TEXT NOT NULL, count INTEGER DEFAULT 0,
  rate_per_night NUMERIC DEFAULT 0, occupancy_pct NUMERIC DEFAULT 0,
  operating_days INTEGER,
  target_rate NUMERIC DEFAULT 0, target_occupancy_pct NUMERIC DEFAULT 0,
  occupancy_pct_yr1 NUMERIC, occupancy_pct_yr2 NUMERIC,
  occupancy_pct_yr3 NUMERIC, occupancy_pct_yr4 NUMERIC,
  occupancy_pct_yr5 NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_occ_income_uw ON commercial_occupancy_income(underwriting_id);

-- 4. commercial_ancillary_income
CREATE TABLE commercial_ancillary_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  underwriting_id UUID NOT NULL REFERENCES commercial_underwriting(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  income_source TEXT NOT NULL,
  current_annual_amount NUMERIC DEFAULT 0,
  stabilized_annual_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_anc_income_uw ON commercial_ancillary_income(underwriting_id);

-- 5. commercial_proforma_years
CREATE TABLE commercial_proforma_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  underwriting_id UUID NOT NULL REFERENCES commercial_underwriting(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  gpi NUMERIC, vacancy NUMERIC, bad_debt NUMERIC, egi NUMERIC,
  mgmt_fee NUMERIC, taxes NUMERIC, insurance NUMERIC, utilities NUMERIC,
  repairs NUMERIC, contract_services NUMERIC, payroll NUMERIC,
  marketing NUMERIC, ga NUMERIC, replacement_reserve NUMERIC,
  total_opex NUMERIC, noi NUMERIC, debt_service NUMERIC,
  net_cash_flow NUMERIC, dscr NUMERIC, cap_rate NUMERIC,
  expense_ratio NUMERIC, price_per_unit NUMERIC, cumulative_cash_flow NUMERIC,
  CONSTRAINT unique_uw_year UNIQUE(underwriting_id, year)
);
CREATE INDEX idx_proforma_uw ON commercial_proforma_years(underwriting_id);

-- 6. commercial_expense_defaults
CREATE TABLE commercial_expense_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type TEXT NOT NULL, expense_category TEXT NOT NULL,
  per_unit_amount NUMERIC NOT NULL,
  basis TEXT NOT NULL CHECK (basis IN ('per_unit','per_sf','per_room','per_pad','per_site','per_slip')),
  range_low NUMERIC, range_high NUMERIC, notes TEXT,
  CONSTRAINT unique_type_category UNIQUE(property_type, expense_category)
);

-- 7. commercial_upload_mappings
CREATE TABLE commercial_upload_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  underwriting_id UUID NOT NULL REFERENCES commercial_underwriting(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('rent_roll','t12')),
  original_filename TEXT, column_mapping JSONB NOT NULL,
  row_count INTEGER, created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE commercial_underwriting ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_rent_roll ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_occupancy_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_ancillary_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_proforma_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_upload_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_expense_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON commercial_underwriting FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON commercial_rent_roll FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON commercial_occupancy_income FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON commercial_ancillary_income FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON commercial_proforma_years FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access" ON commercial_upload_mappings FOR ALL USING (is_admin());
CREATE POLICY "anyone_can_read" ON commercial_expense_defaults FOR SELECT USING (true);
CREATE POLICY "admin_can_write" ON commercial_expense_defaults FOR ALL USING (is_admin());
