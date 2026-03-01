-- Create the crm-attachments storage bucket (private, authenticated access only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-attachments',
  'crm-attachments',
  false,
  10485760, -- 10MB per file
  null -- allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to crm-attachments
CREATE POLICY "Admins can upload crm attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crm-attachments'
  AND (SELECT public.is_admin())
);

-- Allow authenticated admins to read crm attachments
CREATE POLICY "Admins can read crm attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'crm-attachments'
  AND (SELECT public.is_admin())
);

-- Allow authenticated admins to delete crm attachments
CREATE POLICY "Admins can delete crm attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'crm-attachments'
  AND (SELECT public.is_admin())
);
