-- Add broker_contact_id to unified_deals for linking broker contacts
ALTER TABLE unified_deals
ADD COLUMN IF NOT EXISTS broker_contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- Index for join performance
CREATE INDEX IF NOT EXISTS idx_unified_deals_broker_contact_id
ON unified_deals(broker_contact_id) WHERE broker_contact_id IS NOT NULL;
