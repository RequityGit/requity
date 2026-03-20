-- ============================================================================
-- Model Scenarios: versioned underwriting workspaces created from the Models section
-- ============================================================================
-- A scenario is a named container that groups underwriting versions together.
-- Scenarios can be standalone (model exploration) or linked to a deal/opportunity.
-- When linked, versions appear both in the model workspace AND the deal's UW tab.

CREATE TABLE IF NOT EXISTS public.model_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Identity
  name text NOT NULL,
  description text,
  model_type text NOT NULL CHECK (model_type IN ('commercial', 'rtl', 'dscr')),

  -- Ownership
  created_by uuid NOT NULL REFERENCES public.profiles(id),

  -- Deal linking (nullable — a scenario can exist standalone)
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,

  -- Status tracking
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),

  -- The version that is currently "active" for this scenario
  active_version_id uuid,

  -- Soft delete
  deleted_at timestamptz
);

-- Indexes
CREATE INDEX idx_model_scenarios_model_type ON public.model_scenarios(model_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_model_scenarios_created_by ON public.model_scenarios(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_model_scenarios_opportunity ON public.model_scenarios(opportunity_id) WHERE opportunity_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_model_scenarios_loan ON public.model_scenarios(loan_id) WHERE loan_id IS NOT NULL AND deleted_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER set_updated_at_model_scenarios
  BEFORE UPDATE ON public.model_scenarios
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.model_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on model_scenarios"
  ON public.model_scenarios
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================================
-- Add scenario_id FK to loan_underwriting_versions
-- ============================================================================

ALTER TABLE public.loan_underwriting_versions
  ADD COLUMN IF NOT EXISTS scenario_id uuid REFERENCES public.model_scenarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_uw_versions_scenario
  ON public.loan_underwriting_versions(scenario_id)
  WHERE scenario_id IS NOT NULL;

-- Update the constraint to also allow scenario-linked versions
ALTER TABLE public.loan_underwriting_versions
  DROP CONSTRAINT IF EXISTS chk_loan_or_opportunity_or_sandbox;

ALTER TABLE public.loan_underwriting_versions
  ADD CONSTRAINT chk_loan_or_opportunity_or_sandbox_or_scenario
  CHECK (
    loan_id IS NOT NULL
    OR opportunity_id IS NOT NULL
    OR is_sandbox = true
    OR scenario_id IS NOT NULL
  );

-- ============================================================================
-- Add the active_version_id FK (deferred to allow circular reference)
-- ============================================================================
ALTER TABLE public.model_scenarios
  ADD CONSTRAINT fk_active_version
  FOREIGN KEY (active_version_id)
  REFERENCES public.loan_underwriting_versions(id)
  ON DELETE SET NULL;
