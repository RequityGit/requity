-- ============================================================================
-- Requity Group Investor Portal Schema
-- Creates tables for investors, entities, investments, documents, and admins
-- with comprehensive Row Level Security policies
-- ============================================================================

-- Drop old borrower portal tables if they exist (clean migration)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_requirements CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Investor profiles (extends Supabase auth.users)
CREATE TABLE investors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment entities (LLCs, trusts, IRAs, individuals that investors invest through)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'llc', 'trust', 'ira', 'corporation', 'partnership')),
  tax_id_last_four TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maps investors to their entities (an investor can have multiple entities)
CREATE TABLE investor_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'authorized_signer', 'viewer')),
  UNIQUE(investor_id, entity_id)
);

-- Investment vehicles / funds / deals that entities invest in
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  investment_type TEXT NOT NULL CHECK (investment_type IN ('fund', 'loan', 'property')),
  business_line TEXT NOT NULL CHECK (business_line IN ('lending', 'homes')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'pending')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maps entities to their investments (with capital details)
CREATE TABLE entity_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  committed_capital NUMERIC(15,2),
  funded_capital NUMERIC(15,2),
  ownership_percentage NUMERIC(7,4),
  investment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'pending')),
  UNIQUE(entity_id, investment_id)
);

-- Documents (K-1s, statements, subscription docs, reports, etc.)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'k1', 'capital_statement', 'distribution_notice', 'subscription_agreement',
    'quarterly_report', 'annual_report', 'tax_document', 'correspondence', 'other'
  )),
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  year INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin users (Requity team members)
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_investor_entities_investor ON investor_entities(investor_id);
CREATE INDEX idx_investor_entities_entity ON investor_entities(entity_id);
CREATE INDEX idx_entity_investments_entity ON entity_investments(entity_id);
CREATE INDEX idx_entity_investments_investment ON entity_investments(investment_id);
CREATE INDEX idx_documents_entity ON documents(entity_id);
CREATE INDEX idx_documents_investment ON documents(investment_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_year ON documents(year);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_investors_updated_at
  BEFORE UPDATE ON investors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- INVESTOR POLICIES
-- --------------------------------------------------------------------------

-- Investors can only see their own profile
CREATE POLICY "investors_select_own_profile" ON investors
  FOR SELECT USING (id = auth.uid());

-- Investors can update their own profile (name, phone)
CREATE POLICY "investors_update_own_profile" ON investors
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Investors can only see their own entities
CREATE POLICY "investors_select_own_entities" ON entities
  FOR SELECT USING (
    id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
  );

-- Investors can only see their own entity mappings
CREATE POLICY "investors_select_own_investor_entities" ON investor_entities
  FOR SELECT USING (investor_id = auth.uid());

-- Investors can only see investments their entities are in
CREATE POLICY "investors_select_own_investments" ON investments
  FOR SELECT USING (
    id IN (
      SELECT investment_id FROM entity_investments
      WHERE entity_id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
    )
  );

-- Investors can only see entity-investment mappings for their own entities
CREATE POLICY "investors_select_own_entity_investments" ON entity_investments
  FOR SELECT USING (
    entity_id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
  );

-- Investors can only see documents for their entities or their investments
CREATE POLICY "investors_select_own_documents" ON documents
  FOR SELECT USING (
    entity_id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
    OR
    investment_id IN (
      SELECT investment_id FROM entity_investments
      WHERE entity_id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------------
-- ADMIN POLICIES
-- --------------------------------------------------------------------------

-- Admins can see and manage all investors
CREATE POLICY "admins_all_investors" ON investors
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Admins can see and manage all entities
CREATE POLICY "admins_all_entities" ON entities
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Admins can see and manage all investor-entity mappings
CREATE POLICY "admins_all_investor_entities" ON investor_entities
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Admins can see and manage all investments
CREATE POLICY "admins_all_investments" ON investments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Admins can see and manage all entity-investment mappings
CREATE POLICY "admins_all_entity_investments" ON entity_investments
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Admins can see and manage all documents
CREATE POLICY "admins_all_documents" ON documents
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Admins can see the admins table
CREATE POLICY "admins_select_admins" ON admins
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM admins)
  );

-- ============================================================================
-- SUPABASE STORAGE
-- ============================================================================

-- Create the private storage bucket for investor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('investor-documents', 'investor-documents', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Investors can download files for their own documents
CREATE POLICY "investors_download_own_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'investor-documents'
    AND (
      -- Check if the file's storage path matches a document the investor has access to
      name IN (
        SELECT storage_path FROM documents
        WHERE entity_id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
        OR investment_id IN (
          SELECT investment_id FROM entity_investments
          WHERE entity_id IN (SELECT entity_id FROM investor_entities WHERE investor_id = auth.uid())
        )
      )
    )
  );

-- Storage policy: Admins can manage all files in the bucket
CREATE POLICY "admins_manage_investor_documents" ON storage.objects
  FOR ALL USING (
    bucket_id = 'investor-documents'
    AND auth.uid() IN (SELECT id FROM admins)
  ) WITH CHECK (
    bucket_id = 'investor-documents'
    AND auth.uid() IN (SELECT id FROM admins)
  );

-- Delete old storage bucket if exists (from borrower portal)
-- Note: This won't delete files, just the bucket reference.
-- In production, clean up manually if needed.
DELETE FROM storage.buckets WHERE id = 'loan-documents';
