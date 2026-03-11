-- ============================================================================
-- Object Manager Revamp: Add visibility_condition + pro forma + intake tables
-- ============================================================================

-- 1. Add visibility_condition to field_configurations
ALTER TABLE field_configurations
  ADD COLUMN IF NOT EXISTS visibility_condition JSONB DEFAULT NULL;

ALTER TABLE field_configurations
  ADD COLUMN IF NOT EXISTS formula_output_format TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS formula_decimal_places INTEGER DEFAULT 2;

COMMENT ON COLUMN field_configurations.visibility_condition IS
  'Two-axis conditional visibility: {asset_class?: string[], loan_type?: string[]}. null = always visible.';

-- 2. Create pro_forma_template table
CREATE TABLE IF NOT EXISTS pro_forma_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  visibility_condition JSONB NOT NULL DEFAULT '{}',
  columns JSONB NOT NULL DEFAULT '[]',
  sections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pro_forma_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pro_forma_template_read" ON pro_forma_template
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pro_forma_template_admin_write" ON pro_forma_template
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
      AND user_roles.is_active = true
    )
  );

-- 3. Create intake_form table
CREATE TABLE IF NOT EXISTS intake_form (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  branding JSONB DEFAULT '{}',
  welcome_message TEXT,
  confirmation_message TEXT,
  classification_config JSONB NOT NULL DEFAULT '{}',
  notification_config JSONB DEFAULT '{}',
  submission_config JSONB NOT NULL DEFAULT '{"create_opportunity": true, "default_status": "New Intake", "default_stage": "Lead"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_form ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intake_form_read" ON intake_form
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "intake_form_admin_write" ON intake_form
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "intake_form_public_read" ON intake_form
  FOR SELECT TO anon USING (is_active = true);

-- 4. Create intake_form_field table
CREATE TABLE IF NOT EXISTS intake_form_field (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_form_id UUID NOT NULL REFERENCES intake_form(id) ON DELETE CASCADE,
  field_config_id UUID REFERENCES field_configurations(id),
  field_key VARCHAR NOT NULL,
  is_required_on_intake BOOLEAN DEFAULT FALSE,
  label_override VARCHAR,
  help_text TEXT,
  placeholder VARCHAR,
  display_order INTEGER NOT NULL DEFAULT 0,
  section VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_form_field ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intake_form_field_read" ON intake_form_field
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "intake_form_field_admin_write" ON intake_form_field
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "intake_form_field_public_read" ON intake_form_field
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM intake_form
      WHERE intake_form.id = intake_form_field.intake_form_id
      AND intake_form.is_active = true
    )
  );

-- 5. Create intake_submission table
CREATE TABLE IF NOT EXISTS intake_submission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_form_id UUID REFERENCES intake_form(id),
  opportunity_id UUID,
  submitted_by_name VARCHAR,
  submitted_by_email VARCHAR,
  submitted_by_phone VARCHAR,
  submission_data JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_submission ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intake_submission_admin_read" ON intake_submission
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

CREATE POLICY "intake_submission_public_insert" ON intake_submission
  FOR INSERT TO anon
  WITH CHECK (true);
