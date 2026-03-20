-- Migration 004: Add FK from companies back to crm_contacts
-- Now that both tables exist, we can safely add the circular foreign key.

ALTER TABLE companies
  ADD CONSTRAINT fk_companies_primary_contact
  FOREIGN KEY (primary_contact_id) REFERENCES crm_contacts(id) ON DELETE SET NULL;
