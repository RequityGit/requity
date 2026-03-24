-- Add "Parking Lot" to the ops_tasks status CHECK constraint.
-- The frontend added this status but no migration was created.

ALTER TABLE ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_status_check;
ALTER TABLE ops_tasks ADD CONSTRAINT ops_tasks_status_check
  CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Blocked', 'Pending Approval', 'Complete', 'Parking Lot'));
