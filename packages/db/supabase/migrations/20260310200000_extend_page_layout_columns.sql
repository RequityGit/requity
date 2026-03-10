-- Extend page_layout_sections with additional columns for the Object Manager
-- These columns support section types, tab grouping, and default collapse state.

-- Section type: fields, relationship, computed, proforma, system
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS section_type TEXT NOT NULL DEFAULT 'fields';

-- Default collapsed state
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS default_collapsed BOOLEAN NOT NULL DEFAULT false;

-- Tab grouping columns
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS tab_key TEXT DEFAULT NULL;
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS tab_label TEXT DEFAULT NULL;
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS tab_icon TEXT DEFAULT NULL;
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS tab_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS tab_locked BOOLEAN NOT NULL DEFAULT false;

-- Optional FK references for computed/relationship sections
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS relationship_id UUID DEFAULT NULL;
ALTER TABLE public.page_layout_sections
  ADD COLUMN IF NOT EXISTS card_type_id UUID DEFAULT NULL;

-- Extend page_layout_fields with column_span and source tracking
ALTER TABLE public.page_layout_fields
  ADD COLUMN IF NOT EXISTS column_span TEXT NOT NULL DEFAULT 'half';
ALTER TABLE public.page_layout_fields
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'native';
ALTER TABLE public.page_layout_fields
  ADD COLUMN IF NOT EXISTS source_object_key TEXT DEFAULT NULL;

-- ============================================================================
-- Set section_type for existing sidebar sections (they are system-managed)
-- ============================================================================
UPDATE public.page_layout_sections
  SET section_type = 'system'
  WHERE sidebar = true AND section_key IN (
    'quick_actions', 'followers', 'relationships', 'communication',
    'system_info', 'key_contacts', 'document_status'
  );

-- Set section_type for summary sections (system-managed computed summaries)
UPDATE public.page_layout_sections
  SET section_type = 'system'
  WHERE section_key IN ('borrower_summary', 'investor_summary', 'lender_performance');

-- ============================================================================
-- Assign all existing sections to the "overview" tab
-- ============================================================================
UPDATE public.page_layout_sections
  SET tab_key = 'overview',
      tab_label = 'Overview',
      tab_icon = 'panel-right',
      tab_order = 0,
      tab_locked = true
  WHERE tab_key IS NULL;
