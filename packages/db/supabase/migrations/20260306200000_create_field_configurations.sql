-- Field configurations table for configurable field layout per module
CREATE TABLE field_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  column_position TEXT NOT NULL DEFAULT 'left',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module, field_key)
);

CREATE INDEX idx_field_config_module ON field_configurations(module, display_order);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_field_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_field_configurations_updated_at
  BEFORE UPDATE ON field_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_field_configurations_updated_at();

ALTER TABLE field_configurations ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (needed for rendering deal detail pages)
CREATE POLICY "Anyone can read field configurations"
  ON field_configurations FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can modify field configurations
CREATE POLICY "Super admins can modify field configurations"
  ON field_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = (select auth.uid())
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  );

-- Seed data: Loan Details module
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('loan_details', 'loan_number', 'Loan Number', 'text', 'left', 0, true, true),
  ('loan_details', 'type', 'Type', 'dropdown', 'right', 1, true, false),
  ('loan_details', 'purpose', 'Purpose', 'dropdown', 'left', 2, true, false),
  ('loan_details', 'funding_channel', 'Channel', 'dropdown', 'right', 3, true, false),
  ('loan_details', 'strategy', 'Strategy', 'dropdown', 'left', 4, true, false),
  ('loan_details', 'financing', 'Financing', 'dropdown', 'right', 5, true, false),
  ('loan_details', 'debt_tranche', 'Tranche', 'dropdown', 'left', 6, true, false),
  ('loan_details', 'deal_programs', 'Programs', 'text', 'right', 7, true, false);

-- Seed data: Property module
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('property', 'property_address_line1', 'Address', 'text', 'left', 0, true, false),
  ('property', 'property_city', 'City', 'text', 'right', 1, true, false),
  ('property', 'property_state', 'State', 'text', 'left', 2, true, false),
  ('property', 'property_zip', 'Zip', 'text', 'right', 3, true, false),
  ('property', 'property_type', 'Property Type', 'dropdown', 'left', 4, true, false),
  ('property', 'property_units', 'Units', 'number', 'right', 5, true, false),
  ('property', '_property_year_built', 'Year Built', 'number', 'left', 6, true, false),
  ('property', '_property_sqft', 'Sq Ft', 'number', 'right', 7, true, false),
  ('property', 'appraised_value', 'Appraised Value', 'currency', 'left', 8, true, true),
  ('property', 'purchase_price', 'Purchase Price', 'currency', 'right', 9, true, false);

-- Seed data: Borrower Entity module
INSERT INTO field_configurations (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked) VALUES
  ('borrower_entity', 'entity_name', 'Entity Name', 'text', 'left', 0, true, false),
  ('borrower_entity', 'entity_type', 'Entity Type', 'dropdown', 'right', 1, true, false),
  ('borrower_entity', 'first_name', 'Guarantor', 'text', 'left', 2, true, true),
  ('borrower_entity', 'credit_score', 'FICO', 'number', 'right', 3, true, false),
  ('borrower_entity', 'verified_liquidity', 'Liquidity', 'currency', 'left', 4, true, false),
  ('borrower_entity', 'experience_count', 'Experience', 'number', 'right', 5, true, false);
