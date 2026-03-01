-- Fix: Align ops_projects status check constraint with the canonical status list:
-- 'Not Started', 'Planning', 'In Progress', 'Blocked', 'On Hold', 'Complete'

-- Step 1: Drop both possible constraint names (original and from prior migration)
ALTER TABLE ops_projects DROP CONSTRAINT IF EXISTS project_tracker_status_check;
ALTER TABLE ops_projects DROP CONSTRAINT IF EXISTS ops_projects_status_check;

-- Step 2: Normalize any existing data to canonical values
UPDATE ops_projects SET status = 'Not Started' WHERE lower(status) = 'not started';
UPDATE ops_projects SET status = 'Planning' WHERE lower(status) = 'planning';
UPDATE ops_projects SET status = 'In Progress' WHERE lower(status) IN ('in progress', 'in_progress', 'active');
UPDATE ops_projects SET status = 'Blocked' WHERE lower(status) = 'blocked';
UPDATE ops_projects SET status = 'On Hold' WHERE lower(status) IN ('on hold', 'on_hold');
UPDATE ops_projects SET status = 'Complete' WHERE lower(status) IN ('complete', 'completed', 'cancelled');

-- Step 3: Re-create constraint with canonical values
ALTER TABLE ops_projects ADD CONSTRAINT project_tracker_status_check
  CHECK (status = ANY (ARRAY['Not Started','Planning','In Progress','Blocked','On Hold','Complete']));
