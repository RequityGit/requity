-- Add company_id FK to company_wire_instructions
ALTER TABLE company_wire_instructions
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id);

-- Create index for lookup
CREATE INDEX IF NOT EXISTS idx_company_wire_instructions_company_id
ON company_wire_instructions(company_id);
