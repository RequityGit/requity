-- Add sandbox support to loan_underwriting_versions and models module

-- 1. Add is_sandbox column first (needed for constraint)
ALTER TABLE public.loan_underwriting_versions
  ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT false;

-- 2. Drop existing constraint and add new one that allows sandbox
ALTER TABLE public.loan_underwriting_versions
  DROP CONSTRAINT IF EXISTS chk_loan_or_opportunity;

ALTER TABLE public.loan_underwriting_versions
  ADD CONSTRAINT chk_loan_or_opportunity_or_sandbox
  CHECK (loan_id IS NOT NULL OR opportunity_id IS NOT NULL OR is_sandbox = true);

-- 3. Add computation_status for persisted diagnostics
ALTER TABLE public.loan_underwriting_versions
  ADD COLUMN IF NOT EXISTS computation_status TEXT DEFAULT 'empty';

-- 4. Add input_completeness JSONB for persisted diagnostic summary
ALTER TABLE public.loan_underwriting_versions
  ADD COLUMN IF NOT EXISTS input_completeness JSONB DEFAULT '{}';

-- 5. Add 'models' module for sidebar access control
INSERT INTO public.modules (name, label, icon, description, route_prefix, sort_order)
VALUES ('models', 'Models', 'FlaskConical', 'Underwriting model sandbox and diagnostics', '/admin/models', 25)
ON CONFLICT (name) DO NOTHING;

-- 6. Grant models module to all existing users who have pipeline access
INSERT INTO public.user_module_access (user_id, module_id, granted_by)
SELECT uma.user_id, m.id, uma.granted_by
FROM public.user_module_access uma
JOIN public.modules pm ON pm.id = uma.module_id AND pm.name = 'pipeline'
CROSS JOIN public.modules m
WHERE m.name = 'models'
ON CONFLICT (user_id, module_id) DO NOTHING;

-- 7. Index for sandbox queries
CREATE INDEX IF NOT EXISTS idx_uw_versions_sandbox ON public.loan_underwriting_versions (is_sandbox, created_by, model_type) WHERE is_sandbox = true;
