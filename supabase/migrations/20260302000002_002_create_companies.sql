-- Migration 002: Create companies table
-- Central table for tracking companies (brokerages, lenders, title companies, etc.)

CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_type company_type_enum NOT NULL,
  phone text,
  email text,
  website text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  country text DEFAULT 'US',
  fee_agreement_on_file boolean DEFAULT false,
  is_active boolean DEFAULT true,
  primary_contact_id uuid, -- FK to crm_contacts added in migration 004 to avoid circular dependency
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_companies" ON companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'super_admin'
    )
  );

-- Admin read/write access policy
CREATE POLICY "admin_full_access_companies" ON companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_companies_company_type ON companies (company_type);
CREATE INDEX idx_companies_is_active ON companies (is_active);
CREATE INDEX idx_companies_primary_contact_id ON companies (primary_contact_id);
