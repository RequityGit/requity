-- Add expected_close_date to Deal Summary groups across all card types
-- This ensures the closing date is always visible in the Deal Summary section

-- comm_debt: Add expected_close_date to Deal Summary group
UPDATE unified_card_types
SET detail_field_groups = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'label' = 'Deal Summary'
      THEN jsonb_set(elem, '{fields}', (elem->'fields') || '"expected_close_date"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(detail_field_groups) AS elem
)
WHERE slug = 'comm_debt'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(detail_field_groups) AS elem
    WHERE elem->>'label' = 'Deal Summary'
      AND NOT (elem->'fields') @> '"expected_close_date"'::jsonb
  );

-- res_debt_dscr: Add expected_close_date to Deal Summary group
UPDATE unified_card_types
SET detail_field_groups = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'label' = 'Deal Summary'
      THEN jsonb_set(elem, '{fields}', (elem->'fields') || '"expected_close_date"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(detail_field_groups) AS elem
)
WHERE slug = 'res_debt_dscr'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(detail_field_groups) AS elem
    WHERE elem->>'label' = 'Deal Summary'
      AND NOT (elem->'fields') @> '"expected_close_date"'::jsonb
  );

-- res_debt_rtl: Add expected_close_date to Deal Summary group
UPDATE unified_card_types
SET detail_field_groups = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'label' = 'Deal Summary'
      THEN jsonb_set(elem, '{fields}', (elem->'fields') || '"expected_close_date"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(detail_field_groups) AS elem
)
WHERE slug = 'res_debt_rtl'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(detail_field_groups) AS elem
    WHERE elem->>'label' = 'Deal Summary'
      AND NOT (elem->'fields') @> '"expected_close_date"'::jsonb
  );

-- comm_equity: Add expected_close_date to Acquisition group (no Deal Summary group exists)
UPDATE unified_card_types
SET detail_field_groups = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'label' = 'Acquisition'
      THEN jsonb_set(elem, '{fields}', (elem->'fields') || '"expected_close_date"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(detail_field_groups) AS elem
)
WHERE slug = 'comm_equity'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(detail_field_groups) AS elem
    WHERE elem->>'label' = 'Acquisition'
      AND NOT (elem->'fields') @> '"expected_close_date"'::jsonb
  );
