-- ============================================================
-- user_email_templates: Admin-managed templates for user-composed emails
-- ============================================================
CREATE TABLE public.user_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',

  -- Template Content
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,

  -- Merge Field Metadata
  available_variables JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  context TEXT NOT NULL DEFAULT 'any',
  sort_order INTEGER DEFAULT 0,

  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1
);

-- Indexes
CREATE INDEX idx_user_email_templates_active ON public.user_email_templates(is_active, category);
CREATE INDEX idx_user_email_templates_slug ON public.user_email_templates(slug);

-- ============================================================
-- user_email_template_versions: Version history for audit trail
-- ============================================================
CREATE TABLE public.user_email_template_versions (
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

CREATE INDEX idx_user_email_template_versions ON public.user_email_template_versions(template_id, version DESC);

-- ============================================================
-- user_email_sends: Track when user templates are used (analytics)
-- ============================================================
CREATE TABLE public.user_email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template_id UUID REFERENCES public.user_email_templates(id),
  sent_by UUID REFERENCES auth.users(id),
  crm_email_id UUID REFERENCES public.crm_emails(id),
  linked_loan_id UUID,
  linked_contact_id UUID,
  merge_data_snapshot JSONB,
  template_version INTEGER
);

CREATE INDEX idx_user_email_sends_template ON public.user_email_sends(template_id, created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.user_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_sends ENABLE ROW LEVEL SECURITY;

-- All authenticated internal users can READ active templates
CREATE POLICY "Authenticated users can read active templates"
  ON public.user_email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only super_admin can INSERT/UPDATE/DELETE templates
CREATE POLICY "Super admins can manage templates"
  ON public.user_email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  );

-- Version history readable by authenticated users
CREATE POLICY "Authenticated users can read template versions"
  ON public.user_email_template_versions FOR SELECT
  TO authenticated
  USING (true);

-- Super admins can insert versions
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

-- Any authenticated user can log sends
CREATE POLICY "Authenticated users can log sends"
  ON public.user_email_sends FOR INSERT
  TO authenticated
  WITH CHECK (sent_by = (SELECT auth.uid()));

CREATE POLICY "Authenticated users can read own sends"
  ON public.user_email_sends FOR SELECT
  TO authenticated
  USING (sent_by = (SELECT auth.uid()));

-- Super admins can read all sends
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

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_user_email_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_email_template_timestamp
  BEFORE UPDATE ON public.user_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_user_email_template_timestamp();
