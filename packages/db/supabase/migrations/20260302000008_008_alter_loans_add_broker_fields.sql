-- Migration 008: Alter loans — add broker fields
-- Adds broker sourcing tracking to the loans table.

ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS broker_sourced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loans_broker_sourced ON loans (broker_sourced);
CREATE INDEX IF NOT EXISTS idx_loans_broker_contact_id ON loans (broker_contact_id);
