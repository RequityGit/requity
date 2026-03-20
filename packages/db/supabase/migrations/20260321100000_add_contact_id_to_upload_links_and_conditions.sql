-- Add contact_id to secure_upload_links so each link is tied to a specific borrower
ALTER TABLE secure_upload_links
  ADD COLUMN contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- Index for lookups by contact
CREATE INDEX idx_secure_upload_links_contact ON secure_upload_links(contact_id) WHERE contact_id IS NOT NULL;

-- Also add contact_id to unified_deal_conditions so conditions can be assigned to specific borrowers
-- NULL = deal-level condition (goes to primary contact), non-null = borrower-specific condition
ALTER TABLE unified_deal_conditions
  ADD COLUMN assigned_contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL;

CREATE INDEX idx_deal_conditions_assigned_contact ON unified_deal_conditions(assigned_contact_id) WHERE assigned_contact_id IS NOT NULL;
