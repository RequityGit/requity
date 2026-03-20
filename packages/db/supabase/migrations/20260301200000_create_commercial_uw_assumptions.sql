-- ============================================================================
-- Commercial Underwriting Assumptions — Default assumptions by property type
-- ============================================================================

CREATE TABLE IF NOT EXISTS commercial_uw_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type text NOT NULL UNIQUE,
  -- Vacancy & Credit Loss
  vacancy_pct numeric NOT NULL DEFAULT 5,
  stabilized_vacancy_pct numeric NOT NULL DEFAULT 5,
  bad_debt_pct numeric NOT NULL DEFAULT 1,
  -- Management
  mgmt_fee_pct numeric NOT NULL DEFAULT 8,
  -- Growth Assumptions (Years 1-5)
  rent_growth_yr1 numeric NOT NULL DEFAULT 3,
  rent_growth_yr2 numeric NOT NULL DEFAULT 3,
  rent_growth_yr3 numeric NOT NULL DEFAULT 3,
  rent_growth_yr4 numeric NOT NULL DEFAULT 3,
  rent_growth_yr5 numeric NOT NULL DEFAULT 3,
  expense_growth_yr1 numeric NOT NULL DEFAULT 2,
  expense_growth_yr2 numeric NOT NULL DEFAULT 2,
  expense_growth_yr3 numeric NOT NULL DEFAULT 2,
  expense_growth_yr4 numeric NOT NULL DEFAULT 2,
  expense_growth_yr5 numeric NOT NULL DEFAULT 2,
  -- Cap Rates
  going_in_cap_rate numeric NOT NULL DEFAULT 7,
  exit_cap_rate numeric NOT NULL DEFAULT 7.5,
  -- Exit / Disposition
  disposition_cost_pct numeric NOT NULL DEFAULT 2,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_commercial_uw_assumptions_updated_at
  BEFORE UPDATE ON commercial_uw_assumptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE commercial_uw_assumptions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access on commercial_uw_assumptions"
  ON commercial_uw_assumptions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Authenticated users can read (needed by the UW model)
CREATE POLICY "Authenticated users can read commercial_uw_assumptions"
  ON commercial_uw_assumptions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed default assumptions for each property type
INSERT INTO commercial_uw_assumptions (property_type, vacancy_pct, stabilized_vacancy_pct, bad_debt_pct, mgmt_fee_pct, rent_growth_yr1, rent_growth_yr2, rent_growth_yr3, rent_growth_yr4, rent_growth_yr5, expense_growth_yr1, expense_growth_yr2, expense_growth_yr3, expense_growth_yr4, expense_growth_yr5, going_in_cap_rate, exit_cap_rate, disposition_cost_pct)
VALUES
  ('multifamily',       5,  5,   1, 8, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 5.5, 6.0, 2),
  ('office',            10, 8,   1, 8, 2, 2, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 7.0, 7.5, 2),
  ('retail',            8,  6,   1, 8, 2, 2, 2.5, 2.5, 2.5, 2, 2, 2, 2, 2, 6.5, 7.0, 2),
  ('industrial',        5,  5,   0.5, 6, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 5.5, 6.0, 1.5),
  ('self_storage',      10, 8,   1, 8, 3, 3, 3, 3, 3, 2.5, 2.5, 2.5, 2.5, 2.5, 6.0, 6.5, 2),
  ('hospitality',       30, 25,  2, 10, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 8.0, 8.5, 2.5),
  ('healthcare',        5,  5,   0.5, 6, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 7.0, 7.5, 2),
  ('mobile_home_park',  5,  5,   1, 8, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 6.0, 6.5, 2),
  ('rv_campground',     25, 20,  1.5, 10, 3, 3, 3, 3, 3, 2.5, 2.5, 2.5, 2.5, 2.5, 7.5, 8.0, 2),
  ('marina',            10, 8,   1, 8, 2.5, 2.5, 2.5, 2.5, 2.5, 2, 2, 2, 2, 2, 7.0, 7.5, 2),
  ('vacation_rental',   30, 25,  2, 10, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 8.0, 8.5, 2.5),
  ('mixed_use',         8,  6,   1, 8, 2.5, 2.5, 2.5, 2.5, 2.5, 2, 2, 2, 2, 2, 6.5, 7.0, 2),
  ('warehouse',         5,  5,   0.5, 6, 2.5, 2.5, 2.5, 2.5, 2.5, 2, 2, 2, 2, 2, 6.0, 6.5, 1.5),
  ('specialty',         10, 8,   1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 8.0, 8.5, 2),
  ('other',             10, 8,   1, 8, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 7.5, 8.0, 2)
ON CONFLICT (property_type) DO NOTHING;

COMMENT ON TABLE commercial_uw_assumptions IS 'Default underwriting assumptions by commercial property type. Managed via Control Center.';
