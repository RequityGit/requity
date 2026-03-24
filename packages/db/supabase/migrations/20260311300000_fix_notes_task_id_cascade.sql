-- Fix: Deleting an ops_task fails because notes.task_id FK has no ON DELETE behavior.
-- Error: "update or delete on table ops_tasks violates foreign key constraint notes_task_id_fkey on table notes"
-- Solution: Drop and recreate the FK with ON DELETE CASCADE so task notes are cleaned up automatically.

-- 1. Fix notes.task_id -> ops_tasks(id) to cascade on delete
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_task_id_fkey;
ALTER TABLE notes
  ADD CONSTRAINT notes_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES ops_tasks(id) ON DELETE CASCADE;

-- 2. Fix ops_tasks.source_task_id -> ops_tasks(id) to SET NULL on delete
-- (prevents deletion failures when a parent recurring task is deleted)
ALTER TABLE ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_source_task_id_fkey;
ALTER TABLE ops_tasks
  ADD CONSTRAINT ops_tasks_source_task_id_fkey
  FOREIGN KEY (source_task_id) REFERENCES ops_tasks(id) ON DELETE SET NULL;

-- 3. Fix note_mentions FK to cascade when the parent note is deleted
-- (prevents orphaned mentions from blocking note deletion)
ALTER TABLE note_mentions DROP CONSTRAINT IF EXISTS note_mentions_note_id_fkey;
ALTER TABLE note_mentions
  ADD CONSTRAINT note_mentions_note_id_fkey
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE;
