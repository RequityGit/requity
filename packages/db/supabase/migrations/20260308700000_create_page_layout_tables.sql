-- Page Layout Manager: sections + field assignments for Contact and Company detail pages
-- This replaces the previous page_layouts system that was dropped in 20260308500000.

-- ============================================================================
-- Table: page_layout_sections
-- Defines sections displayed on a page (e.g. "Borrower Profile", "Address")
-- ============================================================================
CREATE TABLE public.page_layout_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  section_key TEXT NOT NULL,
  section_label TEXT NOT NULL,
  section_icon TEXT NOT NULL DEFAULT 'file-text',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  visibility_rule TEXT DEFAULT NULL,
  sidebar BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_type, section_key)
);

-- ============================================================================
-- Table: page_layout_fields
-- Assigns fields to sections with ordering and column position
-- ============================================================================
CREATE TABLE public.page_layout_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.page_layout_sections(id) ON DELETE CASCADE,
  field_config_id UUID REFERENCES public.field_configurations(id) ON DELETE SET NULL,
  field_key TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  column_position TEXT NOT NULL DEFAULT 'left',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(section_id, field_key)
);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE public.page_layout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_layout_fields ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users (needed to render detail pages)
CREATE POLICY "Authenticated users can read page layout sections"
  ON public.page_layout_sections FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can read page layout fields"
  ON public.page_layout_fields FOR SELECT
  TO authenticated USING (true);

-- Write: super_admin only
CREATE POLICY "Super admins can insert page layout sections"
  ON public.page_layout_sections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can update page layout sections"
  ON public.page_layout_sections FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can delete page layout sections"
  ON public.page_layout_sections FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can insert page layout fields"
  ON public.page_layout_fields FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can update page layout fields"
  ON public.page_layout_fields FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'super_admin' AND is_active = true
    )
  );

CREATE POLICY "Super admins can delete page layout fields"
  ON public.page_layout_fields FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (SELECT auth.uid())
        AND role = 'super_admin' AND is_active = true
    )
  );

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_page_layout_sections_page_type ON public.page_layout_sections(page_type);
CREATE INDEX idx_page_layout_fields_section_id ON public.page_layout_fields(section_id);

-- ============================================================================
-- Seed: Contact Detail Page Sections
-- ============================================================================
INSERT INTO public.page_layout_sections (page_type, section_key, section_label, section_icon, display_order, is_visible, is_locked, visibility_rule, sidebar) VALUES
  ('contact_detail', 'borrower_summary', 'Borrower Summary', 'landmark', 0, true, true, 'has_borrower', false),
  ('contact_detail', 'investor_summary', 'Investor Summary', 'trending-up', 1, true, true, 'has_investor', false),
  ('contact_detail', 'borrower_profile', 'Borrower Profile', 'user-circle', 2, true, true, 'has_borrower', false),
  ('contact_detail', 'investor_profile', 'Investor Profile', 'shield', 3, true, true, 'has_investor', false),
  ('contact_detail', 'contact_profile', 'Contact Profile', 'contact', 4, true, true, NULL, false),
  ('contact_detail', 'description', 'Description', 'file-text', 5, true, false, NULL, false),
  ('contact_detail', 'quick_actions', 'Quick Actions', 'zap', 0, true, true, NULL, true),
  ('contact_detail', 'followers', 'Followers', 'users', 1, true, false, NULL, true),
  ('contact_detail', 'relationships', 'Relationships', 'link', 2, true, false, NULL, true),
  ('contact_detail', 'communication', 'Communication', 'message-circle', 3, true, false, NULL, true),
  ('contact_detail', 'system_info', 'System Info', 'info', 4, true, true, NULL, true);

-- ============================================================================
-- Seed: Company Detail Page Sections
-- ============================================================================
INSERT INTO public.page_layout_sections (page_type, section_key, section_label, section_icon, display_order, is_visible, is_locked, visibility_rule, sidebar) VALUES
  ('company_detail', 'lender_performance', 'Lender Performance', 'trending-up', 0, true, true, 'is_lender', false),
  ('company_detail', 'company_information', 'Company Information', 'building-2', 1, true, true, NULL, false),
  ('company_detail', 'address', 'Address', 'map-pin', 2, true, true, NULL, false),
  ('company_detail', 'lender_details', 'Lender Details', 'target', 3, true, true, 'is_lender', false),
  ('company_detail', 'capabilities_coverage', 'Capabilities & Coverage', 'target', 4, true, false, 'not_lender', false),
  ('company_detail', 'agreements', 'Agreements', 'file-text', 5, true, false, NULL, false),
  ('company_detail', 'wire_instructions', 'Wire Instructions', 'credit-card', 6, true, false, 'has_wire', false),
  ('company_detail', 'description', 'Description', 'file-text', 7, true, false, NULL, false),
  ('company_detail', 'quick_actions', 'Quick Actions', 'zap', 0, true, true, NULL, true),
  ('company_detail', 'followers', 'Followers', 'users', 1, true, false, NULL, true),
  ('company_detail', 'key_contacts', 'Key Contacts', 'contact', 2, true, false, NULL, true),
  ('company_detail', 'document_status', 'Document Status', 'file-check', 3, true, false, NULL, true),
  ('company_detail', 'system_info', 'System Info', 'info', 4, true, true, NULL, true);

-- ============================================================================
-- Seed: Contact Detail Field Assignments
-- Link fields from field_configurations to their sections.
-- Uses a DO block to look up section IDs and field_config IDs dynamically.
-- ============================================================================
DO $$
DECLARE
  v_section_id UUID;
  v_field_id UUID;
BEGIN
  -- Contact Profile section fields
  SELECT id INTO v_section_id FROM public.page_layout_sections WHERE page_type = 'contact_detail' AND section_key = 'contact_profile';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.page_layout_fields (section_id, field_config_id, field_key, display_order, column_position)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, fc.column_position
    FROM public.field_configurations fc
    WHERE fc.module = 'contact_profile' AND fc.is_archived = false
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- Borrower Profile section fields
  SELECT id INTO v_section_id FROM public.page_layout_sections WHERE page_type = 'contact_detail' AND section_key = 'borrower_profile';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.page_layout_fields (section_id, field_config_id, field_key, display_order, column_position)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, fc.column_position
    FROM public.field_configurations fc
    WHERE fc.module = 'borrower_profile' AND fc.is_archived = false
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- Investor Profile section fields
  SELECT id INTO v_section_id FROM public.page_layout_sections WHERE page_type = 'contact_detail' AND section_key = 'investor_profile';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.page_layout_fields (section_id, field_config_id, field_key, display_order, column_position)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, fc.column_position
    FROM public.field_configurations fc
    WHERE fc.module = 'investor_profile' AND fc.is_archived = false
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- Company Information section fields
  SELECT id INTO v_section_id FROM public.page_layout_sections WHERE page_type = 'company_detail' AND section_key = 'company_information';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.page_layout_fields (section_id, field_config_id, field_key, display_order, column_position)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, fc.column_position
    FROM public.field_configurations fc
    WHERE fc.module = 'company_info' AND fc.is_archived = false
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;

  -- Wire Instructions section fields
  SELECT id INTO v_section_id FROM public.page_layout_sections WHERE page_type = 'company_detail' AND section_key = 'wire_instructions';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.page_layout_fields (section_id, field_config_id, field_key, display_order, column_position)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, fc.column_position
    FROM public.field_configurations fc
    WHERE fc.module = 'wire_instructions' AND fc.is_archived = false
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;
END $$;
