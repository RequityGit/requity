-- Tag condition templates that belong to the Loan Intake stage.
-- Only modifies loan_condition_templates (template defaults), NOT
-- existing deal conditions (unified_deal_conditions).

-- Borrower Documents
UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Borrower ID%' OR condition_name ILIKE '%Driver''s License%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%PFS/SREO%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Proof of Liquidity%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Requity Business Purpose%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Experience Worksheet%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Social Security Number%';

-- Property / Deal-Level Documents
UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Rent Roll%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE 'P&L%' OR condition_name ILIKE '%T-12%' OR condition_name ILIKE '%Trailing 12%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%photos%' AND condition_name ILIKE '%walk-through%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Proof of Ownership%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Purchase and Sale Agreement%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Loan Payoff Letter%' OR condition_name ILIKE '%Mortgage Payoff%';

-- Entity Documents
UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Operating Agreement%';

UPDATE loan_condition_templates SET required_stage = 'loan_intake'
WHERE condition_name ILIKE '%Certificate of Good Standing%';
