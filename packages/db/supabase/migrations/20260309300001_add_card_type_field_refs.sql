-- Add field reference columns to unified_card_types.
-- These store references to field_configurations instead of inline definitions.
-- Format: [{"field_key":"loan_amount","module":"uw_deal","required":true,"object":"deal","sort_order":0}, ...]

ALTER TABLE unified_card_types
  ADD COLUMN IF NOT EXISTS uw_field_refs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS property_field_refs jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_field_refs jsonb DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- Backfill: Convert inline uw_fields to uw_field_refs
-- ═══════════════════════════════════════════════════════════════

UPDATE unified_card_types
SET uw_field_refs = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'field_key', elem->>'key',
        'module', CASE
          WHEN elem->>'object' = 'property' THEN 'uw_property'
          WHEN elem->>'object' = 'borrower' THEN 'uw_borrower'
          ELSE 'uw_deal'
        END,
        'required', COALESCE((elem->>'required')::boolean, false),
        'object', COALESCE(elem->>'object', 'deal'),
        'sort_order', (row_number - 1)
      )
      ORDER BY row_number
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT elem, ROW_NUMBER() OVER () as row_number
    FROM jsonb_array_elements(uw_fields) elem
  ) numbered
)
WHERE uw_fields IS NOT NULL AND uw_fields != '[]'::jsonb;

-- Backfill property_field_refs from property_fields (if populated)
UPDATE unified_card_types
SET property_field_refs = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'field_key', elem->>'key',
        'module', 'uw_property',
        'required', COALESCE((elem->>'required')::boolean, false),
        'object', 'property',
        'sort_order', (row_number - 1)
      )
      ORDER BY row_number
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT elem, ROW_NUMBER() OVER () as row_number
    FROM jsonb_array_elements(property_fields) elem
  ) numbered
)
WHERE property_fields IS NOT NULL AND property_fields != '[]'::jsonb;

-- Backfill contact_field_refs from contact_fields (if populated)
UPDATE unified_card_types
SET contact_field_refs = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'field_key', elem->>'key',
        'module', 'uw_borrower',
        'required', COALESCE((elem->>'required')::boolean, false),
        'object', 'borrower',
        'sort_order', (row_number - 1)
      )
      ORDER BY row_number
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT elem, ROW_NUMBER() OVER () as row_number
    FROM jsonb_array_elements(contact_fields) elem
  ) numbered
)
WHERE contact_fields IS NOT NULL AND contact_fields != '[]'::jsonb;
