-- ============================================================================
-- Unify Underwriting Architecture
-- Brings commercial, DSCR, GUC, and equity UW under a single versioned
-- scenario framework alongside the existing RTL architecture.
-- ============================================================================

-- ============================================================================
-- 1A. Add opportunity_id and equity_deal_id to commercial_underwriting
-- ============================================================================

ALTER TABLE commercial_underwriting
  ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES opportunities(id),
  ADD COLUMN IF NOT EXISTS equity_deal_id uuid REFERENCES equity_deals(id);

-- Make loan_id nullable (commercial UW may exist before loan record)
ALTER TABLE commercial_underwriting
  ALTER COLUMN loan_id DROP NOT NULL;

-- Drop the unique constraint on loan_id so we can have multiple versions per loan
ALTER TABLE commercial_underwriting
  DROP CONSTRAINT IF EXISTS unique_loan_uw;

-- ============================================================================
-- 1B. Add version history columns to commercial_underwriting
-- ============================================================================

ALTER TABLE commercial_underwriting
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scenario_id uuid REFERENCES model_scenarios(id),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Must have at least one parent link (after scenario_id column exists)
DO $$ BEGIN
  ALTER TABLE commercial_underwriting
    ADD CONSTRAINT commercial_uw_parent_check
    CHECK (loan_id IS NOT NULL OR opportunity_id IS NOT NULL OR equity_deal_id IS NOT NULL OR scenario_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_commercial_uw_opportunity
  ON commercial_underwriting(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commercial_uw_equity_deal
  ON commercial_underwriting(equity_deal_id) WHERE equity_deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commercial_uw_scenario
  ON commercial_underwriting(scenario_id) WHERE scenario_id IS NOT NULL;

-- ============================================================================
-- 1C. Create dscr_underwriting table
-- ============================================================================

CREATE TABLE IF NOT EXISTS dscr_underwriting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent linkage (debt opportunities only)
  opportunity_id uuid REFERENCES opportunities(id),
  loan_id uuid REFERENCES loans(id),

  -- Versioning
  scenario_id uuid REFERENCES model_scenarios(id),
  version_number integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  label text,

  -- Must have at least one parent OR scenario
  CONSTRAINT dscr_uw_parent_check CHECK (
    loan_id IS NOT NULL OR opportunity_id IS NOT NULL OR scenario_id IS NOT NULL
  ),

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','final')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- === Property ===
  property_type text,
  property_value numeric,
  monthly_rent numeric,
  num_units integer DEFAULT 1,
  is_short_term_rental boolean DEFAULT false,

  -- === Borrower ===
  fico_score integer,
  borrower_type text DEFAULT 'us_citizen',
  income_doc_type text DEFAULT 'dscr_only',

  -- === Loan Terms ===
  loan_amount numeric,
  loan_purpose text,
  interest_rate numeric,
  loan_term_months integer DEFAULT 360,
  is_interest_only boolean DEFAULT false,
  io_period_months integer,
  amortization_months integer DEFAULT 360,
  prepayment_type text,
  lock_period_days integer DEFAULT 45,

  -- === Monthly Expenses (PITIA) ===
  monthly_taxes numeric,
  monthly_insurance numeric,
  monthly_hoa numeric DEFAULT 0,
  monthly_flood numeric DEFAULT 0,

  -- === Calculated Fields ===
  ltv numeric,
  dscr_ratio numeric,
  monthly_pi numeric,
  monthly_pitia numeric,
  debt_yield numeric,
  cash_on_cash numeric,

  -- === Pricing Link ===
  pricing_run_id uuid REFERENCES dscr_pricing_runs(id),
  selected_lender text,
  selected_rate numeric,
  selected_price numeric,
  broker_comp numeric DEFAULT 2.00,

  -- === Notes / Overrides ===
  notes text,
  assumptions_json jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_dscr_uw_opportunity
  ON dscr_underwriting(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dscr_uw_loan
  ON dscr_underwriting(loan_id) WHERE loan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dscr_uw_scenario
  ON dscr_underwriting(scenario_id) WHERE scenario_id IS NOT NULL;

ALTER TABLE dscr_underwriting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on dscr_underwriting"
  ON dscr_underwriting FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER set_dscr_uw_updated_at
  BEFORE UPDATE ON dscr_underwriting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 1D. Add opportunity_id to dscr_pricing_runs
-- ============================================================================

ALTER TABLE dscr_pricing_runs
  ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES opportunities(id);

CREATE INDEX IF NOT EXISTS idx_dscr_pricing_opportunity
  ON dscr_pricing_runs(opportunity_id) WHERE opportunity_id IS NOT NULL;

-- ============================================================================
-- 1E. Add version history to equity_underwriting
-- ============================================================================

ALTER TABLE equity_underwriting
  ADD COLUMN IF NOT EXISTS scenario_id uuid REFERENCES model_scenarios(id),
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- Drop the unique constraint on deal_id so we can have multiple versions
DROP INDEX IF EXISTS equity_underwriting_deal_id_unique;

CREATE INDEX IF NOT EXISTS idx_equity_uw_scenario
  ON equity_underwriting(scenario_id) WHERE scenario_id IS NOT NULL;

-- ============================================================================
-- 1F. Add equity_deal_id to model_scenarios + expand model_type check
-- ============================================================================

ALTER TABLE model_scenarios
  ADD COLUMN IF NOT EXISTS equity_deal_id uuid REFERENCES equity_deals(id);

CREATE INDEX IF NOT EXISTS idx_model_scenarios_equity
  ON model_scenarios(equity_deal_id) WHERE equity_deal_id IS NOT NULL;

-- Expand model_type check to include guc and equity
ALTER TABLE model_scenarios DROP CONSTRAINT IF EXISTS model_scenarios_model_type_check;
ALTER TABLE model_scenarios
  ADD CONSTRAINT model_scenarios_model_type_check
  CHECK (model_type IN ('commercial', 'rtl', 'dscr', 'guc', 'equity'));

-- ============================================================================
-- 1G. Create guc_underwriting table
-- ============================================================================

CREATE TABLE IF NOT EXISTS guc_underwriting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent linkage (debt opportunities only)
  opportunity_id uuid REFERENCES opportunities(id),
  loan_id uuid REFERENCES loans(id),

  -- Versioning
  scenario_id uuid REFERENCES model_scenarios(id),
  version_number integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  label text,

  CONSTRAINT guc_uw_parent_check CHECK (
    loan_id IS NOT NULL OR opportunity_id IS NOT NULL OR scenario_id IS NOT NULL
  ),

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','final')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- === Land / Acquisition ===
  land_cost numeric,
  land_acquisition_date date,
  lot_size_acres numeric,
  zoning text,

  -- === Construction Budget ===
  hard_costs numeric,
  soft_costs numeric,
  contingency_pct numeric DEFAULT 10,
  total_project_cost numeric,
  construction_timeline_months integer,

  -- === Construction Loan ===
  construction_loan_amount numeric,
  construction_ltc numeric,
  construction_rate numeric,
  construction_term_months integer,
  construction_io boolean DEFAULT true,
  origination_fee_pct numeric,
  draw_schedule_json jsonb DEFAULT '[]'::jsonb,

  -- === Stabilized / Exit ===
  stabilized_value numeric,
  stabilized_noi numeric,
  exit_strategy text,
  exit_cap_rate numeric,
  exit_loan_amount numeric,
  exit_rate numeric,
  exit_term_months integer,

  -- === Returns ===
  total_equity_required numeric,
  projected_irr numeric,
  equity_multiple numeric,
  profit_on_cost numeric,
  yield_on_cost numeric,
  dscr_at_stabilization numeric,

  -- === Notes ===
  notes text,
  assumptions_json jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_guc_uw_opportunity
  ON guc_underwriting(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guc_uw_loan
  ON guc_underwriting(loan_id) WHERE loan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guc_uw_scenario
  ON guc_underwriting(scenario_id) WHERE scenario_id IS NOT NULL;

ALTER TABLE guc_underwriting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on guc_underwriting"
  ON guc_underwriting FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER set_guc_uw_updated_at
  BEFORE UPDATE ON guc_underwriting
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 1I. Create underwriting_summary unified view
-- ============================================================================

CREATE OR REPLACE VIEW underwriting_summary AS

-- RTL scenarios (from loan_underwriting_versions)
SELECT
  'rtl'::text as model_type,
  ms.id as scenario_id,
  ms.name as scenario_name,
  luv.id as version_id,
  luv.version_number,
  luv.is_active,
  luv.status,
  luv.label,
  luv.created_at,
  luv.opportunity_id,
  luv.loan_id,
  NULL::uuid as equity_deal_id,
  luv.computation_status
FROM model_scenarios ms
JOIN loan_underwriting_versions luv ON luv.scenario_id = ms.id
WHERE ms.model_type = 'rtl'

UNION ALL

-- Commercial scenarios
SELECT
  'commercial'::text as model_type,
  ms.id as scenario_id,
  ms.name as scenario_name,
  cu.id as version_id,
  cu.version_number,
  cu.is_active,
  cu.status,
  cu.label,
  cu.created_at,
  cu.opportunity_id,
  cu.loan_id,
  cu.equity_deal_id,
  NULL::text as computation_status
FROM model_scenarios ms
JOIN commercial_underwriting cu ON cu.scenario_id = ms.id
WHERE ms.model_type = 'commercial'

UNION ALL

-- DSCR scenarios
SELECT
  'dscr'::text as model_type,
  ms.id as scenario_id,
  ms.name as scenario_name,
  du.id as version_id,
  du.version_number,
  du.is_active,
  du.status,
  du.label,
  du.created_at,
  du.opportunity_id,
  du.loan_id,
  NULL::uuid as equity_deal_id,
  NULL::text as computation_status
FROM model_scenarios ms
JOIN dscr_underwriting du ON du.scenario_id = ms.id
WHERE ms.model_type = 'dscr'

UNION ALL

-- GUC scenarios
SELECT
  'guc'::text as model_type,
  ms.id as scenario_id,
  ms.name as scenario_name,
  gu.id as version_id,
  gu.version_number,
  gu.is_active,
  gu.status,
  gu.label,
  gu.created_at,
  gu.opportunity_id,
  gu.loan_id,
  NULL::uuid as equity_deal_id,
  NULL::text as computation_status
FROM model_scenarios ms
JOIN guc_underwriting gu ON gu.scenario_id = ms.id
WHERE ms.model_type = 'guc'

UNION ALL

-- Equity scenarios
SELECT
  'equity'::text as model_type,
  ms.id as scenario_id,
  ms.name as scenario_name,
  eu.id as version_id,
  eu.version_number,
  eu.is_active,
  eu.status,
  eu.label,
  eu.created_at,
  NULL::uuid as opportunity_id,
  NULL::uuid as loan_id,
  eu.deal_id as equity_deal_id,
  NULL::text as computation_status
FROM model_scenarios ms
JOIN equity_underwriting eu ON eu.scenario_id = ms.id
WHERE ms.model_type = 'equity';
