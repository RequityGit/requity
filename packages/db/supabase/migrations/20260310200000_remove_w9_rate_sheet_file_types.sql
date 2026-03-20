-- Migration: Remove w9 and rate_sheet from company_files file_type constraint
-- Date: 2026-03-10

-- 1. Migrate any existing w9 or rate_sheet files to 'other'
UPDATE public.company_files
SET file_type = 'other'
WHERE file_type IN ('w9', 'rate_sheet');

-- 2. Drop the existing check constraint and recreate without w9/rate_sheet
ALTER TABLE public.company_files
  DROP CONSTRAINT IF EXISTS company_files_file_type_check;

ALTER TABLE public.company_files
  ADD CONSTRAINT company_files_file_type_check
  CHECK (file_type IN ('tear_sheet', 'nda', 'fee_agreement', 'broker_agreement', 'guidelines', 'other'));
