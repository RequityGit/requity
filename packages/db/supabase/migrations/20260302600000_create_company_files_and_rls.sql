-- Migration: Create company_files table, add admin RLS to companies, create company-files storage bucket
-- Date: 2026-03-02

-- ============================================
-- 1. Create company_files table
-- ============================================

CREATE TABLE IF NOT EXISTS public.company_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN (
    'tear_sheet', 'nda', 'fee_agreement', 'rate_sheet',
    'w9', 'broker_agreement', 'guidelines', 'other'
  )),
  storage_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index for fast company lookups
CREATE INDEX IF NOT EXISTS idx_company_files_company_id ON public.company_files(company_id);

-- Enable RLS
ALTER TABLE public.company_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_files (admin pattern)
CREATE POLICY "Admins can view company files"
  ON public.company_files FOR SELECT
  TO authenticated USING (is_admin());

CREATE POLICY "Admins can upload company files"
  ON public.company_files FOR INSERT
  TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update company files"
  ON public.company_files FOR UPDATE
  TO authenticated USING (is_admin());

CREATE POLICY "Admins can delete company files"
  ON public.company_files FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================
-- 2. Add admin RLS policies to companies table
-- ============================================

-- Only add if they don't already exist (companies currently only has super_admin policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Admins can view companies'
  ) THEN
    CREATE POLICY "Admins can view companies"
      ON public.companies FOR SELECT
      TO authenticated USING (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Admins can insert companies'
  ) THEN
    CREATE POLICY "Admins can insert companies"
      ON public.companies FOR INSERT
      TO authenticated WITH CHECK (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Admins can update companies'
  ) THEN
    CREATE POLICY "Admins can update companies"
      ON public.companies FOR UPDATE
      TO authenticated USING (is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Admins can delete companies'
  ) THEN
    CREATE POLICY "Admins can delete companies"
      ON public.companies FOR DELETE
      TO authenticated USING (is_admin());
  END IF;
END $$;

-- ============================================
-- 3. Create company-files storage bucket
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-files',
  'company-files',
  false,
  26214400, -- 25MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for company-files bucket
CREATE POLICY "Admins can read company files storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-files' AND is_admin());

CREATE POLICY "Admins can upload company files storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-files' AND is_admin());

CREATE POLICY "Admins can update company files storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-files' AND is_admin());

CREATE POLICY "Admins can delete company files storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-files' AND is_admin());
