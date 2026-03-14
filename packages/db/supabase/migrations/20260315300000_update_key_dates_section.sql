-- ═══════════════════════════════════════════════════════════════
-- Update Key Dates section for deals:
--   1. Archive application_date, approval_date, expected_close_date
--   2. Add date_created (read-only, auto-populated from created_at)
--   3. Update page layout fields for Key Dates section
--   4. Remove archived fields from ALL card type detail_field_groups
--   5. Add date_created to Key Dates groups in card type fallbacks
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_section_id UUID;
  v_fc_id UUID;
BEGIN
  -- ─── 1. Archive removed fields ───
  UPDATE field_configurations
  SET is_archived = true, is_visible = false, updated_at = now()
  WHERE module = 'uw_deal'
    AND field_key IN ('application_date', 'approval_date', 'expected_close_date');

  -- ─── 2. Add date_created field ───
  INSERT INTO field_configurations
    (module, field_key, field_label, field_type, is_visible, is_archived, is_read_only, display_order)
  VALUES
    ('uw_deal', 'date_created', 'Date Created', 'date', true, false, true, 0)
  ON CONFLICT (module, field_key) DO UPDATE
    SET field_label = EXCLUDED.field_label,
        field_type = EXCLUDED.field_type,
        is_visible = true,
        is_archived = false,
        is_read_only = true,
        updated_at = now();

  -- ─── 3. Update page layout fields for Key Dates section ───
  SELECT id INTO v_section_id
  FROM page_layout_sections
  WHERE page_type = 'deal_detail' AND section_key = 'overview_key_dates';

  IF v_section_id IS NOT NULL THEN
    DELETE FROM page_layout_fields
    WHERE section_id = v_section_id
      AND field_key IN ('application_date', 'approval_date', 'expected_close_date');

    SELECT id INTO v_fc_id
    FROM field_configurations
    WHERE module = 'uw_deal' AND field_key = 'date_created';

    IF v_fc_id IS NOT NULL THEN
      INSERT INTO page_layout_fields
        (section_id, field_config_id, field_key, display_order, column_position, is_visible, source, source_object_key, column_span)
      VALUES
        (v_section_id, v_fc_id, 'date_created', 0, 'left', true, 'native', NULL, 'half')
      ON CONFLICT (section_id, field_key) DO NOTHING;
    END IF;

    UPDATE page_layout_fields
    SET display_order = 1
    WHERE section_id = v_section_id AND field_key = 'closing_date';
  END IF;

  -- ─── 4. Remove archived fields from ALL card type detail_field_groups ───
  -- This removes application_date, approval_date, expected_close_date from
  -- every section (Key Dates, Deal Summary, Acquisition, etc.)
  UPDATE unified_card_types
  SET detail_field_groups = (
    SELECT jsonb_agg(
      jsonb_set(
        grp,
        '{fields}',
        COALESCE(
          (
            SELECT jsonb_agg(f)
            FROM jsonb_array_elements_text(grp->'fields') AS f
            WHERE f NOT IN ('application_date', 'approval_date', 'expected_close_date')
          ),
          '[]'::jsonb
        )
      )
      ORDER BY idx
    )
    FROM jsonb_array_elements(detail_field_groups) WITH ORDINALITY AS t(grp, idx)
  )
  WHERE detail_field_groups IS NOT NULL
    AND (
      detail_field_groups::text LIKE '%application_date%'
      OR detail_field_groups::text LIKE '%approval_date%'
      OR detail_field_groups::text LIKE '%expected_close_date%'
    );

  -- ─── 5. Add date_created to Key Dates groups ───
  UPDATE unified_card_types
  SET detail_field_groups = (
    SELECT jsonb_agg(
      CASE
        WHEN grp->>'label' = 'Key Dates'
          AND NOT (grp->'fields') @> '"date_created"'::jsonb
        THEN jsonb_set(
          grp,
          '{fields}',
          '["date_created"]'::jsonb || (grp->'fields')
        )
        ELSE grp
      END
      ORDER BY idx
    )
    FROM jsonb_array_elements(detail_field_groups) WITH ORDINALITY AS t(grp, idx)
  )
  WHERE detail_field_groups IS NOT NULL
    AND detail_field_groups::text LIKE '%Key Dates%';

END $$;
