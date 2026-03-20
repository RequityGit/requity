-- Make gdrive_file_id nullable since templates are no longer synced with Google Docs
ALTER TABLE public.document_templates
  ALTER COLUMN gdrive_file_id DROP NOT NULL,
  ALTER COLUMN gdrive_file_id SET DEFAULT NULL;
