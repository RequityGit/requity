-- Deal team contacts (broker, title company, insurance, appraiser, etc.)
-- Optional link to crm_contacts; supports manual name/company/phone/email.

CREATE TABLE IF NOT EXISTS deal_team_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  manual_name TEXT DEFAULT '',
  manual_company TEXT DEFAULT '',
  manual_phone TEXT DEFAULT '',
  manual_email TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_deal_team_contacts_deal ON deal_team_contacts(deal_id);

COMMENT ON TABLE deal_team_contacts IS 'External deal team (broker, title, insurance, appraiser, etc.). contact_id optional; manual_* used when not linked to CRM.';

-- RLS
ALTER TABLE deal_team_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can CRUD deal_team_contacts"
  ON deal_team_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger (function may already exist from other migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_deal_team_contacts_updated_at
  BEFORE UPDATE ON deal_team_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
