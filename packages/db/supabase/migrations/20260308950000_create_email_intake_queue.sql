-- Email Intake Queue
-- Stores forwarded emails sent to intake@requitygroup.com for review and deal creation.

CREATE TABLE email_intake_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crm_email_id UUID REFERENCES crm_emails(id),
  gmail_message_id TEXT NOT NULL UNIQUE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  body_preview TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','ready','deal_created','attached','dismissed','error')),

  -- Attachments: [{filename, storage_path, mime_type, size_bytes, extraction_status}]
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- AI extraction results (merged across attachments + email body)
  extraction_summary TEXT,
  extracted_deal_fields JSONB,
  extracted_uw_fields JSONB,
  suggested_card_type_id UUID REFERENCES unified_card_types(id),

  -- Contact matching
  matched_contact_id UUID REFERENCES crm_contacts(id),

  -- Resolution
  resolved_deal_id UUID REFERENCES unified_deals(id),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_intake_queue_status ON email_intake_queue(status);
CREATE INDEX idx_email_intake_queue_created ON email_intake_queue(created_at DESC);

-- RLS: admin/super_admin only
ALTER TABLE email_intake_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage intake queue"
  ON email_intake_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_email_intake_queue_updated_at
  BEFORE UPDATE ON email_intake_queue
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
