-- ==========================================================================
-- Lender Quote Tracker — lender_quotes + lender_quote_activities
-- Tracks lender quotes for brokered deals (linked to loans)
-- ==========================================================================

-- ── 1. lender_quotes table ────────────────────────────────────────────────

CREATE TABLE public.lender_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Identification
  quote_name TEXT NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'request_for_quote'
    CHECK (status IN (
      'request_for_quote',
      'term_sheet_unsigned',
      'term_sheet_accepted',
      'declined',
      'complete'
    )),
  status_changed_at TIMESTAMPTZ DEFAULT now(),

  -- Relationships
  loan_id UUID REFERENCES public.loans(id),
  lender_company_id UUID REFERENCES public.companies(id),
  lender_contact_name TEXT,
  linked_property_id UUID,

  -- Loan Terms
  loan_amount NUMERIC(15,2),
  interest_rate NUMERIC(6,4),
  loan_term_months INTEGER,
  interest_only_period_months INTEGER,
  ltv NUMERIC(6,4),
  amortization_months INTEGER,

  -- Fees
  origination_fee NUMERIC(6,4),
  uw_processing_fee NUMERIC(12,2),
  requity_lending_fee NUMERIC(6,4),

  -- Prepayment / Yield Maintenance
  prepayment_penalty TEXT,
  ym_spread NUMERIC(6,4),
  ym_amount NUMERIC(12,2) DEFAULT 0.00,

  -- Documents & Notes
  term_sheet_url TEXT,
  description TEXT,

  -- Tracking
  requested_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  declined_reason TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_lender_quotes_loan ON public.lender_quotes(loan_id);
CREATE INDEX idx_lender_quotes_status ON public.lender_quotes(status);
CREATE INDEX idx_lender_quotes_lender ON public.lender_quotes(lender_company_id);

-- Updated_at trigger (reuse existing set_updated_at function)
CREATE TRIGGER set_lender_quotes_updated_at
  BEFORE UPDATE ON public.lender_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.lender_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage lender quotes"
  ON public.lender_quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 2. lender_quote_activities table ──────────────────────────────────────

CREATE TABLE public.lender_quote_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  quote_id UUID NOT NULL REFERENCES public.lender_quotes(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN (
      'status_change',
      'note',
      'email',
      'call',
      'document_uploaded'
    )),
  description TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_quote_activities_quote ON public.lender_quote_activities(quote_id);

ALTER TABLE public.lender_quote_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage quote activities"
  ON public.lender_quote_activities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
