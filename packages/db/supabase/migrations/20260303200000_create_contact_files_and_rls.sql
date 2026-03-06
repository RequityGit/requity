-- Create contact_files table for CRM contact file attachments
CREATE TABLE IF NOT EXISTS public.contact_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN (
    'id_document', 'tax_return', 'bank_statement', 'proof_of_income',
    'contract', 'correspondence', 'nda', 'application', 'other'
  )),
  storage_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_files_contact_id ON public.contact_files(contact_id);

ALTER TABLE public.contact_files ENABLE ROW LEVEL SECURITY;

-- RLS: Admin-only access (same pattern as company_files)
CREATE POLICY "Admins can view contact files"
  ON public.contact_files FOR SELECT
  TO authenticated USING ((SELECT is_admin()));

CREATE POLICY "Admins can upload contact files"
  ON public.contact_files FOR INSERT
  TO authenticated WITH CHECK ((SELECT is_admin()));

CREATE POLICY "Admins can update contact files"
  ON public.contact_files FOR UPDATE
  TO authenticated USING ((SELECT is_admin()));

CREATE POLICY "Admins can delete contact files"
  ON public.contact_files FOR DELETE
  TO authenticated USING ((SELECT is_admin()));

-- Create contact-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-files',
  'contact-files',
  false,
  26214400,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Admins can read contact files storage"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'contact-files' AND (SELECT is_admin()));

CREATE POLICY "Admins can upload contact files storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'contact-files' AND (SELECT is_admin()));

CREATE POLICY "Admins can update contact files storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'contact-files' AND (SELECT is_admin()));

CREATE POLICY "Admins can delete contact files storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'contact-files' AND (SELECT is_admin()));
