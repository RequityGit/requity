-- Allow company-only activities without requiring a contact reference
ALTER TABLE crm_activities ALTER COLUMN contact_id DROP NOT NULL;
