-- Add borrower_entity section to contact_detail page layout
-- This allows the Contact detail page to show entity fields for borrower contacts

-- Bump description section display_order to make room
UPDATE public.page_layout_sections
SET display_order = 6
WHERE page_type = 'contact_detail' AND section_key = 'description';

-- Insert borrower_entity section
INSERT INTO public.page_layout_sections
  (page_type, section_key, section_label, section_icon, display_order, is_visible, is_locked, visibility_rule, sidebar, section_type)
VALUES
  ('contact_detail', 'borrower_entity', 'Borrower Entity', 'building-2', 5, true, false, 'has_borrower', false, 'fields')
ON CONFLICT (page_type, section_key) DO NOTHING;

-- Seed borrower_entity fields into the new section from field_configurations
DO $$
DECLARE
  v_section_id UUID;
BEGIN
  SELECT id INTO v_section_id
  FROM public.page_layout_sections
  WHERE page_type = 'contact_detail' AND section_key = 'borrower_entity';

  IF v_section_id IS NOT NULL THEN
    INSERT INTO public.page_layout_fields (section_id, field_config_id, field_key, display_order, column_position)
    SELECT v_section_id, fc.id, fc.field_key, fc.display_order, fc.column_position
    FROM public.field_configurations fc
    WHERE fc.module = 'borrower_entity' AND fc.is_archived = false
    ON CONFLICT (section_id, field_key) DO NOTHING;
  END IF;
END $$;
