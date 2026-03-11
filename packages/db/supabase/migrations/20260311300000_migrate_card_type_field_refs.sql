-- Migrate unified_card_types inline field arrays to field_configurations references
--
-- Background: unified_card_types stores field definitions in three JSONB arrays:
--   uw_fields        -> array of { key, label, type, required, object, options }
--   property_fields  -> array of { key, label, type, required, options }
--   contact_fields   -> array of { key, label, type, required, options }
--
-- The new architecture stores references instead:
--   uw_field_refs        -> array of { field_key, module, required, object, sort_order }
--   property_field_refs  -> array of { field_key, module, required, object, sort_order }
--   contact_field_refs   -> array of { field_key, module, required, object, sort_order }
--
-- This migration populates the *_field_refs columns for any card type that:
--   a) Has inline fields defined (non-empty array)
--   b) Has no field refs yet (null or empty array)
--   c) Each inline field has a matching field_configurations record
--
-- Fields with no matching field_configuration are silently skipped.
-- After this migration, useResolvedCardType() will resolve refs at runtime.

-- ============================================================
-- 1. Migrate uw_field_refs from uw_fields
-- ============================================================

UPDATE unified_card_types ct
SET uw_field_refs = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'field_key', f.field_obj->>'key',
        'module', CASE (f.field_obj->>'object')
          WHEN 'property' THEN 'uw_property'
          WHEN 'borrower' THEN 'uw_borrower'
          ELSE 'uw_deal'
        END,
        'required', COALESCE((f.field_obj->>'required')::boolean, false),
        'object', COALESCE(f.field_obj->>'object', 'deal'),
        'sort_order', (f.ord - 1)::int
      )
      ORDER BY f.ord
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT t.value AS field_obj, t.ordinality AS ord
    FROM jsonb_array_elements(ct.uw_fields) WITH ORDINALITY AS t(value, ordinality)
    WHERE EXISTS (
      SELECT 1 FROM field_configurations fc
      WHERE fc.field_key = t.value->>'key'
        AND fc.module = CASE (t.value->>'object')
          WHEN 'property' THEN 'uw_property'
          WHEN 'borrower' THEN 'uw_borrower'
          ELSE 'uw_deal'
        END
        AND fc.is_archived = false
    )
  ) f
)
WHERE (ct.uw_field_refs IS NULL OR ct.uw_field_refs = '[]'::jsonb)
  AND ct.uw_fields IS NOT NULL
  AND jsonb_array_length(ct.uw_fields) > 0;

-- ============================================================
-- 2. Migrate property_field_refs from property_fields
-- ============================================================

UPDATE unified_card_types ct
SET property_field_refs = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'field_key', f.field_obj->>'key',
        'module', 'uw_property',
        'required', COALESCE((f.field_obj->>'required')::boolean, false),
        'object', 'property',
        'sort_order', (f.ord - 1)::int
      )
      ORDER BY f.ord
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT t.value AS field_obj, t.ordinality AS ord
    FROM jsonb_array_elements(ct.property_fields) WITH ORDINALITY AS t(value, ordinality)
    WHERE EXISTS (
      SELECT 1 FROM field_configurations fc
      WHERE fc.field_key = t.value->>'key'
        AND fc.module = 'uw_property'
        AND fc.is_archived = false
    )
  ) f
)
WHERE (ct.property_field_refs IS NULL OR ct.property_field_refs = '[]'::jsonb)
  AND ct.property_fields IS NOT NULL
  AND jsonb_array_length(ct.property_fields) > 0;

-- ============================================================
-- 3. Migrate contact_field_refs from contact_fields
-- ============================================================

UPDATE unified_card_types ct
SET contact_field_refs = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'field_key', f.field_obj->>'key',
        'module', 'uw_borrower',
        'required', COALESCE((f.field_obj->>'required')::boolean, false),
        'object', 'borrower',
        'sort_order', (f.ord - 1)::int
      )
      ORDER BY f.ord
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT t.value AS field_obj, t.ordinality AS ord
    FROM jsonb_array_elements(ct.contact_fields) WITH ORDINALITY AS t(value, ordinality)
    WHERE EXISTS (
      SELECT 1 FROM field_configurations fc
      WHERE fc.field_key = t.value->>'key'
        AND fc.module = 'uw_borrower'
        AND fc.is_archived = false
    )
  ) f
)
WHERE (ct.contact_field_refs IS NULL OR ct.contact_field_refs = '[]'::jsonb)
  AND ct.contact_fields IS NOT NULL
  AND jsonb_array_length(ct.contact_fields) > 0;
