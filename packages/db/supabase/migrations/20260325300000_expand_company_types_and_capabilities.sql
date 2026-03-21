-- Add new company_type_enum values for expanded company types
-- These match the Salesforce company type picklist
ALTER TYPE company_type_enum ADD VALUE IF NOT EXISTS 'borrower';
ALTER TYPE company_type_enum ADD VALUE IF NOT EXISTS 'bank';
ALTER TYPE company_type_enum ADD VALUE IF NOT EXISTS 'agency_lender';
ALTER TYPE company_type_enum ADD VALUE IF NOT EXISTS 'correspondent';
ALTER TYPE company_type_enum ADD VALUE IF NOT EXISTS 'amc';
