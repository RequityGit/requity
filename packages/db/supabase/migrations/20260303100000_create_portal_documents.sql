-- ============================================================
-- Migration: Create portal_documents table
-- Purpose: Unified document management with polymorphic entity linking
-- ============================================================

-- Create the portal_documents table
CREATE TABLE IF NOT EXISTS portal_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core file metadata
  file_name text NOT NULL,
  display_name text,                                 -- User-friendly name
  file_path text NOT NULL,                           -- Storage path in portal-documents bucket
  file_size bigint,
  mime_type text,

  -- Classification
  document_type text NOT NULL DEFAULT 'other',
  category text NOT NULL DEFAULT 'general',          -- investor, borrower, company, loan, internal, general

  -- Polymorphic entity links (nullable FKs)
  loan_id uuid REFERENCES loans(id) ON DELETE SET NULL,
  fund_id uuid REFERENCES funds(id) ON DELETE SET NULL,
  borrower_id uuid REFERENCES borrowers(id) ON DELETE SET NULL,
  investor_id uuid REFERENCES investors(id) ON DELETE SET NULL,
  borrower_entity_id uuid REFERENCES borrower_entities(id) ON DELETE SET NULL,
  investing_entity_id uuid REFERENCES investing_entities(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  crm_contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Access control
  visibility text NOT NULL DEFAULT 'admin_only'
    CHECK (visibility IN ('admin_only', 'portal_visible', 'public')),

  -- Audit
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  tags text[] DEFAULT '{}',

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz                              -- Soft delete
);

-- Indexes for common query patterns
CREATE INDEX idx_portal_documents_category ON portal_documents(category);
CREATE INDEX idx_portal_documents_document_type ON portal_documents(document_type);
CREATE INDEX idx_portal_documents_loan_id ON portal_documents(loan_id) WHERE loan_id IS NOT NULL;
CREATE INDEX idx_portal_documents_fund_id ON portal_documents(fund_id) WHERE fund_id IS NOT NULL;
CREATE INDEX idx_portal_documents_borrower_id ON portal_documents(borrower_id) WHERE borrower_id IS NOT NULL;
CREATE INDEX idx_portal_documents_investor_id ON portal_documents(investor_id) WHERE investor_id IS NOT NULL;
CREATE INDEX idx_portal_documents_company_id ON portal_documents(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_portal_documents_crm_contact_id ON portal_documents(crm_contact_id) WHERE crm_contact_id IS NOT NULL;
CREATE INDEX idx_portal_documents_uploaded_by ON portal_documents(uploaded_by) WHERE uploaded_by IS NOT NULL;
CREATE INDEX idx_portal_documents_visibility ON portal_documents(visibility);
CREATE INDEX idx_portal_documents_deleted_at ON portal_documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_portal_documents_created_at ON portal_documents(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER set_portal_documents_updated_at
  BEFORE UPDATE ON portal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE portal_documents ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "portal_documents_admin_all"
  ON portal_documents
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Borrowers: read own documents (where visibility = 'portal_visible' and linked to their borrower)
CREATE POLICY "portal_documents_borrower_select"
  ON portal_documents
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'portal_visible'
    AND borrower_id IN (SELECT my_borrower_ids())
    AND deleted_at IS NULL
  );

-- Investors: read own documents (where visibility = 'portal_visible' and linked to their investor)
CREATE POLICY "portal_documents_investor_select"
  ON portal_documents
  FOR SELECT
  TO authenticated
  USING (
    visibility = 'portal_visible'
    AND investor_id IN (SELECT my_investor_ids())
    AND deleted_at IS NULL
  );

-- ============================================================
-- Storage bucket for portal documents
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portal-documents',
  'portal-documents',
  false,
  26214400,  -- 25MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: admins can manage all files
CREATE POLICY "portal_docs_admin_all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'portal-documents' AND is_admin())
  WITH CHECK (bucket_id = 'portal-documents' AND is_admin());

-- Storage RLS: borrowers can read their own files
CREATE POLICY "portal_docs_borrower_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'portal-documents'
    AND has_role('borrower'::app_role)
  );

-- Storage RLS: investors can read their own files
CREATE POLICY "portal_docs_investor_read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'portal-documents'
    AND has_role('investor'::app_role)
  );
