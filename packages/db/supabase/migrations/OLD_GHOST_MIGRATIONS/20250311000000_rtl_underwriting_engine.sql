-- =============================================================================
-- RTL Fix & Flip Underwriting Engine
-- =============================================================================
-- This migration creates the complete underwriting engine including:
--   - Pricing engine tables (pricing_programs, pricing_program_versions, leverage_adjusters)
--   - Underwriting columns on existing loans table
--   - Supporting tables (deal_leverage_adjustments, loan_comps, loan_draws, loan_eligibility_checks)
--   - Database functions (create_pricing_version, run_eligibility_check, calculate_deal_metrics)
--   - RLS policies for all new tables
--
-- IMPORTANT: Does NOT touch loan_conditions (already exists)
-- =============================================================================


-- =====================================================================
-- PART 1: PRICING ENGINE TABLES
-- =====================================================================

-- ---------------------------------------------------------------------------
-- 1A. pricing_programs — Stores each loan program's base terms with versioning
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_programs (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id           text NOT NULL,
  loan_type            text NOT NULL,
  program_name         text NOT NULL,
  arv_label            text,
  interest_rate        numeric NOT NULL,
  rate_type            text NOT NULL DEFAULT 'Fixed',
  origination_points   numeric NOT NULL,
  min_origination_fee  numeric NOT NULL DEFAULT 0,
  points_note          text,
  max_ltv              numeric NOT NULL,
  ltv_note             text,
  max_ltc              numeric NOT NULL,
  ltc_note             text,
  max_ltp              numeric NOT NULL,
  loan_term_months     integer NOT NULL DEFAULT 12,
  exit_points          numeric NOT NULL DEFAULT 0.0,
  term_note            text,
  legal_doc_fee        numeric NOT NULL DEFAULT 0,
  bpo_appraisal_cost   numeric NOT NULL DEFAULT 0,
  bpo_appraisal_note   text,
  min_credit_score     numeric NOT NULL DEFAULT 0,
  min_deals_24mo       numeric NOT NULL DEFAULT 0,
  citizenship          text NOT NULL DEFAULT 'any',
  version              integer NOT NULL DEFAULT 1,
  is_current           boolean NOT NULL DEFAULT true,
  effective_date       timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid REFERENCES auth.users(id)
);

-- Unique constraint: only one current version per program_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_pricing_programs_current
  ON public.pricing_programs (program_id) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_pricing_programs_program_id
  ON public.pricing_programs (program_id);

CREATE INDEX IF NOT EXISTS idx_pricing_programs_is_current
  ON public.pricing_programs (is_current);

-- ---------------------------------------------------------------------------
-- 1B. pricing_program_versions — Audit log for pricing changes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pricing_program_versions (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id           text NOT NULL,
  version              integer NOT NULL,
  change_description   text,
  changed_by           uuid REFERENCES auth.users(id),
  changed_at           timestamptz NOT NULL DEFAULT now(),
  snapshot             jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_pricing_program_versions_program_id
  ON public.pricing_program_versions (program_id);

CREATE INDEX IF NOT EXISTS idx_pricing_program_versions_version
  ON public.pricing_program_versions (program_id, version);

-- ---------------------------------------------------------------------------
-- 1C. leverage_adjusters — Balance Sheet program risk adjustments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leverage_adjusters (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id             text NOT NULL DEFAULT 'ff_balance',
  risk_factor            text NOT NULL,
  display_name           text NOT NULL,
  condition_description  text,
  ltc_adjustment         numeric NOT NULL DEFAULT 0,
  ltv_adjustment         numeric NOT NULL DEFAULT 0,
  note                   text,
  is_active              boolean NOT NULL DEFAULT true,
  sort_order             integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_leverage_adjusters_program_id
  ON public.leverage_adjusters (program_id);

CREATE INDEX IF NOT EXISTS idx_leverage_adjusters_is_active
  ON public.leverage_adjusters (is_active);


-- =====================================================================
-- PART 1 SEED DATA
-- =====================================================================

-- Seed Premier Program (version 1)
INSERT INTO public.pricing_programs (
  program_id, loan_type, program_name, arv_label,
  interest_rate, rate_type, origination_points, min_origination_fee, points_note,
  max_ltv, ltv_note, max_ltc, ltc_note, max_ltp,
  loan_term_months, exit_points, term_note,
  legal_doc_fee, bpo_appraisal_cost, bpo_appraisal_note,
  min_credit_score, min_deals_24mo, citizenship,
  version, is_current, effective_date
) VALUES (
  'ff_premier', 'Fix & Flip', 'Premier Program', 'After Repair Value (ARV)',
  9.0, 'Fixed', 2.0, 4000, '2 pts or $4k min',
  70.0, 'Hard Cap', 90.0, 'Hard Cap', 90.0,
  12, 0.0, '12 months — no exit points',
  1250, 500, 'Desktop BPO',
  650, 3, 'us_resident',
  1, true, now()
);

-- Seed Balance Sheet Program (version 1)
INSERT INTO public.pricing_programs (
  program_id, loan_type, program_name, arv_label,
  interest_rate, rate_type, origination_points, min_origination_fee, points_note,
  max_ltv, ltv_note, max_ltc, ltc_note, max_ltp,
  loan_term_months, exit_points, term_note,
  legal_doc_fee, bpo_appraisal_cost, bpo_appraisal_note,
  min_credit_score, min_deals_24mo, citizenship,
  version, is_current, effective_date
) VALUES (
  'ff_balance', 'Fix & Flip', 'Balance Sheet', 'After Repair Value (ARV)',
  12.0, 'Fixed', 3.0, 4000, '3 pts or $4k min',
  65.0, 'Before adjustments', 85.0, 'Before adjustments', 85.0,
  12, 0.0, '12 months — no exit points',
  1250, 500, 'Desktop BPO',
  0, 0, 'any',
  1, true, now()
);

-- Seed 10 leverage adjusters for ff_balance
INSERT INTO public.leverage_adjusters (program_id, risk_factor, display_name, condition_description, ltc_adjustment, ltv_adjustment, note, is_active, sort_order) VALUES
  ('ff_balance', 'foreign_national',    'Foreign National',      'Borrower lives outside US',    -5.0, -5.0, 'Non-US residence',             true, 1),
  ('ff_balance', 'low_credit',          'Low Credit Score',      'FICO below 600',               -5.0, -5.0, 'Sub-600 FICO',                 true, 2),
  ('ff_balance', 'no_experience',       'No Experience',         '0 deals completed',             -5.0, -5.0, 'First-time investor',          true, 3),
  ('ff_balance', 'rural_property',      'Rural Property',        'USDA Rural designation',        -5.0, -5.0, 'USDA Rural zone',              true, 4),
  ('ff_balance', 'flood_zone',          'Flood Zone',            'Property in FEMA flood zone',   -5.0, -5.0, 'FEMA flood zone',              true, 5),
  ('ff_balance', 'cash_out_refinance',  'Cash-Out Refinance',    'Not an acquisition loan',       -5.0, -5.0, 'Refinance penalty',            true, 6),
  ('ff_balance', 'condo_townhouse',     'Condo/Townhouse',       'Non-SFR property type',         -3.0, -3.0, 'Non-SFR adjustment',           true, 7),
  ('ff_balance', 'high_rehab_ratio',    'High Rehab Ratio',      'Rehab > 50% of PP',             -5.0, -5.0, 'High rehab-to-purchase ratio',  true, 8),
  ('ff_balance', 'extended_term',       'Extended Term',         'Loan term > 12 months',         -3.0, -3.0, 'Longer hold period',           true, 9),
  ('ff_balance', 'low_arv_confidence',  'Low ARV Confidence',    'Weak comp support',             -5.0, -5.0, 'Insufficient comparable sales', true, 10);


-- =====================================================================
-- PART 2: EXTEND EXISTING LOANS TABLE WITH UNDERWRITING COLUMNS
-- =====================================================================

-- Pricing program linkage
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS program_id text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS program_version integer;

-- Borrower info (deal-level snapshot)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_name text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS entity_name text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS credit_score integer;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS experience_deals_24mo integer;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS legal_status text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS guarantors text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_entity_id uuid;

-- Property details
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_county text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS property_type text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS year_built integer;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS bedrooms integer;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS bathrooms numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS heated_sqft numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS lot_size_sqft numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS num_floors integer;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS has_garage boolean;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS construction_type text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS flood_zone boolean;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rural_status text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS zoning text;

-- Valuation
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rehab_budget numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_project_cost numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS after_repair_value numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS client_stated_arv numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS avm_value numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS purchase_price_per_sqft numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS arv_per_sqft numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS rehab_per_sqft numeric;

-- Loan structure
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS holding_period_months integer;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS anticipated_closing_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS interest_type text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_points numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS lender_fees_flat numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_ltv numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_ltc numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_ltp numeric;

-- Loan sizing (computed by calculate_deal_metrics)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_loan_arv_constraint numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_loan_ltc_constraint numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS max_loan_ltp_constraint numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS binding_constraint numeric;

-- Proposed loan
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS requested_loan_amount numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_loan_amount numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS allocated_to_purchase numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS allocated_to_rehab numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS mobilization_draw numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS lender_cash_at_closing numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS remaining_rehab_draws numeric;

-- Flags
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS requested_exceeds_max boolean DEFAULT false;

-- Holding costs
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS annual_property_tax numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS annual_insurance numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS monthly_utilities numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS monthly_hoa numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS monthly_interest_payment numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_monthly_holding_cost numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_holding_costs numeric;

-- Borrower closing costs
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_fee_amount numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS title_closing_escrow numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS prepaid_interest_est numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_closing_costs numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS total_borrower_cash_to_close numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS cash_to_close_pct_of_pp numeric;

-- Borrower P&L
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS sales_disposition_pct numeric DEFAULT 3.0;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS gross_sale_proceeds numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS sales_costs numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS net_sale_proceeds numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS net_profit numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_roi numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS annualized_roi numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS num_partners integer DEFAULT 1;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS cash_per_partner numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS profit_per_partner numeric;

-- Credit box metrics
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS ltv_arv numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS ltc numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS ltp numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS day1_ltv numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS loan_per_sqft numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS borrower_equity_at_closing numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS arv_minus_loan_cushion numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS break_even_sale_price numeric;

-- Meta
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id);

-- Add FK for borrower_entity_id (if borrower_entities table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'borrower_entities'
  ) THEN
    BEGIN
      ALTER TABLE public.loans
        ADD CONSTRAINT loans_borrower_entity_id_fkey
        FOREIGN KEY (borrower_entity_id) REFERENCES public.borrower_entities(id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;

-- Update stage constraint to include new statuses needed for underwriting flow
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_stage_check;
ALTER TABLE public.loans ADD CONSTRAINT loans_stage_check
  CHECK (stage IN (
    'lead', 'application', 'processing', 'underwriting', 'approved',
    'clear_to_close', 'funded', 'servicing', 'payoff', 'default',
    'reo', 'paid_off',
    -- New underwriting-specific statuses
    'draft', 'submitted', 'in_review', 'denied', 'withdrawn', 'note_sold'
  ));

-- Update loan_type constraint to include 'rtl'
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
ALTER TABLE public.loans ADD CONSTRAINT loans_loan_type_check
  CHECK (loan_type IN (
    'bridge_residential', 'bridge_commercial', 'fix_and_flip',
    'ground_up', 'stabilized', 'dscr', 'rtl', 'other'
  ));

-- Indexes for new underwriting columns
CREATE INDEX IF NOT EXISTS idx_loans_program_id ON public.loans(program_id);
CREATE INDEX IF NOT EXISTS idx_loans_assigned_to ON public.loans(assigned_to);
CREATE INDEX IF NOT EXISTS idx_loans_property_type ON public.loans(property_type);


-- =====================================================================
-- PART 3: SUPPORTING TABLES
-- =====================================================================

-- ---------------------------------------------------------------------------
-- 3A. deal_leverage_adjustments — Which adjusters are applied to a deal
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_leverage_adjustments (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id              uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  adjuster_id          uuid REFERENCES public.leverage_adjusters(id) NOT NULL,
  applies              boolean NOT NULL DEFAULT false,
  ltc_adjustment       numeric NOT NULL DEFAULT 0,
  ltv_adjustment       numeric NOT NULL DEFAULT 0,
  applied_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_leverage_adjustments_loan_id
  ON public.deal_leverage_adjustments (loan_id);

CREATE INDEX IF NOT EXISTS idx_deal_leverage_adjustments_adjuster_id
  ON public.deal_leverage_adjustments (adjuster_id);

-- ---------------------------------------------------------------------------
-- 3B. loan_comps — Comparable sales for ARV support
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_comps (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id                  uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  comp_type                text NOT NULL CHECK (comp_type IN (
    'subject', 'sold_1', 'sold_2', 'sold_3', 'active_1', 'active_2', 'active_3'
  )),
  address                  text,
  layout                   text,
  num_floors               integer,
  has_garage               boolean,
  construction             text,
  sale_price               numeric,
  sale_date                date,
  sqft                     numeric,
  price_per_sqft           numeric,
  year_built               integer,
  lot_size                 text,
  ffiec_tract_income       text,
  distance_from_subject    numeric,
  notes                    text,
  sort_order               integer NOT NULL DEFAULT 0,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_comps_loan_id
  ON public.loan_comps (loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_comps_comp_type
  ON public.loan_comps (comp_type);

-- ---------------------------------------------------------------------------
-- 3C. loan_draws — Rehab draw tracking (separate from existing draw_requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_draws (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id              uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  draw_number          integer NOT NULL,
  description          text,
  budgeted_amount      numeric,
  requested_amount     numeric,
  approved_amount      numeric,
  cumulative_drawn     numeric,
  pct_complete         numeric,
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'requested', 'inspected', 'approved', 'funded', 'denied'
  )),
  inspection_notes     text,
  requested_at         timestamptz,
  approved_at          timestamptz,
  funded_at            timestamptz,
  approved_by          uuid REFERENCES auth.users(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_draws_loan_id
  ON public.loan_draws (loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_draws_status
  ON public.loan_draws (status);

-- ---------------------------------------------------------------------------
-- 3D. loan_eligibility_checks — Premier program eligibility per deal
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_eligibility_checks (
  id                     uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id                uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  program_id             text NOT NULL,
  credit_score_check     text DEFAULT 'N/A' CHECK (credit_score_check IN ('PASS', 'FAIL', 'N/A')),
  experience_check       text DEFAULT 'N/A' CHECK (experience_check IN ('PASS', 'FAIL', 'N/A')),
  citizenship_check      text DEFAULT 'N/A' CHECK (citizenship_check IN ('PASS', 'FAIL', 'N/A')),
  appraisal_check        text DEFAULT 'N/A' CHECK (appraisal_check IN ('PASS', 'FAIL', 'N/A')),
  overall_result         text DEFAULT 'NOT ELIGIBLE' CHECK (overall_result IN ('ELIGIBLE', 'NOT ELIGIBLE')),
  checked_at             timestamptz NOT NULL DEFAULT now(),
  notes                  text
);

CREATE INDEX IF NOT EXISTS idx_loan_eligibility_checks_loan_id
  ON public.loan_eligibility_checks (loan_id);

CREATE INDEX IF NOT EXISTS idx_loan_eligibility_checks_program_id
  ON public.loan_eligibility_checks (program_id);


-- =====================================================================
-- PART 4: RLS POLICIES
-- =====================================================================

-- --- pricing_programs: authenticated read, admin write ---
ALTER TABLE public.pricing_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pricing_programs"
  ON public.pricing_programs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert pricing_programs"
  ON public.pricing_programs FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update pricing_programs"
  ON public.pricing_programs FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete pricing_programs"
  ON public.pricing_programs FOR DELETE
  USING (is_admin());

-- --- pricing_program_versions: authenticated read, admin write ---
ALTER TABLE public.pricing_program_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pricing_program_versions"
  ON public.pricing_program_versions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert pricing_program_versions"
  ON public.pricing_program_versions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update pricing_program_versions"
  ON public.pricing_program_versions FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete pricing_program_versions"
  ON public.pricing_program_versions FOR DELETE
  USING (is_admin());

-- --- leverage_adjusters: authenticated read, admin write ---
ALTER TABLE public.leverage_adjusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view leverage_adjusters"
  ON public.leverage_adjusters FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert leverage_adjusters"
  ON public.leverage_adjusters FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update leverage_adjusters"
  ON public.leverage_adjusters FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete leverage_adjusters"
  ON public.leverage_adjusters FOR DELETE
  USING (is_admin());

-- --- deal_leverage_adjustments: borrower own, admin all ---
ALTER TABLE public.deal_leverage_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select deal_leverage_adjustments"
  ON public.deal_leverage_adjustments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert deal_leverage_adjustments"
  ON public.deal_leverage_adjustments FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update deal_leverage_adjustments"
  ON public.deal_leverage_adjustments FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete deal_leverage_adjustments"
  ON public.deal_leverage_adjustments FOR DELETE
  USING (is_admin());

CREATE POLICY "Borrowers can view own deal_leverage_adjustments"
  ON public.deal_leverage_adjustments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = deal_leverage_adjustments.loan_id
    AND l.borrower_id IN (SELECT * FROM my_borrower_ids())
  ));

-- --- loan_comps: borrower own, admin all ---
ALTER TABLE public.loan_comps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select loan_comps"
  ON public.loan_comps FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert loan_comps"
  ON public.loan_comps FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update loan_comps"
  ON public.loan_comps FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete loan_comps"
  ON public.loan_comps FOR DELETE
  USING (is_admin());

CREATE POLICY "Borrowers can view own loan_comps"
  ON public.loan_comps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_comps.loan_id
    AND l.borrower_id IN (SELECT * FROM my_borrower_ids())
  ));

-- --- loan_draws: borrower own, admin all ---
ALTER TABLE public.loan_draws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select loan_draws"
  ON public.loan_draws FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert loan_draws"
  ON public.loan_draws FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update loan_draws"
  ON public.loan_draws FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete loan_draws"
  ON public.loan_draws FOR DELETE
  USING (is_admin());

CREATE POLICY "Borrowers can view own loan_draws"
  ON public.loan_draws FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_draws.loan_id
    AND l.borrower_id IN (SELECT * FROM my_borrower_ids())
  ));

CREATE POLICY "Borrowers can request own loan_draws"
  ON public.loan_draws FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_draws.loan_id
    AND l.borrower_id IN (SELECT * FROM my_borrower_ids())
  ));

