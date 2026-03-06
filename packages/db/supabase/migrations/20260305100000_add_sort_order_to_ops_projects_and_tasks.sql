-- Add sort_order column to ops_projects
ALTER TABLE ops_projects ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Add sort_order column to ops_tasks
ALTER TABLE ops_tasks ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Initialize sort_order for existing projects based on created_at
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM ops_projects
)
UPDATE ops_projects SET sort_order = ranked.rn
FROM ranked WHERE ops_projects.id = ranked.id;

-- Initialize sort_order for existing tasks based on created_at, per project
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) AS rn
  FROM ops_tasks
)
UPDATE ops_tasks SET sort_order = ranked.rn
FROM ranked WHERE ops_tasks.id = ranked.id;
