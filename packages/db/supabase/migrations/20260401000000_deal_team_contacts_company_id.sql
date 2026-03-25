-- Add company_id FK to deal_team_contacts for proper company relationship
-- (manual_company text field kept as fallback)

ALTER TABLE deal_team_contacts
  ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX idx_deal_team_contacts_company ON deal_team_contacts(company_id);
