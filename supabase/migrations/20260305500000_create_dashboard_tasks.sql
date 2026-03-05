-- Dashboard tasks table for the action dashboard
CREATE TABLE IF NOT EXISTS public.dashboard_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id uuid REFERENCES public.loans(id) ON DELETE SET NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('underwriting', 'document', 'inspection', 'closing')),
  due_date date NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_user_due
  ON public.dashboard_tasks (user_id, due_date)
  WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_dashboard_tasks_user_completed
  ON public.dashboard_tasks (user_id, is_completed, completed_at);

ALTER TABLE public.dashboard_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all dashboard tasks"
  ON public.dashboard_tasks FOR ALL
  USING ((select auth.uid()) IN (SELECT ur.user_id FROM public.user_roles ur WHERE ur.role IN ('admin', 'super_admin')));

CREATE POLICY "Users can view own dashboard tasks"
  ON public.dashboard_tasks FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own dashboard tasks"
  ON public.dashboard_tasks FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own dashboard tasks"
  ON public.dashboard_tasks FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE OR REPLACE VIEW public.dashboard_tasks_view AS
SELECT
  t.*,
  l.property_address AS loan_name,
  l.loan_number,
  CASE WHEN t.due_date < CURRENT_DATE AND t.is_completed = false THEN true ELSE false END AS is_past_due,
  CASE WHEN t.due_date < CURRENT_DATE AND t.is_completed = false
    THEN (CURRENT_DATE - t.due_date)::int
    ELSE NULL
  END AS days_overdue
FROM public.dashboard_tasks t
LEFT JOIN public.loans l ON l.id = t.loan_id;
