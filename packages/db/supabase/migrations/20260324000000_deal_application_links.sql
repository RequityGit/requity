-- Deal Application Links: token-based public access to loan application forms
-- Mirrors the secure_upload_links pattern but for form-based applications

-- 1. Create deal_application_links table
CREATE TABLE IF NOT EXISTS public.deal_application_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.unified_deals(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.form_definitions(id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  label text,
  message text,
  prefill_data jsonb DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'completed')),
  revoked_at timestamptz,
  completed_at timestamptz,
  submission_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_deal_app_links_token ON public.deal_application_links(token);
CREATE INDEX idx_deal_app_links_deal_id ON public.deal_application_links(deal_id);
CREATE INDEX idx_deal_app_links_status ON public.deal_application_links(status);

-- RLS
ALTER TABLE public.deal_application_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on deal_application_links"
  ON public.deal_application_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('super_admin', 'admin')
        AND user_roles.is_active = true
    )
  );

-- 2. Add deal_id and deal_application_link_id to form_submissions
ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS deal_id uuid REFERENCES public.unified_deals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deal_application_link_id uuid REFERENCES public.deal_application_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_form_submissions_deal_id ON public.form_submissions(deal_id);

-- 3. Add FK from deal_application_links.submission_id to form_submissions
ALTER TABLE public.deal_application_links
  ADD CONSTRAINT fk_deal_app_links_submission
  FOREIGN KEY (submission_id) REFERENCES public.form_submissions(id) ON DELETE SET NULL;

COMMENT ON TABLE public.deal_application_links IS 'Token-based links allowing borrowers to complete loan application forms tied to specific deals';
COMMENT ON COLUMN public.deal_application_links.token IS 'UUID token used in public URL for unauthenticated access';
COMMENT ON COLUMN public.deal_application_links.prefill_data IS 'JSONB of field values to pre-populate the form from deal/contact data';
COMMENT ON COLUMN public.deal_application_links.submission_id IS 'Links to the form_submissions record once borrower starts/completes the form';
