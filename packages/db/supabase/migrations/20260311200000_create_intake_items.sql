-- Intake Items: structured email intake with 4-entity parsing and match results
-- Bridges email_intake_queue (raw emails) to pipeline (unified_deals) with
-- entity-level merge decisions for contacts, companies, properties, and opportunities.

CREATE TABLE intake_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_intake_queue_id UUID REFERENCES email_intake_queue(id),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  raw_body TEXT,

  -- Structured fields extracted by AI, keyed by entity
  parsed_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Match candidates found at ingestion time
  -- Shape: { contact: {match_id, confidence, matched_on[]}, company: {...}, property: {...}, opportunity: {...} }
  auto_matches JSONB DEFAULT '{}'::jsonb,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'dismissed')),

  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),

  -- The entity modes + field choices made at review time
  decisions JSONB,

  -- IDs of records created/updated during processing
  created_deal_id UUID REFERENCES unified_deals(id),
  created_contact_id UUID REFERENCES crm_contacts(id),
  created_company_id UUID REFERENCES companies(id),
  created_property_id UUID REFERENCES properties(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_intake_items_status ON intake_items(status);
CREATE INDEX idx_intake_items_created ON intake_items(created_at DESC);
CREATE INDEX idx_intake_items_queue_id ON intake_items(email_intake_queue_id);

-- RLS: admin/super_admin only
ALTER TABLE intake_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage intake items"
  ON intake_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Updated_at trigger
CREATE TRIGGER set_intake_items_updated_at
  BEFORE UPDATE ON intake_items
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
