-- Migration 003: Alter crm_contacts — add new CRM columns
-- Adds lifecycle stage tracking, marketing consent, company linkage, and integration IDs.

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS lifecycle_stage lifecycle_stage_enum,
  ADD COLUMN IF NOT EXISTS lifecycle_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS dnc boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dnc_reason text,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS postmark_contact_id text,
  ADD COLUMN IF NOT EXISTS twilio_contact_id text;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lifecycle_stage ON crm_contacts (lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_marketing_consent ON crm_contacts (marketing_consent);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_dnc ON crm_contacts (dnc);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON crm_contacts (company_id);
