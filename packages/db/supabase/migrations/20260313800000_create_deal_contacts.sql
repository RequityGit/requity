-- Junction table linking up to 5 CRM contacts to a pipeline deal with roles
CREATE TABLE IF NOT EXISTS deal_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES unified_deals(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'co_borrower')),
  is_guarantor boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 1 CHECK (sort_order BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, contact_id)
);

ALTER TABLE deal_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_deal_contacts"
  ON deal_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
        AND ur.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX idx_deal_contacts_deal ON deal_contacts(deal_id);
CREATE INDEX idx_deal_contacts_contact ON deal_contacts(contact_id);
