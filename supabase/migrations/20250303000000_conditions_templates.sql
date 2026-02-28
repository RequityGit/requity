-- =============================================================================
-- Loan Conditions & Template System Migration
-- =============================================================================
-- Creates the condition_templates, condition_template_items, and
-- loan_conditions tables for the loan processing condition tracking system.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. CONDITION TEMPLATES (loan-type-based templates)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.condition_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  loan_type text,
  description text,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_condition_templates_updated_at
  BEFORE UPDATE ON public.condition_templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.condition_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select condition_templates"
  ON public.condition_templates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert condition_templates"
  ON public.condition_templates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update condition_templates"
  ON public.condition_templates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete condition_templates"
  ON public.condition_templates FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------------------
-- 2. CONDITION TEMPLATE ITEMS (items within a template)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.condition_template_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.condition_templates(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  borrower_description text,
  category text NOT NULL CHECK (category IN ('pta', 'ptf')),
  responsible_party text DEFAULT 'borrower' CHECK (responsible_party IN (
    'borrower', 'broker', 'title_company', 'insurance_agent', 'internal', 'attorney', 'other'
  )),
  due_date_offset_days int DEFAULT 5,
  is_critical_path boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_condition_template_items_template_id
  ON public.condition_template_items(template_id);

ALTER TABLE public.condition_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select condition_template_items"
  ON public.condition_template_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert condition_template_items"
  ON public.condition_template_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update condition_template_items"
  ON public.condition_template_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete condition_template_items"
  ON public.condition_template_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------------------
-- 3. LOAN CONDITIONS (per-loan conditions, instantiated from templates or added manually)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_conditions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  template_item_id uuid REFERENCES public.condition_template_items(id),
  name text NOT NULL,
  description text,
  borrower_description text,
  category text NOT NULL CHECK (category IN ('pta', 'ptf')),
  status text DEFAULT 'not_requested' CHECK (status IN (
    'not_requested', 'requested', 'received', 'under_review', 'approved', 'waived', 'rejected'
  )),
  responsible_party text DEFAULT 'borrower' CHECK (responsible_party IN (
    'borrower', 'broker', 'title_company', 'insurance_agent', 'internal', 'attorney', 'other'
  )),
  is_critical_path boolean DEFAULT false,
  sort_order int DEFAULT 0,
  -- Dates
  requested_date date,
  due_date date,
  received_date date,
  approved_date date,
  -- Approval info
  approved_by uuid REFERENCES public.profiles(id),
  waived_by uuid REFERENCES public.profiles(id),
  rejection_reason text,
  -- Notes
  internal_note text,
  borrower_note text,
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

-- ---------------------------------------------------------------------------
-- 4. LOAN CONDITION DOCUMENTS (files attached to conditions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_condition_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  condition_id uuid REFERENCES public.loan_conditions(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_condition_documents_condition_id
  ON public.loan_condition_documents(condition_id);

ALTER TABLE public.loan_condition_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage loan_condition_documents"
  ON public.loan_condition_documents FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Borrowers can view own loan_condition_documents"
  ON public.loan_condition_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loan_conditions lc
    JOIN public.loans l ON l.id = lc.loan_id
    WHERE lc.id = loan_condition_documents.condition_id
    AND l.borrower_id = auth.uid()
  ));
