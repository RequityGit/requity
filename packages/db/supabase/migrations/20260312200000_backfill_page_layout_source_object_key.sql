-- Backfill source_object_key on page_layout_fields from field_configurations.module
-- This allows the runtime to resolve which DB table owns each field's data,
-- regardless of which layout section the field is placed in.

UPDATE public.page_layout_fields plf
SET source_object_key = CASE fc.module
  WHEN 'contact_profile' THEN 'contact'
  WHEN 'borrower_profile' THEN 'borrower'
  WHEN 'investor_profile' THEN 'investor'
  WHEN 'borrower_entity' THEN 'borrower_entity'
  WHEN 'company_info' THEN 'company'
  WHEN 'uw_deal' THEN 'unified_deal'
  WHEN 'uw_property' THEN 'property'
  WHEN 'uw_borrower' THEN 'borrower'
  WHEN 'loan_details' THEN 'loan'
  ELSE NULL
END
FROM public.field_configurations fc
WHERE plf.field_config_id = fc.id
  AND plf.source_object_key IS NULL;
