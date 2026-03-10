-- Remove company agreements fields and page layout config
-- NDA tracking and fee agreement fields are no longer needed on companies

-- 1. Drop agreement-related columns from companies table
ALTER TABLE companies
  DROP COLUMN IF EXISTS nda_created_date,
  DROP COLUMN IF EXISTS nda_expiration_date,
  DROP COLUMN IF EXISTS fee_agreement_on_file;

-- 2. Remove agreements section from page_layout_fields (child rows first)
DELETE FROM page_layout_fields
WHERE section_id IN (
  SELECT id FROM page_layout_sections
  WHERE page_type = 'company_detail' AND section_key = 'agreements'
);

-- 3. Remove agreements section from page_layout_sections
DELETE FROM page_layout_sections
WHERE page_type = 'company_detail' AND section_key = 'agreements';

-- 4. Remove any field_configurations for these field keys in company_info module
DELETE FROM field_configurations
WHERE module = 'company_info'
  AND field_key IN ('nda_created_date', 'nda_expiration_date', 'fee_agreement_on_file', 'nda_status');
