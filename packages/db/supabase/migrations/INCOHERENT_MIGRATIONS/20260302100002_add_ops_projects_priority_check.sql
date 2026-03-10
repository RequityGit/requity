-- Add check constraint for ops_projects priority column
-- ops_projects already has status and category constraints but was missing priority.
-- Adding to match the frontend values used in AddProjectDialog.tsx.

-- Step 1: Normalize any existing data
UPDATE ops_projects SET priority = 'Medium' WHERE priority IS NULL OR priority = '';

-- Step 2: Add priority constraint
ALTER TABLE ops_projects ADD CONSTRAINT ops_projects_priority_check
  CHECK (priority IN ('Critical', 'High', 'Medium', 'Low'));

NOTIFY pgrst, 'reload schema';
