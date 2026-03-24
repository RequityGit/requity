-- Tag specific condition template items as loan_intake stage.
-- These are the intake/application documents that borrowers provide upfront.
-- Only updates required_stage; does NOT change category.

-- Borrower Documents: loan intake items
UPDATE loan_condition_templates
SET required_stage = 'loan_intake', updated_at = now()
WHERE is_active = true
  AND required_stage = 'processing'
  AND (
    condition_name ILIKE '%driver%license%'
    OR condition_name ILIKE '%government id%'
    OR condition_name ILIKE '%borrower id%'
    OR condition_name ILIKE '%pfs%'
    OR condition_name ILIKE '%personal financial statement%'
    OR condition_name ILIKE '%schedule of real estate%'
    OR condition_name ILIKE '%sreo%'
    OR condition_name ILIKE '%proof of liquidity%'
    OR condition_name ILIKE '%business purpose loan form%'
    OR condition_name ILIKE '%experience worksheet%'
    OR condition_name ILIKE '%social security%'
    OR condition_name ILIKE '%ssn%'
  );

-- Property Documents: loan intake items
UPDATE loan_condition_templates
SET required_stage = 'loan_intake', updated_at = now()
WHERE is_active = true
  AND required_stage = 'processing'
  AND (
    condition_name ILIKE '%rent roll%'
    OR condition_name ILIKE '%trailing 12%'
    OR condition_name ILIKE '%t12%'
    OR condition_name ILIKE '%t-12%'
    OR condition_name ILIKE '%property photos%'
    OR condition_name ILIKE '%proof of ownership%'
    OR condition_name ILIKE '%county records%'
    OR condition_name ILIKE '%purchase contract%'
    OR condition_name ILIKE '%sales agreement%'
    OR condition_name ILIKE '%psa%'
    OR condition_name ILIKE '%mortgage%payoff%'
    OR condition_name ILIKE '%payoff statement%'
  );

-- Entity Documents: loan intake items
UPDATE loan_condition_templates
SET required_stage = 'loan_intake', updated_at = now()
WHERE is_active = true
  AND required_stage = 'processing'
  AND (
    condition_name ILIKE '%operating agreement%'
    OR condition_name ILIKE '%formation doc%'
    OR condition_name ILIKE '%certificate of good standing%'
  );
