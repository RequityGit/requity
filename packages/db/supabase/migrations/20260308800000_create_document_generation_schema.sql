-- Phase 1: Document Generation & E-Signature Schema

-- 1.1 Create Enums
CREATE TYPE template_type_enum AS ENUM (
  'nda',
  'broker_agreement',
  'term_sheet',
  'loan_agreement',
  'investor_agreement',
  'other'
);

CREATE TYPE record_type_enum AS ENUM (
  'loan',
  'contact',
  'deal',
  'company'
);

CREATE TYPE doc_format_enum AS ENUM ('docx', 'pdf');

CREATE TYPE doc_status_enum AS ENUM (
  'draft',
  'sent_for_signature',
  'viewed',
  'signed',
  'declined',
  'expired',
  'voided'
);

-- 1.2 Create document_templates table
CREATE TABLE document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_type template_type_enum NOT NULL,
  record_type record_type_enum NOT NULL,
  description text,
  gdrive_file_id text NOT NULL,
  gdrive_folder_id text,
  merge_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  requires_signature boolean NOT NULL DEFAULT false,
  signature_roles jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_doc_templates_type ON document_templates(template_type);
CREATE INDEX idx_doc_templates_record_type ON document_templates(record_type);
CREATE INDEX idx_doc_templates_active ON document_templates(is_active);

-- 1.3 Create generated_documents table
CREATE TABLE generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES document_templates(id),
  template_version integer NOT NULL,
  record_type record_type_enum NOT NULL,
  record_id uuid NOT NULL,
  file_name text NOT NULL,
  file_format doc_format_enum NOT NULL,
  gdrive_file_id text,
  merge_data_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status doc_status_enum NOT NULL DEFAULT 'draft',
  signature_request_id text,
  signature_details jsonb,
  signed_file_gdrive_id text,
  generated_by uuid NOT NULL REFERENCES auth.users(id),
  generated_at timestamptz NOT NULL DEFAULT now(),
  signed_at timestamptz,
  expires_at timestamptz
);

-- Indexes
CREATE INDEX idx_gen_docs_template ON generated_documents(template_id);
CREATE INDEX idx_gen_docs_record ON generated_documents(record_type, record_id);
CREATE INDEX idx_gen_docs_status ON generated_documents(status);
CREATE INDEX idx_gen_docs_generated_by ON generated_documents(generated_by);

-- 1.4 RLS Policies
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON document_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin full access to templates"
  ON document_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'super_admin'
    )
  );

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all generated docs"
  ON generated_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can view docs they generated"
  ON generated_documents FOR SELECT
  USING (generated_by = (select auth.uid()));

CREATE POLICY "Admins can insert generated docs"
  ON generated_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update generated docs"
  ON generated_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );
