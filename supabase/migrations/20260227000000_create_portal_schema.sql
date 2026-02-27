-- Requity Borrower Portal Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: profiles
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'borrower' CHECK (role IN ('borrower', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- Table: loans
-- ============================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loan_name TEXT NOT NULL DEFAULT '',
  property_address TEXT NOT NULL DEFAULT '',
  loan_amount NUMERIC NOT NULL DEFAULT 0,
  loan_type TEXT NOT NULL DEFAULT 'CRE Bridge' CHECK (
    loan_type IN ('CRE Bridge', 'Fix & Flip', 'DSCR', 'New Construction', 'MHC', 'Multifamily', 'RV Park')
  ),
  status TEXT NOT NULL DEFAULT 'Application Received' CHECK (
    status IN ('Application Received', 'Processing', 'Underwriting', 'Approved', 'Closing', 'Funded')
  ),
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  processor_name TEXT DEFAULT 'Estefania',
  processor_email TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Borrowers can read own loans"
  ON loans FOR SELECT
  USING (borrower_id = auth.uid());

CREATE POLICY "Admins can read all loans"
  ON loans FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert loans"
  ON loans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update loans"
  ON loans FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete loans"
  ON loans FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Table: document_requirements
-- ============================================
CREATE TABLE document_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Pending Upload' CHECK (
    status IN ('Pending Upload', 'Uploaded', 'Under Review', 'Approved', 'Needs Revision')
  ),
  revision_note TEXT,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Borrowers can read own loan requirements"
  ON document_requirements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM loans WHERE loans.id = document_requirements.loan_id AND loans.borrower_id = auth.uid())
  );

CREATE POLICY "Admins can read all requirements"
  ON document_requirements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert requirements"
  ON document_requirements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update requirements"
  ON document_requirements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete requirements"
  ON document_requirements FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Table: documents
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_id UUID NOT NULL REFERENCES document_requirements(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Borrowers can read own loan documents"
  ON documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM loans WHERE loans.id = documents.loan_id AND loans.borrower_id = auth.uid())
  );

CREATE POLICY "Borrowers can insert documents for own loans"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM loans WHERE loans.id = documents.loan_id AND loans.borrower_id = auth.uid())
  );

CREATE POLICY "Admins can read all documents"
  ON documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert documents"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete documents"
  ON documents FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Table: activity_log
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  details TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Borrowers can read own loan activity"
  ON activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM loans WHERE loans.id = activity_log.loan_id AND loans.borrower_id = auth.uid())
  );

CREATE POLICY "Admins can read all activity"
  ON activity_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Any authenticated user can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- ============================================
-- Storage bucket: loan-documents
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Borrowers can upload to own loan folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'loan-documents'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id::text = (storage.foldername(name))[1]
      AND loans.borrower_id = auth.uid()
    )
  );

CREATE POLICY "Borrowers can read own loan files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'loan-documents'
    AND EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id::text = (storage.foldername(name))[1]
      AND loans.borrower_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all loan files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'loan-documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can upload all loan files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'loan-documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete loan files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'loan-documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Function: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'borrower')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Function: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER document_requirements_updated_at
  BEFORE UPDATE ON document_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
