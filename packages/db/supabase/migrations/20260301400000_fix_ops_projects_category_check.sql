-- Fix: Update ops_projects category check constraint to match UI values
-- The AddProjectDialog.tsx sends PascalCase category values (e.g. "Engineering")
-- but the existing constraint only allows lowercase values, causing insert failures.

-- Step 1: Drop the existing constraint
ALTER TABLE ops_projects DROP CONSTRAINT IF EXISTS ops_projects_category_check;

-- Step 2: Update any existing lowercase category values to PascalCase
UPDATE ops_projects SET category = initcap(category)
WHERE category IS NOT NULL AND category != initcap(category);

-- Handle special cases that initcap doesn't cover
UPDATE ops_projects SET category = 'HR' WHERE lower(category) = 'hr';
UPDATE ops_projects SET category = 'IT' WHERE lower(category) = 'it';
UPDATE ops_projects SET category = 'Capital Markets' WHERE lower(category) IN ('capital_markets', 'capital markets');
UPDATE ops_projects SET category = 'General' WHERE lower(category) = 'general';

-- Step 3: Re-create constraint with PascalCase values matching the UI
ALTER TABLE ops_projects ADD CONSTRAINT ops_projects_category_check
  CHECK (category IN (
    'Engineering',
    'Marketing',
    'Finance',
    'Operations',
    'Compliance',
    'Legal',
    'Sales',
    'HR',
    'Underwriting',
    'Servicing',
    'Capital Markets',
    'IT',
    'General'
  ));
