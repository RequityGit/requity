-- Fix user_email_templates: rename columns to match code expectations
ALTER TABLE public.user_email_templates RENAME COLUMN subject_line TO subject_template;
ALTER TABLE public.user_email_templates RENAME COLUMN html_body TO body_template;
ALTER TABLE public.user_email_templates DROP COLUMN IF EXISTS text_body;

-- Add missing columns
ALTER TABLE public.user_email_templates ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_email_templates ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create user_email_template_versions table
CREATE TABLE IF NOT EXISTS public.user_email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template_id UUID NOT NULL REFERENCES public.user_email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  available_variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  changed_by UUID REFERENCES auth.users(id),
  change_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_email_template_versions ON public.user_email_template_versions(template_id, version DESC);

-- Create user_email_sends table
CREATE TABLE IF NOT EXISTS public.user_email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template_id UUID REFERENCES public.user_email_templates(id),
  sent_by UUID REFERENCES auth.users(id),
  crm_email_id UUID,
  linked_loan_id UUID,
  linked_contact_id UUID,
  merge_data_snapshot JSONB,
  template_version INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_email_sends_template ON public.user_email_sends(template_id, created_at DESC);

-- RLS for user_email_template_versions
ALTER TABLE public.user_email_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read template versions"
  ON public.user_email_template_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert template versions"
  ON public.user_email_template_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  );

-- RLS for user_email_sends
ALTER TABLE public.user_email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can log sends"
  ON public.user_email_sends FOR INSERT
  TO authenticated
  WITH CHECK (sent_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can read own sends"
  ON public.user_email_sends FOR SELECT
  TO authenticated
  USING (sent_by = (SELECT auth.uid()));

CREATE POLICY "Super admins can read all sends"
  ON public.user_email_sends FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  );
