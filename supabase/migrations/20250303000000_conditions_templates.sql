-- =============================================================================
-- Loan Conditions & Template System Migration
-- =============================================================================
-- Creates the loan_condition_templates and loan_conditions tables
-- for the loan processing condition tracking system.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Custom ENUM types
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE condition_status AS ENUM (
    'pending', 'submitted', 'under_review', 'approved', 'waived', 'not_applicable', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE condition_category AS ENUM (
    'borrower_documents', 'non_us_citizen', 'entity_documents', 'deal_level_items',
    'appraisal_request', 'title_fraud_protection', 'lender_package', 'insurance_request',
    'title_request', 'fundraising', 'closing_prep', 'post_closing_items',
    'note_sell_process', 'post_loan_payoff', 'prior_to_approval', 'prior_to_funding'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE condition_stage AS ENUM (
    'processing', 'closed_onboarding', 'note_sell_process', 'post_loan_payoff'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 1. LOAN CONDITION TEMPLATES (flat table — one row per condition template)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_condition_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  condition_name text NOT NULL,
  is_active boolean DEFAULT true,
  applies_to_commercial boolean DEFAULT false,
  applies_to_dscr boolean DEFAULT false,
  applies_to_guc boolean DEFAULT false,
  applies_to_rtl boolean DEFAULT false,
  applies_to_transactional boolean DEFAULT false,
  required_stage text NOT NULL DEFAULT 'processing',
  category text NOT NULL DEFAULT 'borrower_documents',
  internal_description text,
  sort_order int DEFAULT 0,
  borrower_description text,
  responsible_party text DEFAULT 'borrower',
  critical_path_item boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_loan_condition_templates_updated_at
  BEFORE UPDATE ON public.loan_condition_templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.loan_condition_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select loan_condition_templates"
  ON public.loan_condition_templates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert loan_condition_templates"
  ON public.loan_condition_templates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update loan_condition_templates"
  ON public.loan_condition_templates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete loan_condition_templates"
  ON public.loan_condition_templates FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------------------
-- 2. LOAN CONDITIONS (per-loan conditions, instantiated from templates or added manually)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_conditions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.loan_condition_templates(id),
  condition_name text NOT NULL,
  category text NOT NULL DEFAULT 'borrower_documents',
  required_stage text NOT NULL DEFAULT 'processing',
  status text DEFAULT 'pending',
  internal_description text,
  borrower_description text,
  responsible_party text DEFAULT 'borrower',
  critical_path_item boolean DEFAULT false,
  is_required boolean DEFAULT true,
  sort_order int DEFAULT 0,
  -- Notes
  notes text,
  -- Documents
  document_url text,
  document_urls text[],
  -- Dates
  due_date date,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_loan_conditions_updated_at
  BEFORE UPDATE ON public.loan_conditions
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_loan_conditions_loan_id ON public.loan_conditions(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_conditions_status ON public.loan_conditions(status);
CREATE INDEX IF NOT EXISTS idx_loan_conditions_category ON public.loan_conditions(category);
CREATE INDEX IF NOT EXISTS idx_loan_conditions_due_date ON public.loan_conditions(due_date);
CREATE INDEX IF NOT EXISTS idx_loan_conditions_responsible_party ON public.loan_conditions(responsible_party);

ALTER TABLE public.loan_conditions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can select loan_conditions"
  ON public.loan_conditions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert loan_conditions"
  ON public.loan_conditions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update loan_conditions"
  ON public.loan_conditions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete loan_conditions"
  ON public.loan_conditions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Borrowers can see conditions on their own loans
CREATE POLICY "Borrowers can view own loan conditions"
  ON public.loan_conditions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = loan_conditions.loan_id
    AND loans.borrower_id = auth.uid()
  ));
