-- Add check constraints for ops_tasks status and priority columns
-- These were previously free-form text with no database validation.
-- Adding constraints to match the frontend values used in AddTaskDialog.tsx and TaskBoard.tsx.

-- Step 1: Normalize any existing data
UPDATE ops_tasks SET status = 'To Do' WHERE status IS NULL OR status = '';
UPDATE ops_tasks SET priority = 'Medium' WHERE priority IS NULL OR priority = '';

-- Step 2: Add status constraint
ALTER TABLE ops_tasks ADD CONSTRAINT ops_tasks_status_check
  CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Blocked', 'Complete'));

-- Step 3: Add priority constraint
ALTER TABLE ops_tasks ADD CONSTRAINT ops_tasks_priority_check
  CHECK (priority IN ('Critical', 'High', 'Medium', 'Low'));

NOTIFY pgrst, 'reload schema';
