-- Migration 005: Create contact_relationship_types table
-- Tracks the multiple relationship types a CRM contact can have (borrower, investor, broker, etc.)

CREATE TABLE contact_relationship_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  relationship_type relationship_type_enum NOT NULL,
  lender_direction lender_direction_enum,
  vendor_type vendor_type_enum,
  is_active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Unique constraint using COALESCE for nullable lender_direction
CREATE UNIQUE INDEX uq_contact_rel_type_direction
  ON contact_relationship_types (contact_id, relationship_type, COALESCE(lender_direction, 'none'));

-- CHECK: lender_direction must be null when relationship_type != 'lender'
ALTER TABLE contact_relationship_types
  ADD CONSTRAINT chk_lender_direction_only_for_lenders
  CHECK (
    (relationship_type = 'lender' OR lender_direction IS NULL)
  );

-- CHECK: vendor_type must be null when relationship_type != 'vendor'
ALTER TABLE contact_relationship_types
  ADD CONSTRAINT chk_vendor_type_only_for_vendors
  CHECK (
    (relationship_type = 'vendor' OR vendor_type IS NULL)
  );

-- Enable RLS
ALTER TABLE contact_relationship_types ENABLE ROW LEVEL SECURITY;

-- Super admin full access policy
CREATE POLICY "super_admin_full_access_contact_relationship_types" ON contact_relationship_types
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

-- Admin full access policy
CREATE POLICY "admin_full_access_contact_relationship_types" ON contact_relationship_types
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
CREATE INDEX idx_contact_rel_types_contact_id ON contact_relationship_types (contact_id);
CREATE INDEX idx_contact_rel_types_relationship_type ON contact_relationship_types (relationship_type);
CREATE INDEX idx_contact_rel_types_is_active ON contact_relationship_types (is_active);
