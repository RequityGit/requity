-- Fix: Update ops_projects status check constraint to match UI values
-- The AddProjectDialog.tsx sends PascalCase status values (e.g. "Planning")
-- but the existing constraint (project_tracker_status_check) only allows lowercase values.

-- Step 1: Drop the existing constraint (uses old table name from before rename)
ALTER TABLE ops_projects DROP CONSTRAINT IF EXISTS project_tracker_status_check;

-- Step 2: Update any existing lowercase status values to PascalCase
UPDATE ops_projects SET status = 'Planning' WHERE lower(status) = 'planning';
UPDATE ops_projects SET status = 'Active' WHERE lower(status) = 'active';
UPDATE ops_projects SET status = 'On Hold' WHERE lower(status) IN ('on_hold', 'on hold');
UPDATE ops_projects SET status = 'Completed' WHERE lower(status) = 'completed';
UPDATE ops_projects SET status = 'Cancelled' WHERE lower(status) = 'cancelled';

-- Step 3: Re-create constraint with PascalCase values matching the UI
ALTER TABLE ops_projects ADD CONSTRAINT ops_projects_status_check
  CHECK (status IN (
    'Planning',
    'Active',
    'On Hold',
    'Completed',
    'Cancelled'
  ));
