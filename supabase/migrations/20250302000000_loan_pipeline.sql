-- =============================================================================
-- Loan Processing Pipeline Migration
-- =============================================================================
-- Updates the loans table with new pipeline stages and fields, and creates
-- the loan_activity_log table for audit trail tracking.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. UPDATE LOAN STAGES
-- ---------------------------------------------------------------------------
-- New pipeline: lead → application → processing → underwriting → approved →
--               clear_to_close → funded → servicing → payoff → default → reo → paid_off
--
-- We need to drop the existing check constraint, migrate existing data, and
-- add the new constraint.

-- Drop old check constraint on stage
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_stage_check;

-- Migrate existing stage values to new pipeline stages
UPDATE public.loans SET stage = 'processing' WHERE stage = 'docs_out';
UPDATE public.loans SET stage = 'clear_to_close' WHERE stage = 'closed';

-- Add new check constraint with updated stages
ALTER TABLE public.loans ADD CONSTRAINT loans_stage_check
  CHECK (stage IN (
    'lead', 'application', 'processing', 'underwriting', 'approved',
    'clear_to_close', 'funded', 'servicing', 'payoff', 'default', 'reo', 'paid_off'
  ));

-- ---------------------------------------------------------------------------
-- 2. ADD NEW FIELDS TO LOANS TABLE
-- ---------------------------------------------------------------------------

-- Loan type: add 'dscr' to the check constraint
ALTER TABLE public.loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
ALTER TABLE public.loans ADD CONSTRAINT loans_loan_type_check
  CHECK (loan_type IN (
    'bridge_residential', 'bridge_commercial', 'fix_and_flip',
    'ground_up', 'stabilized', 'dscr', 'other'
  ));

-- Team assignments (reference profiles by UUID)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS processor_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS underwriter_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS closer_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS originator_id uuid REFERENCES public.profiles(id);

-- Priority flag
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal'
  CHECK (priority IN ('hot', 'normal', 'on_hold'));

-- Next action / blocker
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS next_action text;

-- Expected close date
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS expected_close_date date;

-- Purchase price and ARV for LTV calculations
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS purchase_price numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS arv numeric;

-- Points / fees
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS points numeric;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS origination_fee numeric;

-- Extension and prepayment terms
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS extension_options text;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS prepayment_terms text;

-- Application and approval dates
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS application_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS approval_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS actual_close_date date;

-- Soft delete
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_loans_processor_id ON public.loans(processor_id);
CREATE INDEX IF NOT EXISTS idx_loans_underwriter_id ON public.loans(underwriter_id);
CREATE INDEX IF NOT EXISTS idx_loans_closer_id ON public.loans(closer_id);
CREATE INDEX IF NOT EXISTS idx_loans_originator_id ON public.loans(originator_id);
CREATE INDEX IF NOT EXISTS idx_loans_priority ON public.loans(priority);
CREATE INDEX IF NOT EXISTS idx_loans_stage ON public.loans(stage);
CREATE INDEX IF NOT EXISTS idx_loans_expected_close_date ON public.loans(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON public.loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON public.loans(borrower_id);

-- ---------------------------------------------------------------------------
-- 3. LOAN ACTIVITY LOG TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id uuid REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id),
  activity_type text NOT NULL CHECK (activity_type IN (
    'stage_change', 'note_added', 'document_uploaded', 'condition_status_change',
    'assignment_change', 'terms_modified', 'loan_created', 'message_sent',
    'priority_change', 'field_updated'
  )),
  description text NOT NULL,
  -- For stage changes
  old_value text,
  new_value text,
  -- For field changes
  field_name text,
  -- Additional metadata as JSON
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for activity log
CREATE INDEX IF NOT EXISTS idx_loan_activity_log_loan_id ON public.loan_activity_log(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_activity_log_user_id ON public.loan_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_activity_log_activity_type ON public.loan_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_loan_activity_log_created_at ON public.loan_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.loan_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for loan_activity_log
CREATE POLICY "Admins can select loan_activity_log"
  ON public.loan_activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert loan_activity_log"
  ON public.loan_activity_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update loan_activity_log"
  ON public.loan_activity_log FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete loan_activity_log"
  ON public.loan_activity_log FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Borrowers can see activity on their own loans
CREATE POLICY "Borrowers can view own loan activity"
  ON public.loan_activity_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = loan_activity_log.loan_id
    AND loans.borrower_id = auth.uid()
  ));
