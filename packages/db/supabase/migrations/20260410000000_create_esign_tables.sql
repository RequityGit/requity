-- E-Signature (DocuSeal) Integration Tables
-- Supports loan docs, investor subscription agreements, and internal approval docs.

-- 1. Document templates registered in DocuSeal
CREATE TABLE IF NOT EXISTS esign_templates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  docuseal_template_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'term_sheet',
    'commitment_letter',
    'loan_agreement',
    'promissory_note',
    'deed_of_trust',
    'personal_guarantee',
    'subscription_agreement',
    'ppm',
    'operating_agreement',
    'side_letter',
    'internal_approval',
    'committee_memo',
    'other'
  )),
  business_line TEXT NOT NULL CHECK (business_line IN (
    'lending', 'investments', 'internal', 'shared'
  )),
  field_mapping JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Signature submissions (envelopes)
CREATE TABLE IF NOT EXISTS esign_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  docuseal_submission_id BIGINT UNIQUE,
  deal_id BIGINT,
  template_id BIGINT REFERENCES esign_templates(id),
  requested_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'partially_signed', 'completed',
    'declined', 'expired', 'voided'
  )),
  document_name TEXT NOT NULL,
  expiration_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Individual signers within a submission
CREATE TABLE IF NOT EXISTS esign_signers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES esign_submissions(id) ON DELETE CASCADE,
  docuseal_submitter_id BIGINT,
  contact_id BIGINT,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'signer',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'opened', 'signed', 'declined'
  )),
  signed_at TIMESTAMPTZ,
  ip_address INET,
  sign_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Signed document storage references
CREATE TABLE IF NOT EXISTS esign_documents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES esign_submissions(id) ON DELETE CASCADE,
  docuseal_document_url TEXT,
  storage_path TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT DEFAULT 'application/pdf',
  audit_trail JSONB DEFAULT '{}',
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes
CREATE INDEX idx_esign_templates_type ON esign_templates(document_type);
CREATE INDEX idx_esign_templates_business_line ON esign_templates(business_line);
CREATE INDEX idx_esign_submissions_deal ON esign_submissions(deal_id);
CREATE INDEX idx_esign_submissions_status ON esign_submissions(status);
CREATE INDEX idx_esign_submissions_docuseal ON esign_submissions(docuseal_submission_id);
CREATE INDEX idx_esign_signers_submission ON esign_signers(submission_id);
CREATE INDEX idx_esign_signers_email ON esign_signers(email);
CREATE INDEX idx_esign_documents_submission ON esign_documents(submission_id);

-- 6. Updated-at triggers
CREATE TRIGGER set_esign_templates_updated_at
  BEFORE UPDATE ON esign_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_esign_submissions_updated_at
  BEFORE UPDATE ON esign_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_esign_signers_updated_at
  BEFORE UPDATE ON esign_signers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS Policies
ALTER TABLE esign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE esign_documents ENABLE ROW LEVEL SECURITY;

-- esign_templates: admins can manage, all authenticated can view active
CREATE POLICY "Anyone can view active esign templates"
  ON esign_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins full access to esign templates"
  ON esign_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

-- esign_submissions: admins full access, users can view their own requests
CREATE POLICY "Admins full access to esign submissions"
  ON esign_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "Users can view submissions they requested"
  ON esign_submissions FOR SELECT
  USING (requested_by = (SELECT auth.uid()));

-- esign_signers: admins full access, users can view their own signing requests
CREATE POLICY "Admins full access to esign signers"
  ON esign_signers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "Users can view signers for their submissions"
  ON esign_signers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM esign_submissions
      WHERE esign_submissions.id = esign_signers.submission_id
      AND esign_submissions.requested_by = (SELECT auth.uid())
    )
  );

-- esign_documents: admins full access, requesters can view
CREATE POLICY "Admins full access to esign documents"
  ON esign_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "Users can view documents for their submissions"
  ON esign_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM esign_submissions
      WHERE esign_submissions.id = esign_documents.submission_id
      AND esign_submissions.requested_by = (SELECT auth.uid())
    )
  );

-- 8. Supabase Storage bucket for signed documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-documents', 'signed-documents', false)
ON CONFLICT DO NOTHING;

-- Storage RLS: admins can manage, authenticated can read their submissions' docs
CREATE POLICY "Admins can manage signed documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'signed-documents'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );
