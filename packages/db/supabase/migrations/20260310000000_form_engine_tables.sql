-- Form Engine: form_definitions, form_submissions, entity_audit_log
-- Migration: 20260310000000_form_engine_tables.sql

-- ============================================================
-- 1. Form definitions (the blueprint for each form)
-- ============================================================
CREATE TABLE IF NOT EXISTS form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  mode TEXT NOT NULL DEFAULT 'both' CHECK (mode IN ('create_only', 'edit_only', 'both')),
  contexts TEXT[] NOT NULL DEFAULT '{external,internal}',
  steps JSONB NOT NULL DEFAULT '[]',
  settings JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Form submissions (every response, partial or complete)
-- ============================================================
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES form_definitions(id),
  status TEXT NOT NULL DEFAULT 'partial' CHECK (status IN ('partial', 'pending_borrower', 'submitted', 'reviewed', 'processed')),
  type TEXT NOT NULL DEFAULT 'create' CHECK (type IN ('create', 'update', 'partial')),
  data JSONB NOT NULL DEFAULT '{}',
  current_step_id TEXT,
  session_token UUID UNIQUE DEFAULT gen_random_uuid(),
  record_id UUID,
  record_type TEXT,
  prefilled_by UUID REFERENCES auth.users(id),
  submitted_by UUID REFERENCES auth.users(id),
  submitted_by_email TEXT,
  entity_ids JSONB DEFAULT '{}',
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  token_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Entity audit log (tracks every field change across all entities)
-- ============================================================
CREATE TABLE IF NOT EXISTS entity_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_via TEXT NOT NULL DEFAULT 'form',
  form_submission_id UUID REFERENCES form_submissions(id),
  form_definition_id UUID REFERENCES form_definitions(id),
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX idx_form_definitions_slug ON form_definitions(slug);
CREATE INDEX idx_form_definitions_status ON form_definitions(status);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_session_token ON form_submissions(session_token);
CREATE INDEX idx_form_submissions_record ON form_submissions(record_type, record_id);
CREATE INDEX idx_entity_audit_log_entity ON entity_audit_log(entity_type, entity_id);
CREATE INDEX idx_entity_audit_log_created ON entity_audit_log(created_at DESC);

-- ============================================================
-- 5. Updated_at triggers
-- ============================================================
CREATE TRIGGER set_updated_at_form_definitions
  BEFORE UPDATE ON form_definitions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_form_submissions
  BEFORE UPDATE ON form_submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. RLS policies (using user_roles table, NOT profiles.role)
-- ============================================================
ALTER TABLE form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_audit_log ENABLE ROW LEVEL SECURITY;

-- form_definitions: admins can CRUD
CREATE POLICY "admins_manage_forms" ON form_definitions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

-- form_definitions: anyone can read published forms
CREATE POLICY "public_read_published_forms" ON form_definitions
  FOR SELECT USING (status = 'published');

-- form_submissions: admins see all
CREATE POLICY "admins_manage_submissions" ON form_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

-- form_submissions: authenticated users see their own
CREATE POLICY "users_read_own_submissions" ON form_submissions
  FOR SELECT USING (submitted_by = (SELECT auth.uid()));

-- form_submissions: anyone can insert (public form submission)
CREATE POLICY "public_insert_submissions" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- form_submissions: anyone can update own via valid session token
CREATE POLICY "public_update_own_via_token" ON form_submissions
  FOR UPDATE USING (
    session_token IS NOT NULL
    AND token_expires_at > now()
  );

-- entity_audit_log: admins read all
CREATE POLICY "admins_read_audit_log" ON entity_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

-- entity_audit_log: admins insert
CREATE POLICY "admins_insert_audit_log" ON entity_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = (SELECT auth.uid())
      AND user_roles.role IN ('super_admin', 'admin')
      AND user_roles.is_active = true
    )
  );

