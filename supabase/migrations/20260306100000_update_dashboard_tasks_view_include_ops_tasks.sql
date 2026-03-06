-- Update dashboard_tasks_view to include ops_tasks so the dashboard
-- "Your Tasks" section syncs with the operations task manager.
CREATE OR REPLACE VIEW dashboard_tasks_view AS
-- Original dashboard_tasks
SELECT
  t.id,
  t.user_id,
  t.loan_id,
  t.title,
  t.category,
  t.due_date,
  t.is_completed,
  t.completed_at,
  t.created_at,
  t.updated_at,
  l.property_address AS loan_name,
  l.loan_number,
  CASE
    WHEN t.due_date < CURRENT_DATE AND t.is_completed = false THEN true
    ELSE false
  END AS is_past_due,
  CASE
    WHEN t.due_date < CURRENT_DATE AND t.is_completed = false THEN CURRENT_DATE - t.due_date
    ELSE NULL::integer
  END AS days_overdue,
  'dashboard_task' AS source
FROM dashboard_tasks t
LEFT JOIN loans l ON l.id = t.loan_id

UNION ALL

-- ops_tasks synced into the dashboard
SELECT
  ot.id,
  ot.assigned_to AS user_id,
  CASE WHEN ot.linked_entity_type = 'loan' THEN ot.linked_entity_id ELSE NULL END AS loan_id,
  ot.title,
  COALESCE(ot.category, 'general') AS category,
  ot.due_date,
  (ot.status = 'Complete') AS is_completed,
  ot.completed_at,
  ot.created_at,
  ot.updated_at,
  CASE
    WHEN ot.linked_entity_type = 'loan' THEN l2.property_address
    ELSE ot.linked_entity_label
  END AS loan_name,
  l2.loan_number,
  CASE
    WHEN ot.due_date IS NOT NULL AND ot.due_date < CURRENT_DATE AND ot.status != 'Complete' THEN true
    ELSE false
  END AS is_past_due,
  CASE
    WHEN ot.due_date IS NOT NULL AND ot.due_date < CURRENT_DATE AND ot.status != 'Complete' THEN CURRENT_DATE - ot.due_date
    ELSE NULL::integer
  END AS days_overdue,
  'ops_task' AS source
FROM ops_tasks ot
LEFT JOIN loans l2 ON ot.linked_entity_type = 'loan' AND l2.id = ot.linked_entity_id
WHERE ot.assigned_to IS NOT NULL;
