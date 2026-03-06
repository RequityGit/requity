-- Weekly summary materialized view for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS public.weekly_dashboard_summary AS
WITH week_bounds AS (
  SELECT
    date_trunc('week', CURRENT_DATE - interval '7 days')::date AS week_start,
    (date_trunc('week', CURRENT_DATE - interval '7 days') + interval '4 days')::date AS week_end
),
task_stats AS (
  SELECT
    user_id,
    count(*) FILTER (WHERE is_completed AND completed_at::date BETWEEN w.week_start AND w.week_end) AS tasks_completed,
    count(*) FILTER (WHERE created_at::date BETWEEN w.week_start AND w.week_end) AS tasks_created
  FROM public.dashboard_tasks, week_bounds w
  GROUP BY user_id
)
SELECT
  ts.user_id,
  ts.tasks_completed,
  ts.tasks_created,
  to_char(w.week_start, 'Mon DD') || ' - ' || to_char(w.week_end, 'Mon DD') AS period
FROM task_stats ts, week_bounds w;

CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_dashboard_summary_user
  ON public.weekly_dashboard_summary (user_id);
