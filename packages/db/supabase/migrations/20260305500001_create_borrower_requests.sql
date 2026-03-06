-- Borrower requests tracking for the action dashboard
CREATE TABLE IF NOT EXISTS public.borrower_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  borrower_name text NOT NULL,
  description text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  follow_up_count int DEFAULT 0,
  last_follow_up_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_borrower_requests_user
  ON public.borrower_requests (requested_by)
  WHERE resolved_at IS NULL;

ALTER TABLE public.borrower_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all borrower requests"
  ON public.borrower_requests FOR ALL
  USING ((select auth.uid()) IN (SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'super_admin')));

CREATE POLICY "Users can view own borrower requests"
  ON public.borrower_requests FOR SELECT
  USING ((select auth.uid()) = requested_by);

CREATE POLICY "Users can manage own borrower requests"
  ON public.borrower_requests FOR ALL
  USING ((select auth.uid()) = requested_by);

CREATE OR REPLACE VIEW public.borrower_requests_view AS
SELECT
  r.*,
  l.property_address AS loan_name,
  l.loan_number,
  (CURRENT_DATE - r.sent_at::date)::int AS days_since_sent,
  CASE
    WHEN (CURRENT_DATE - r.sent_at::date)::int >= 5 THEN 'overdue'
    WHEN (CURRENT_DATE - r.sent_at::date)::int >= 3 THEN 'warning'
    ELSE 'pending'
  END AS status
FROM public.borrower_requests r
LEFT JOIN public.loans l ON l.id = r.loan_id
WHERE r.resolved_at IS NULL;
