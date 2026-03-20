-- Migration: Add sequential CON/COM numbers to crm_contacts and companies
-- Follows the same pattern as rl_number_seq / RL1100 for deals/loans.
-- Contacts get CON1000+, Companies get COM1000+.

-- =========================================================================
-- 1. Create sequences starting at 1000
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS con_number_seq START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS com_number_seq START WITH 1000;

-- =========================================================================
-- 2. Add columns (nullable initially for backfill)
-- =========================================================================
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE companies    ADD COLUMN IF NOT EXISTS company_number TEXT;

-- =========================================================================
-- 3. Backfill crm_contacts ordered by created_at
-- =========================================================================
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM crm_contacts
)
UPDATE crm_contacts c
SET contact_number = 'CON' || (999 + o.rn)::TEXT
FROM ordered o
WHERE c.id = o.id;

-- =========================================================================
-- 4. Backfill companies ordered by created_at
-- =========================================================================
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM companies
)
UPDATE companies co
SET company_number = 'COM' || (999 + o.rn)::TEXT
FROM ordered o
WHERE co.id = o.id;

-- =========================================================================
-- 5. Advance sequences past the last assigned number
-- =========================================================================
SELECT setval('con_number_seq',
  GREATEST(
    999 + COALESCE((SELECT COUNT(*) FROM crm_contacts), 0),
    1000
  )
);

SELECT setval('com_number_seq',
  GREATEST(
    999 + COALESCE((SELECT COUNT(*) FROM companies), 0),
    1000
  )
);

-- =========================================================================
-- 6. Add NOT NULL and UNIQUE constraints
-- =========================================================================
ALTER TABLE crm_contacts ALTER COLUMN contact_number SET NOT NULL;
ALTER TABLE crm_contacts ADD CONSTRAINT crm_contacts_contact_number_key UNIQUE (contact_number);

ALTER TABLE companies ALTER COLUMN company_number SET NOT NULL;
ALTER TABLE companies ADD CONSTRAINT companies_company_number_key UNIQUE (company_number);

-- =========================================================================
-- 7. Create trigger function for crm_contacts
-- =========================================================================
CREATE OR REPLACE FUNCTION generate_contact_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.contact_number IS NULL OR NEW.contact_number = '' THEN
    NEW.contact_number := 'CON' || nextval('con_number_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_contact_number ON crm_contacts;
CREATE TRIGGER trg_generate_contact_number
  BEFORE INSERT ON crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contact_number();

-- =========================================================================
-- 8. Create trigger function for companies
-- =========================================================================
CREATE OR REPLACE FUNCTION generate_company_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.company_number IS NULL OR NEW.company_number = '' THEN
    NEW.company_number := 'COM' || nextval('com_number_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_company_number ON companies;
CREATE TRIGGER trg_generate_company_number
  BEFORE INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION generate_company_number();

-- =========================================================================
-- 9. Add indexes for fast lookups by number
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_crm_contacts_contact_number ON crm_contacts (contact_number);
CREATE INDEX IF NOT EXISTS idx_companies_company_number ON companies (company_number);