-- --- loan_eligibility_checks: borrower own, admin all ---
ALTER TABLE public.loan_eligibility_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select loan_eligibility_checks"
  ON public.loan_eligibility_checks FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert loan_eligibility_checks"
  ON public.loan_eligibility_checks FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update loan_eligibility_checks"
  ON public.loan_eligibility_checks FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete loan_eligibility_checks"
  ON public.loan_eligibility_checks FOR DELETE
  USING (is_admin());

CREATE POLICY "Borrowers can view own loan_eligibility_checks"
  ON public.loan_eligibility_checks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_eligibility_checks.loan_id
    AND l.borrower_id IN (SELECT * FROM my_borrower_ids())
  ));


-- =====================================================================
-- PART 5: DATABASE FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------------
-- 5A. create_pricing_version — Snapshot + update pricing program
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_pricing_version(
  p_program_id text,
  p_changes jsonb,
  p_changed_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_row public.pricing_programs;
  v_snapshot jsonb;
  v_new_version integer;
  v_new_id uuid;
  v_key text;
  v_value text;
BEGIN
  -- 1. Get the current version of the program
  SELECT * INTO v_current_row
  FROM public.pricing_programs
  WHERE program_id = p_program_id AND is_current = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Program not found: ' || p_program_id);
  END IF;

  -- 2. Build snapshot of current row
  v_snapshot := jsonb_build_object(
    'id', v_current_row.id,
    'program_id', v_current_row.program_id,
    'loan_type', v_current_row.loan_type,
    'program_name', v_current_row.program_name,
    'arv_label', v_current_row.arv_label,
    'interest_rate', v_current_row.interest_rate,
    'rate_type', v_current_row.rate_type,
    'origination_points', v_current_row.origination_points,
    'min_origination_fee', v_current_row.min_origination_fee,
    'points_note', v_current_row.points_note,
    'max_ltv', v_current_row.max_ltv,
    'ltv_note', v_current_row.ltv_note,
    'max_ltc', v_current_row.max_ltc,
    'ltc_note', v_current_row.ltc_note,
    'max_ltp', v_current_row.max_ltp,
    'loan_term_months', v_current_row.loan_term_months,
    'exit_points', v_current_row.exit_points,
    'term_note', v_current_row.term_note,
    'legal_doc_fee', v_current_row.legal_doc_fee,
    'bpo_appraisal_cost', v_current_row.bpo_appraisal_cost,
    'bpo_appraisal_note', v_current_row.bpo_appraisal_note,
    'min_credit_score', v_current_row.min_credit_score,
    'min_deals_24mo', v_current_row.min_deals_24mo,
    'citizenship', v_current_row.citizenship,
    'version', v_current_row.version,
    'effective_date', v_current_row.effective_date
  );

  -- 3. Insert into audit log
  INSERT INTO public.pricing_program_versions (
    program_id, version, change_description, changed_by, changed_at, snapshot
  ) VALUES (
    p_program_id,
    v_current_row.version,
    COALESCE(p_changes->>'change_description', 'Pricing update'),
    p_changed_by,
    now(),
    v_snapshot
  );

  -- 4. Mark old version as not current
  UPDATE public.pricing_programs
  SET is_current = false
  WHERE program_id = p_program_id AND is_current = true;

  -- 5. Calculate new version
  v_new_version := v_current_row.version + 1;

  -- 6. Insert new version with changes applied
  INSERT INTO public.pricing_programs (
    program_id, loan_type, program_name, arv_label,
    interest_rate, rate_type, origination_points, min_origination_fee, points_note,
    max_ltv, ltv_note, max_ltc, ltc_note, max_ltp,
    loan_term_months, exit_points, term_note,
    legal_doc_fee, bpo_appraisal_cost, bpo_appraisal_note,
    min_credit_score, min_deals_24mo, citizenship,
    version, is_current, effective_date, created_by
  ) VALUES (
    p_program_id,
    COALESCE(p_changes->>'loan_type', v_current_row.loan_type),
    COALESCE(p_changes->>'program_name', v_current_row.program_name),
    COALESCE(p_changes->>'arv_label', v_current_row.arv_label),
    COALESCE((p_changes->>'interest_rate')::numeric, v_current_row.interest_rate),
    COALESCE(p_changes->>'rate_type', v_current_row.rate_type),
    COALESCE((p_changes->>'origination_points')::numeric, v_current_row.origination_points),
    COALESCE((p_changes->>'min_origination_fee')::numeric, v_current_row.min_origination_fee),
    COALESCE(p_changes->>'points_note', v_current_row.points_note),
    COALESCE((p_changes->>'max_ltv')::numeric, v_current_row.max_ltv),
    COALESCE(p_changes->>'ltv_note', v_current_row.ltv_note),
    COALESCE((p_changes->>'max_ltc')::numeric, v_current_row.max_ltc),
    COALESCE(p_changes->>'ltc_note', v_current_row.ltc_note),
    COALESCE((p_changes->>'max_ltp')::numeric, v_current_row.max_ltp),
    COALESCE((p_changes->>'loan_term_months')::integer, v_current_row.loan_term_months),
    COALESCE((p_changes->>'exit_points')::numeric, v_current_row.exit_points),
    COALESCE(p_changes->>'term_note', v_current_row.term_note),
    COALESCE((p_changes->>'legal_doc_fee')::numeric, v_current_row.legal_doc_fee),
    COALESCE((p_changes->>'bpo_appraisal_cost')::numeric, v_current_row.bpo_appraisal_cost),
    COALESCE(p_changes->>'bpo_appraisal_note', v_current_row.bpo_appraisal_note),
    COALESCE((p_changes->>'min_credit_score')::numeric, v_current_row.min_credit_score),
    COALESCE((p_changes->>'min_deals_24mo')::numeric, v_current_row.min_deals_24mo),
    COALESCE(p_changes->>'citizenship', v_current_row.citizenship),
    v_new_version,
    true,
    now(),
    p_changed_by
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_version', v_new_version,
    'new_id', v_new_id,
    'previous_version', v_current_row.version
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 5B. run_eligibility_check — Check Premier program eligibility for a loan
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_eligibility_check(p_loan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loan public.loans;
  v_program public.pricing_programs;
  v_credit_check text;
  v_experience_check text;
  v_citizenship_check text;
  v_appraisal_check text;
  v_overall text;
  v_notes text := '';
  v_check_id uuid;
BEGIN
  -- 1. Get the loan
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Loan not found');
  END IF;

  -- 2. Get Premier program requirements
  SELECT * INTO v_program
  FROM public.pricing_programs
  WHERE program_id = 'ff_premier' AND is_current = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Premier program not found');
  END IF;

  -- 3. Run checks
  -- Credit score check
  IF v_loan.credit_score IS NULL THEN
    v_credit_check := 'N/A';
    v_notes := v_notes || 'Credit score not provided. ';
  ELSIF v_loan.credit_score >= v_program.min_credit_score THEN
    v_credit_check := 'PASS';
  ELSE
    v_credit_check := 'FAIL';
    v_notes := v_notes || 'Credit score ' || v_loan.credit_score || ' below minimum ' || v_program.min_credit_score || '. ';
  END IF;

  -- Experience check
  IF v_loan.experience_deals_24mo IS NULL THEN
    v_experience_check := 'N/A';
    v_notes := v_notes || 'Experience not provided. ';
  ELSIF v_loan.experience_deals_24mo >= v_program.min_deals_24mo THEN
    v_experience_check := 'PASS';
  ELSE
    v_experience_check := 'FAIL';
    v_notes := v_notes || 'Experience ' || v_loan.experience_deals_24mo || ' deals below minimum ' || v_program.min_deals_24mo || '. ';
  END IF;

  -- Citizenship check
  IF v_loan.legal_status IS NULL THEN
    v_citizenship_check := 'N/A';
    v_notes := v_notes || 'Legal status not provided. ';
  ELSIF v_program.citizenship = 'any' THEN
    v_citizenship_check := 'PASS';
  ELSIF v_program.citizenship = 'us_resident' AND v_loan.legal_status IN ('US Citizen', 'Permanent Resident') THEN
    v_citizenship_check := 'PASS';
  ELSE
    v_citizenship_check := 'FAIL';
    v_notes := v_notes || 'Legal status "' || v_loan.legal_status || '" does not meet requirement. ';
  END IF;

  -- Appraisal check (pass if ARV is provided)
  IF v_loan.after_repair_value IS NOT NULL OR v_loan.arv IS NOT NULL THEN
    v_appraisal_check := 'PASS';
  ELSE
    v_appraisal_check := 'N/A';
    v_notes := v_notes || 'ARV not provided for appraisal check. ';
  END IF;

  -- 4. Overall result
  IF v_credit_check = 'FAIL' OR v_experience_check = 'FAIL' OR v_citizenship_check = 'FAIL' THEN
    v_overall := 'NOT ELIGIBLE';
  ELSIF v_credit_check IN ('PASS', 'N/A') AND v_experience_check IN ('PASS', 'N/A') AND v_citizenship_check IN ('PASS', 'N/A') THEN
    -- Only eligible if all non-N/A checks pass
    IF v_credit_check = 'PASS' AND v_experience_check = 'PASS' AND v_citizenship_check = 'PASS' THEN
      v_overall := 'ELIGIBLE';
    ELSE
      v_overall := 'NOT ELIGIBLE';
      v_notes := v_notes || 'Insufficient data for eligibility determination. ';
    END IF;
  ELSE
    v_overall := 'NOT ELIGIBLE';
  END IF;

  -- 5. Upsert eligibility check record
  INSERT INTO public.loan_eligibility_checks (
    loan_id, program_id,
    credit_score_check, experience_check, citizenship_check, appraisal_check,
    overall_result, checked_at, notes
  ) VALUES (
    p_loan_id, 'ff_premier',
    v_credit_check, v_experience_check, v_citizenship_check, v_appraisal_check,
    v_overall, now(), NULLIF(TRIM(v_notes), '')
  )
  ON CONFLICT (loan_id, program_id)
    DO UPDATE SET
      credit_score_check = EXCLUDED.credit_score_check,
      experience_check = EXCLUDED.experience_check,
      citizenship_check = EXCLUDED.citizenship_check,
      appraisal_check = EXCLUDED.appraisal_check,
      overall_result = EXCLUDED.overall_result,
      checked_at = EXCLUDED.checked_at,
      notes = EXCLUDED.notes
  RETURNING id INTO v_check_id;

  RETURN jsonb_build_object(
    'success', true,
    'check_id', v_check_id,
    'program_id', 'ff_premier',
    'credit_score_check', v_credit_check,
    'experience_check', v_experience_check,
    'citizenship_check', v_citizenship_check,
    'appraisal_check', v_appraisal_check,
    'overall_result', v_overall,
    'notes', v_notes
  );
END;
$$;

-- Add unique constraint for upsert in eligibility checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_loan_eligibility_checks_loan_program
  ON public.loan_eligibility_checks (loan_id, program_id);

-- ---------------------------------------------------------------------------
-- 5C. calculate_deal_metrics — Recalculates all computed fields on a loan
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_deal_metrics(p_loan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loan public.loans;
  v_program public.pricing_programs;
  v_arv numeric;
  v_purchase_price numeric;
  v_rehab_budget numeric;
  v_total_project_cost numeric;
  v_effective_ltv numeric;
  v_effective_ltc numeric;
  v_effective_ltp numeric;
  v_max_loan_arv numeric;
  v_max_loan_ltc numeric;
  v_max_loan_ltp numeric;
  v_binding numeric;
  v_total_loan numeric;
  v_interest_rate numeric;
  v_loan_term_months integer;
  v_holding_months integer;
  v_monthly_interest numeric;
  v_total_monthly_holding numeric;
  v_total_holding numeric;
  v_origination_fee numeric;
  v_origination_points numeric;
  v_min_orig_fee numeric;
  v_prepaid_interest numeric;
  v_total_closing numeric;
  v_total_cash_to_close numeric;
  v_sales_disp_pct numeric;
  v_gross_proceeds numeric;
  v_sales_costs_val numeric;
  v_net_proceeds numeric;
  v_net_profit_val numeric;
  v_roi numeric;
  v_annualized_roi numeric;
  v_num_partners integer;
  v_adj_ltc numeric := 0;
  v_adj_ltv numeric := 0;
  v_heated_sqft numeric;
  v_allocated_purchase numeric;
  v_allocated_rehab numeric;
  v_mobilization numeric;
  v_lender_cash numeric;
  v_remaining_draws numeric;
  v_title_escrow numeric;
BEGIN
  -- 1. Get the loan
  SELECT * INTO v_loan FROM public.loans WHERE id = p_loan_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Loan not found');
  END IF;

  -- 2. Get the pricing program
  IF v_loan.program_id IS NOT NULL THEN
    SELECT * INTO v_program
    FROM public.pricing_programs
    WHERE program_id = v_loan.program_id AND is_current = true;
  END IF;

  -- 3. Set base values
  v_arv := COALESCE(v_loan.after_repair_value, v_loan.arv, 0);
  v_purchase_price := COALESCE(v_loan.purchase_price, 0);
  v_rehab_budget := COALESCE(v_loan.rehab_budget, 0);
  v_total_project_cost := v_purchase_price + v_rehab_budget;
  v_heated_sqft := COALESCE(v_loan.heated_sqft, 0);
  v_num_partners := COALESCE(v_loan.num_partners, 1);
  v_sales_disp_pct := COALESCE(v_loan.sales_disposition_pct, 3.0);
  v_title_escrow := COALESCE(v_loan.title_closing_escrow, 0);

  -- Get effective rates from program or loan overrides
  IF v_program IS NOT NULL THEN
    v_interest_rate := COALESCE(v_loan.interest_rate, v_program.interest_rate);
    v_origination_points := COALESCE(v_loan.origination_points, v_program.origination_points);
    v_min_orig_fee := COALESCE(v_program.min_origination_fee, 0);
    v_loan_term_months := COALESCE(v_loan.holding_period_months, v_program.loan_term_months, 12);
    v_effective_ltv := v_program.max_ltv;
    v_effective_ltc := v_program.max_ltc;
    v_effective_ltp := v_program.max_ltp;
  ELSE
    v_interest_rate := COALESCE(v_loan.interest_rate, 0);
    v_origination_points := COALESCE(v_loan.origination_points, 0);
    v_min_orig_fee := 0;
    v_loan_term_months := COALESCE(v_loan.holding_period_months, 12);
    v_effective_ltv := COALESCE(v_loan.max_ltv, 70.0);
    v_effective_ltc := COALESCE(v_loan.max_ltc, 90.0);
    v_effective_ltp := COALESCE(v_loan.max_ltp, 90.0);
  END IF;

  v_holding_months := COALESCE(v_loan.holding_period_months, v_loan_term_months);

  -- 4. Apply leverage adjustments for Balance Sheet program
  IF v_loan.program_id = 'ff_balance' THEN
    SELECT
      COALESCE(SUM(CASE WHEN applies THEN ltc_adjustment ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN applies THEN ltv_adjustment ELSE 0 END), 0)
    INTO v_adj_ltc, v_adj_ltv
    FROM public.deal_leverage_adjustments
    WHERE loan_id = p_loan_id;

    v_effective_ltc := v_effective_ltc + v_adj_ltc;
    v_effective_ltv := v_effective_ltv + v_adj_ltv;
    v_effective_ltp := v_effective_ltp + v_adj_ltc; -- LTP adjusts same as LTC
  END IF;

  -- 5. Calculate loan sizing (percentages stored as whole numbers, e.g. 70.0 = 70%)
  v_max_loan_arv := (v_effective_ltv / 100.0) * v_arv;
  v_max_loan_ltc := (v_effective_ltc / 100.0) * v_total_project_cost;
  v_max_loan_ltp := (v_effective_ltp / 100.0) * v_purchase_price;
  v_binding := LEAST(v_max_loan_arv, v_max_loan_ltc, v_max_loan_ltp);

  -- 6. Determine total loan amount
  v_total_loan := COALESCE(v_loan.total_loan_amount, v_loan.loan_amount, v_binding);

  -- 7. Loan allocation
  v_allocated_purchase := LEAST(v_total_loan, v_purchase_price);
  v_allocated_rehab := v_total_loan - v_allocated_purchase;
  v_mobilization := COALESCE(v_loan.mobilization_draw, 0);
  v_lender_cash := v_allocated_purchase + v_mobilization;
  v_remaining_draws := v_allocated_rehab - v_mobilization;

  -- 8. Monthly interest payment: loan * (rate% / 12)
  v_monthly_interest := v_total_loan * (v_interest_rate / 100.0 / 12.0);

  -- 9. Total monthly holding cost
  v_total_monthly_holding := v_monthly_interest
    + COALESCE(v_loan.annual_property_tax, 0) / 12.0
    + COALESCE(v_loan.annual_insurance, 0) / 12.0
    + COALESCE(v_loan.monthly_utilities, 0)
    + COALESCE(v_loan.monthly_hoa, 0);

  -- 10. Total holding costs
  v_total_holding := v_total_monthly_holding * v_holding_months;

  -- 11. Origination fee: MAX(loan * points%, min_origination_fee)
  v_origination_fee := GREATEST(v_total_loan * (v_origination_points / 100.0), v_min_orig_fee);

  -- 12. Prepaid interest estimate: loan * rate/360 * 15 days
  v_prepaid_interest := v_total_loan * (v_interest_rate / 100.0 / 360.0) * 15.0;

  -- 13. Total closing costs
  v_total_closing := v_origination_fee + v_title_escrow + v_prepaid_interest
    + COALESCE(v_loan.lender_fees_flat, 0);

  -- 14. Total borrower cash to close
  v_total_cash_to_close := (v_purchase_price - v_allocated_purchase)
    + (v_rehab_budget - v_allocated_rehab)
    + v_total_closing;

  -- 15. Borrower P&L
  v_gross_proceeds := v_arv;
  v_sales_costs_val := v_arv * (v_sales_disp_pct / 100.0);
  v_net_proceeds := v_gross_proceeds - v_sales_costs_val;
  v_net_profit_val := v_net_proceeds - v_purchase_price - v_rehab_budget
    - v_total_closing - v_total_holding;

  -- 16. ROI calculations
  IF v_total_cash_to_close > 0 THEN
    v_roi := (v_net_profit_val / v_total_cash_to_close) * 100.0;
    IF v_holding_months > 0 THEN
      v_annualized_roi := v_roi * (12.0 / v_holding_months);
    ELSE
      v_annualized_roi := 0;
    END IF;
  ELSE
    v_roi := 0;
    v_annualized_roi := 0;
  END IF;

  -- 17. Update the loan record with all computed values
  UPDATE public.loans SET
    -- Valuation computed
    total_project_cost = v_total_project_cost,
    purchase_price_per_sqft = CASE WHEN v_heated_sqft > 0 THEN v_purchase_price / v_heated_sqft ELSE NULL END,
    arv_per_sqft = CASE WHEN v_heated_sqft > 0 THEN v_arv / v_heated_sqft ELSE NULL END,
    rehab_per_sqft = CASE WHEN v_heated_sqft > 0 THEN v_rehab_budget / v_heated_sqft ELSE NULL END,

    -- Effective leverage limits
    max_ltv = v_effective_ltv,
    max_ltc = v_effective_ltc,
    max_ltp = v_effective_ltp,

    -- Loan sizing
    max_loan_arv_constraint = v_max_loan_arv,
    max_loan_ltc_constraint = v_max_loan_ltc,
    max_loan_ltp_constraint = v_max_loan_ltp,
    binding_constraint = v_binding,

    -- Proposed loan
    allocated_to_purchase = v_allocated_purchase,
    allocated_to_rehab = v_allocated_rehab,
    lender_cash_at_closing = v_lender_cash,
    remaining_rehab_draws = v_remaining_draws,

    -- Flags
    requested_exceeds_max = CASE
      WHEN v_loan.requested_loan_amount IS NOT NULL AND v_loan.requested_loan_amount > v_binding
      THEN true ELSE false END,

    -- Holding costs
    monthly_interest_payment = v_monthly_interest,
    total_monthly_holding_cost = v_total_monthly_holding,
    total_holding_costs = v_total_holding,

    -- Closing costs
    origination_fee_amount = v_origination_fee,
    prepaid_interest_est = v_prepaid_interest,
    total_closing_costs = v_total_closing,
    total_borrower_cash_to_close = v_total_cash_to_close,
    cash_to_close_pct_of_pp = CASE
      WHEN v_purchase_price > 0 THEN (v_total_cash_to_close / v_purchase_price) * 100.0
      ELSE NULL END,

    -- Borrower P&L
    gross_sale_proceeds = v_gross_proceeds,
    sales_costs = v_sales_costs_val,
    net_sale_proceeds = v_net_proceeds,
    net_profit = v_net_profit_val,
    borrower_roi = v_roi,
    annualized_roi = v_annualized_roi,
    cash_per_partner = CASE WHEN v_num_partners > 0 THEN v_total_cash_to_close / v_num_partners ELSE NULL END,
    profit_per_partner = CASE WHEN v_num_partners > 0 THEN v_net_profit_val / v_num_partners ELSE NULL END,

    -- Credit box metrics
    ltv_arv = CASE WHEN v_arv > 0 THEN (v_total_loan / v_arv) * 100.0 ELSE NULL END,
    ltc = CASE WHEN v_total_project_cost > 0 THEN (v_total_loan / v_total_project_cost) * 100.0 ELSE NULL END,
    ltp = CASE WHEN v_purchase_price > 0 THEN (v_total_loan / v_purchase_price) * 100.0 ELSE NULL END,
    day1_ltv = CASE WHEN v_arv > 0 THEN (v_lender_cash / v_arv) * 100.0 ELSE NULL END,
    loan_per_sqft = CASE WHEN v_heated_sqft > 0 THEN v_total_loan / v_heated_sqft ELSE NULL END,
    borrower_equity_at_closing = v_total_cash_to_close,
    arv_minus_loan_cushion = v_arv - v_total_loan,
    break_even_sale_price = v_total_loan + v_total_closing + v_total_holding + v_sales_costs_val,

    -- Store program version used
    program_version = CASE WHEN v_program IS NOT NULL THEN v_program.version ELSE v_loan.program_version END,
    interest_rate = v_interest_rate,
    origination_points = v_origination_points,
    updated_at = now()
  WHERE id = p_loan_id;

  RETURN jsonb_build_object(
    'success', true,
    'loan_id', p_loan_id,
    'program_id', v_loan.program_id,
    'program_version', CASE WHEN v_program IS NOT NULL THEN v_program.version ELSE NULL END,
    'binding_constraint', v_binding,
    'max_loan_arv', v_max_loan_arv,
    'max_loan_ltc', v_max_loan_ltc,
    'max_loan_ltp', v_max_loan_ltp,
    'total_loan', v_total_loan,
    'effective_ltv', v_effective_ltv,
    'effective_ltc', v_effective_ltc,
    'effective_ltp', v_effective_ltp,
    'monthly_interest', v_monthly_interest,
    'total_holding_costs', v_total_holding,
    'origination_fee', v_origination_fee,
    'total_closing_costs', v_total_closing,
    'total_cash_to_close', v_total_cash_to_close,
    'net_profit', v_net_profit_val,
    'borrower_roi', v_roi,
    'annualized_roi', v_annualized_roi,
    'requested_exceeds_max', CASE
      WHEN v_loan.requested_loan_amount IS NOT NULL AND v_loan.requested_loan_amount > v_binding
      THEN true ELSE false END,
    'leverage_adjustments_ltc', v_adj_ltc,
    'leverage_adjustments_ltv', v_adj_ltv
  );
END;
$$;


-- =====================================================================
-- PART 6: TRIGGERS
-- =====================================================================

-- Updated_at trigger for new tables that need it
-- (pricing_programs doesn't need one since we create new versions)

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