-- ============================================================
-- 7. Contact lookup RPC (SECURITY DEFINER for anonymous access)
-- ============================================================
CREATE OR REPLACE FUNCTION lookup_contact_by_email(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'found', true,
    'name', COALESCE(first_name || ' ' || last_name, ''),
    'phone', phone,
    'entity_name', company_name
  ) INTO result
  FROM crm_contacts
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF result IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. Seed: Loan Application form definition
-- ============================================================
INSERT INTO form_definitions (name, slug, status, mode, contexts, settings, steps)
VALUES (
  'Loan Application',
  'loan-application',
  'published',
  'both',
  '{external,internal}',
  '{"success_message": "Thank you for your application. Our team will review it and reach out within 24 hours.", "notify_emails": [], "token_expiry_days": 7}'::jsonb,
  '[
    {
      "id": "s1",
      "title": "What type of financing?",
      "subtitle": "Select your loan category",
      "type": "router",
      "target_entity": null,
      "match_on": null,
      "show_when": null,
      "fields": [
        {
          "id": "category",
          "type": "card-select",
          "label": null,
          "required": true,
          "mapped_column": null,
          "width": "full",
          "placeholder": null,
          "visibility_mode": "both",
          "visibility_form_mode": "both",
          "options": [
            {"value": "residential", "label": "Residential", "description": "1-4 unit properties, fix & flip, DSCR rentals", "icon": "Home"},
            {"value": "commercial", "label": "Commercial", "description": "5+ units, mixed-use, retail, office, industrial", "icon": "Building2"}
          ]
        }
      ]
    },
    {
      "id": "s2a",
      "title": "Residential loan type",
      "subtitle": "What are you looking to do?",
      "type": "router",
      "target_entity": null,
      "match_on": null,
      "show_when": [{"field": "category", "op": "eq", "value": "residential"}],
      "fields": [
        {
          "id": "loan_type",
          "type": "card-select",
          "label": null,
          "required": true,
          "mapped_column": null,
          "width": "full",
          "placeholder": null,
          "visibility_mode": "both",
          "visibility_form_mode": "both",
          "options": [
            {"value": "fix_flip", "label": "Fix & Flip", "description": "Short-term rehab loan, 12-18 months", "icon": "Hammer"},
            {"value": "dscr", "label": "DSCR Rental", "description": "Long-term rental, no income docs required", "icon": "TrendingUp"},
            {"value": "bridge", "label": "Bridge", "description": "Short-term bridge to permanent financing", "icon": "ArrowRightLeft"},
            {"value": "ground_up", "label": "Ground-Up Construction", "description": "New construction with draw schedule", "icon": "HardHat"}
          ]
        }
      ]
    },
    {
      "id": "s2b",
      "title": "Commercial loan type",
      "subtitle": "What are you looking to do?",
      "type": "router",
      "target_entity": null,
      "match_on": null,
      "show_when": [{"field": "category", "op": "eq", "value": "commercial"}],
      "fields": [
        {
          "id": "loan_type",
          "type": "card-select",
          "label": null,
          "required": true,
          "mapped_column": null,
          "width": "full",
          "placeholder": null,
          "visibility_mode": "both",
          "visibility_form_mode": "both",
          "options": [
            {"value": "commercial_bridge", "label": "Bridge", "description": "Short-term bridge for commercial acquisitions", "icon": "Landmark"},
            {"value": "commercial_permanent", "label": "Permanent", "description": "Long-term stabilized commercial financing", "icon": "ShieldCheck"},
            {"value": "commercial_construction", "label": "Construction", "description": "Ground-up or major renovation financing", "icon": "Crane"}
          ]
        }
      ]
    },
    {
      "id": "s3a",
      "title": "Property details",
      "subtitle": "Tell us about the property",
      "type": "form",
      "target_entity": "property",
      "match_on": "address",
      "show_when": [{"field": "category", "op": "eq", "value": "residential"}],
      "fields": [
        {"id": "property_type", "type": "select", "label": "Property type", "required": true, "mapped_column": "property_type", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "sfr", "label": "Single Family"}, {"value": "condo", "label": "Condo"}, {"value": "townhouse", "label": "Townhouse"}, {"value": "2-4_unit", "label": "2-4 Unit"}, {"value": "pud", "label": "PUD"}]},
        {"id": "occupancy", "type": "select", "label": "Occupancy", "required": true, "mapped_column": "property_use", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "investment", "label": "Investment"}, {"value": "owner_occupied", "label": "Owner Occupied"}, {"value": "second_home", "label": "Second Home"}]},
        {"id": "property_address", "type": "text", "label": "Property address", "required": true, "mapped_column": "address", "width": "full", "placeholder": "123 Main St, City, ST 12345", "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "purchase_price", "type": "currency", "label": "Purchase price", "required": true, "mapped_column": "purchase_price", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "arv", "type": "currency", "label": "After repair value (ARV)", "required": false, "mapped_column": "after_repair_value", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"}
      ]
    },
    {
      "id": "s3b",
      "title": "Property details",
      "subtitle": "Tell us about the property",
      "type": "form",
      "target_entity": "property",
      "match_on": "address",
      "show_when": [{"field": "category", "op": "eq", "value": "commercial"}],
      "fields": [
        {"id": "asset_class", "type": "select", "label": "Asset class", "required": true, "mapped_column": "property_type", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "multifamily", "label": "Multi-Family (5+)"}, {"value": "mixed_use", "label": "Mixed Use"}, {"value": "retail", "label": "Retail"}, {"value": "office", "label": "Office"}, {"value": "industrial", "label": "Industrial"}, {"value": "mhc", "label": "MHC / RV Park"}]},
        {"id": "unit_count", "type": "number", "label": "Unit count", "required": false, "mapped_column": "unit_count", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "property_address", "type": "text", "label": "Property address", "required": true, "mapped_column": "address", "width": "full", "placeholder": "123 Main St, City, ST 12345", "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "purchase_price", "type": "currency", "label": "Purchase price", "required": true, "mapped_column": "purchase_price", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "noi", "type": "currency", "label": "Net operating income (NOI)", "required": false, "mapped_column": "noi", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"}
      ]
    },
    {
      "id": "s4",
      "title": "Loan request",
      "subtitle": "Tell us what you need",
      "type": "form",
      "target_entity": "opportunity",
      "match_on": null,
      "show_when": null,
      "fields": [
        {"id": "loan_amount", "type": "currency", "label": "Requested loan amount", "required": true, "mapped_column": "loan_amount", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "ltv_target", "type": "text", "label": "Target LTV", "required": false, "mapped_column": "target_ltv", "width": "half", "placeholder": "e.g. 75%", "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "timeline", "type": "select", "label": "Timeline", "required": false, "mapped_column": "timeline", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "asap", "label": "ASAP (< 2 weeks)"}, {"value": "30_days", "label": "Within 30 days"}, {"value": "60_days", "label": "Within 60 days"}, {"value": "exploring", "label": "Just exploring"}]},
        {"id": "exit_strategy", "type": "select", "label": "Exit strategy", "required": false, "mapped_column": "exit_strategy", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "sell", "label": "Sell"}, {"value": "refinance", "label": "Refinance"}, {"value": "hold", "label": "Hold long-term"}]}
      ]
    },
    {
      "id": "s4a",
      "title": "Rehab details",
      "subtitle": "Tell us about the renovation",
      "type": "form",
      "target_entity": "opportunity",
      "match_on": null,
      "show_when": [{"field": "loan_type", "op": "in", "value": ["fix_flip", "ground_up"]}],
      "fields": [
        {"id": "rehab_budget", "type": "currency", "label": "Rehab budget", "required": true, "mapped_column": "rehab_budget", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "rehab_timeline", "type": "select", "label": "Rehab timeline", "required": false, "mapped_column": "rehab_timeline", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "3_months", "label": "Under 3 months"}, {"value": "3_6_months", "label": "3-6 months"}, {"value": "6_12_months", "label": "6-12 months"}, {"value": "12_plus", "label": "12+ months"}]},
        {"id": "scope", "type": "select", "label": "Scope of work", "required": false, "mapped_column": "scope_of_work", "width": "full", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "cosmetic", "label": "Cosmetic (paint, flooring, fixtures)"}, {"value": "moderate", "label": "Moderate (kitchen/bath remodel, some structural)"}, {"value": "heavy", "label": "Heavy (gut renovation, additions)"}, {"value": "ground_up", "label": "Ground-up new construction"}]}
      ]
    },
    {
      "id": "s4b",
      "title": "Rental details",
      "subtitle": "Tell us about the rental income",
      "type": "form",
      "target_entity": "opportunity",
      "match_on": null,
      "show_when": [{"field": "loan_type", "op": "eq", "value": "dscr"}],
      "fields": [
        {"id": "monthly_rent", "type": "currency", "label": "Monthly rent", "required": true, "mapped_column": "monthly_rent", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "lease_status", "type": "select", "label": "Lease status", "required": false, "mapped_column": "lease_status", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both", "options": [{"value": "leased", "label": "Currently leased"}, {"value": "vacant", "label": "Vacant"}, {"value": "month_to_month", "label": "Month-to-month"}]}
      ]
    },
    {
      "id": "s5",
      "title": "Your information",
      "subtitle": "Tell us about yourself",
      "type": "form",
      "target_entity": "crm_contact",
      "match_on": "email",
      "show_when": null,
      "fields": [
        {"id": "full_name", "type": "text", "label": "Full name", "required": true, "mapped_column": "first_name", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "email", "type": "email", "label": "Email", "required": true, "mapped_column": "email", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "phone", "type": "phone", "label": "Phone", "required": true, "mapped_column": "phone", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "entity_name", "type": "text", "label": "Entity / company name", "required": false, "mapped_column": "company_name", "width": "half", "placeholder": null, "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "experience", "type": "select", "label": "Real estate experience", "required": false, "mapped_column": null, "width": "half", "placeholder": null, "visibility_mode": "external_only", "visibility_form_mode": "both", "options": [{"value": "first_time", "label": "First-time investor"}, {"value": "1_5", "label": "1-5 deals"}, {"value": "6_20", "label": "6-20 deals"}, {"value": "20_plus", "label": "20+ deals"}]},
        {"id": "credit_range", "type": "select", "label": "Credit score range", "required": false, "mapped_column": null, "width": "half", "placeholder": null, "visibility_mode": "external_only", "visibility_form_mode": "both", "options": [{"value": "below_640", "label": "Below 640"}, {"value": "640_679", "label": "640-679"}, {"value": "680_719", "label": "680-719"}, {"value": "720_759", "label": "720-759"}, {"value": "760_plus", "label": "760+"}]},
        {"id": "assigned_to", "type": "select", "label": "Assigned to", "required": false, "mapped_column": "assigned_to", "width": "half", "placeholder": null, "visibility_mode": "internal_only", "visibility_form_mode": "both", "options": []},
        {"id": "source", "type": "select", "label": "Lead source", "required": false, "mapped_column": "lead_source", "width": "half", "placeholder": null, "visibility_mode": "internal_only", "visibility_form_mode": "both", "options": [{"value": "website", "label": "Website"}, {"value": "referral", "label": "Referral"}, {"value": "broker", "label": "Broker"}, {"value": "social_media", "label": "Social Media"}, {"value": "direct", "label": "Direct Outreach"}, {"value": "other", "label": "Other"}]}
      ]
    },
    {
      "id": "s6",
      "title": "Additional details",
      "subtitle": "Anything else we should know?",
      "type": "form",
      "target_entity": null,
      "match_on": null,
      "show_when": null,
      "fields": [
        {"id": "notes", "type": "textarea", "label": "Notes or questions", "required": false, "mapped_column": null, "width": "full", "placeholder": "Tell us anything else about this deal...", "visibility_mode": "both", "visibility_form_mode": "both"},
        {"id": "internal_notes", "type": "textarea", "label": "Internal notes", "required": false, "mapped_column": "internal_notes", "width": "full", "placeholder": "Internal team notes...", "visibility_mode": "internal_only", "visibility_form_mode": "both"},
        {"id": "terms", "type": "checkbox", "label": "I agree to be contacted about this loan request", "required": true, "mapped_column": null, "width": "full", "placeholder": null, "visibility_mode": "external_only", "visibility_form_mode": "both"}
      ]
    }
  ]'::jsonb
);

NOTIFY pgrst, 'reload schema';
