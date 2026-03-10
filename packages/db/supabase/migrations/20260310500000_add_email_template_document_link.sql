-- Link document templates to email templates for "Send via Email" workflow
-- and track when generated documents are sent via email.

-- 1. Add optional email template link to document_templates
ALTER TABLE document_templates
  ADD COLUMN IF NOT EXISTS default_email_template_id UUID
    REFERENCES user_email_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN document_templates.default_email_template_id IS
  'Optional link to a default email template used when sending this document type via email';

-- 2. Add email send tracking columns to generated_documents
ALTER TABLE generated_documents
  ADD COLUMN IF NOT EXISTS sent_via_email_id UUID
    REFERENCES crm_emails(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

COMMENT ON COLUMN generated_documents.sent_via_email_id IS
  'Reference to the crm_emails record when this document was sent via email';
COMMENT ON COLUMN generated_documents.sent_at IS
  'Timestamp when this document was sent via email';

-- 3. Add index for looking up documents by email
CREATE INDEX IF NOT EXISTS idx_generated_documents_sent_via_email_id
  ON generated_documents(sent_via_email_id)
  WHERE sent_via_email_id IS NOT NULL;
