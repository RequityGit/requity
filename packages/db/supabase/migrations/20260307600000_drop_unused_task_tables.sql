-- Migration: Drop unused task tables and consolidate on ops_tasks
--
-- Drops: tasks, task_comments, task_documents, crm_tasks, dashboard_tasks, unified_deal_tasks
-- Updates: update_user_streak function, weekly_dashboard_summary, crm_contact_timeline, crm_upcoming_items

-- 1. Update update_user_streak to use ops_tasks instead of dashboard_tasks
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_incomplete_today int;
  v_last_date date;
  v_current int;
  v_best int;
BEGIN
  SELECT count(*) INTO v_incomplete_today
  FROM public.ops_tasks
  WHERE assigned_to = p_user_id
    AND due_date <= CURRENT_DATE
    AND status <> 'Complete';

  IF v_incomplete_today = 0 THEN
    SELECT last_completed_date, current_streak, best_streak
    INTO v_last_date, v_current, v_best
    FROM public.user_streaks
    WHERE user_id = p_user_id;

    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE - 1 THEN
      v_current := 1;
    ELSIF v_last_date = CURRENT_DATE - 1 THEN
      v_current := COALESCE(v_current, 0) + 1;
    END IF;

    IF v_last_date IS DISTINCT FROM CURRENT_DATE THEN
      INSERT INTO public.user_streaks (user_id, current_streak, best_streak, last_completed_date, updated_at)
      VALUES (p_user_id, v_current, GREATEST(v_current, COALESCE(v_best, 0)), CURRENT_DATE, now())
      ON CONFLICT (user_id) DO UPDATE SET
        current_streak = v_current,
        best_streak = GREATEST(v_current, COALESCE(public.user_streaks.best_streak, 0)),
        last_completed_date = CURRENT_DATE,
        updated_at = now();
    END IF;
  END IF;
END;
$$;

-- 2. Drop all dependent views
DROP VIEW IF EXISTS public.dashboard_tasks_view;
DROP VIEW IF EXISTS public.crm_contact_timeline;
DROP VIEW IF EXISTS public.crm_upcoming_items;
DROP MATERIALIZED VIEW IF EXISTS public.weekly_dashboard_summary;

-- 3. Drop tables with FK dependencies on 'tasks' first
DROP TABLE IF EXISTS public.task_comments;
DROP TABLE IF EXISTS public.task_documents;

-- 4. Drop the empty tables
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.crm_tasks;
DROP TABLE IF EXISTS public.dashboard_tasks;
DROP TABLE IF EXISTS public.unified_deal_tasks;

-- 5. Drop unused enum types
DROP TYPE IF EXISTS public.crm_task_priority;
DROP TYPE IF EXISTS public.crm_task_status;
DROP TYPE IF EXISTS public.crm_task_type;

-- 6. Recreate weekly_dashboard_summary using ops_tasks
CREATE MATERIALIZED VIEW public.weekly_dashboard_summary AS
WITH week_bounds AS (
  SELECT (date_trunc('week', CURRENT_DATE - '7 days'::interval))::date AS week_start,
         (date_trunc('week', CURRENT_DATE - '7 days'::interval) + '4 days'::interval)::date AS week_end
), task_stats AS (
  SELECT ot.assigned_to AS user_id,
    count(*) FILTER (WHERE ot.status = 'Complete'
      AND (ot.completed_at::date >= w.week_start)
      AND (ot.completed_at::date <= w.week_end)) AS tasks_completed,
    count(*) FILTER (WHERE (ot.created_at::date >= w.week_start)
      AND (ot.created_at::date <= w.week_end)) AS tasks_created
  FROM ops_tasks ot, week_bounds w
  WHERE ot.assigned_to IS NOT NULL
  GROUP BY ot.assigned_to
)
SELECT ts.user_id,
  ts.tasks_completed,
  ts.tasks_created,
  (to_char(w.week_start::timestamptz, 'Mon DD') || ' - ' || to_char(w.week_end::timestamptz, 'Mon DD')) AS period
FROM task_stats ts, week_bounds w;

-- 7. Recreate crm_contact_timeline using ops_tasks
CREATE OR REPLACE VIEW public.crm_contact_timeline AS
SELECT a.id,
    'activity'::text AS item_type,
    a.activity_type AS sub_type,
    a.subject AS title,
    a.description AS body,
    a.contact_id,
    a.company_id,
    a.performed_by AS actor_id,
    p_actor.name AS actor_name,
    COALESCE(a.scheduled_at, a.created_at) AS occurred_at,
    a.created_at,
    a.is_completed,
    NULL::text AS priority,
    NULL::text AS task_status,
    (a.direction)::text AS direction,
    a.metadata
   FROM (crm_activities a
     LEFT JOIN profiles p_actor ON ((a.performed_by = p_actor.id)))
  WHERE (a.deleted_at IS NULL)
UNION ALL
SELECT ot.id,
    'task'::text AS item_type,
    COALESCE(ot.category, 'general') AS sub_type,
    ot.title,
    ot.description AS body,
    CASE WHEN ot.linked_entity_type = 'contact' THEN ot.linked_entity_id ELSE NULL END AS contact_id,
    CASE WHEN ot.linked_entity_type = 'company' THEN ot.linked_entity_id ELSE NULL END AS company_id,
    ot.assigned_to AS actor_id,
    p_assign.name AS actor_name,
    COALESCE(ot.due_date::timestamp with time zone, ot.created_at) AS occurred_at,
    ot.created_at,
    (ot.status = 'Complete') AS is_completed,
    ot.priority,
    ot.status AS task_status,
    NULL::text AS direction,
    jsonb_build_object('assigned_by', ot.created_by, 'completed_at', ot.completed_at) AS metadata
   FROM (ops_tasks ot
     LEFT JOIN profiles p_assign ON ((ot.assigned_to = p_assign.id)))
  WHERE ot.linked_entity_type IN ('contact', 'company')
UNION ALL
SELECT e.id,
    'event'::text AS item_type,
    (e.event_type)::text AS sub_type,
    e.subject AS title,
    e.description AS body,
    e.contact_id,
    e.company_id,
    e.created_by AS actor_id,
    p_creator.name AS actor_name,
    e.start_at AS occurred_at,
    e.created_at,
    (e.end_at < now()) AS is_completed,
    NULL::text AS priority,
    NULL::text AS task_status,
    NULL::text AS direction,
    jsonb_build_object('location', e.location, 'end_at', e.end_at, 'is_all_day', e.is_all_day) AS metadata
   FROM (crm_events e
     LEFT JOIN profiles p_creator ON ((e.created_by = p_creator.id)))
  WHERE (e.deleted_at IS NULL)
UNION ALL
SELECT n.id,
    'note'::text AS item_type,
    CASE WHEN n.is_pinned THEN 'pinned'::text ELSE 'post'::text END AS sub_type,
    NULL::text AS title,
    n.body,
    n.contact_id,
    n.company_id,
    n.author_id AS actor_id,
    p_author.name AS actor_name,
    n.created_at AS occurred_at,
    n.created_at,
    NULL::boolean AS is_completed,
    NULL::text AS priority,
    NULL::text AS task_status,
    NULL::text AS direction,
    jsonb_build_object('is_edited', n.is_edited, 'is_internal', n.is_internal, 'reply_count', (
      SELECT count(*) FROM notes r WHERE r.parent_note_id = n.id AND r.deleted_at IS NULL
    )) AS metadata
   FROM (notes n
     LEFT JOIN profiles p_author ON ((n.author_id = p_author.id)))
  WHERE n.deleted_at IS NULL AND n.parent_note_id IS NULL;

-- 8. Recreate crm_upcoming_items using ops_tasks
CREATE OR REPLACE VIEW public.crm_upcoming_items AS
SELECT ot.id,
    'task'::text AS item_type,
    COALESCE(ot.category, 'general') AS sub_type,
    ot.title,
    CASE WHEN ot.linked_entity_type = 'contact' THEN ot.linked_entity_id ELSE NULL END AS contact_id,
    CASE WHEN ot.linked_entity_type = 'company' THEN ot.linked_entity_id ELSE NULL END AS company_id,
    ot.assigned_to,
    p_assign.name AS assigned_to_name,
    ot.priority::text AS priority,
    ot.status::text AS task_status,
    ot.due_date::timestamp with time zone AS due_at,
    CASE
        WHEN ot.due_date < CURRENT_DATE THEN 'overdue'::text
        WHEN ot.due_date = CURRENT_DATE THEN 'due_today'::text
        WHEN ot.due_date <= (CURRENT_DATE + '7 days'::interval) THEN 'due_this_week'::text
        ELSE 'upcoming'::text
    END AS urgency,
    CASE WHEN ot.linked_entity_type = 'contact' THEN ot.linked_entity_label ELSE NULL END AS contact_name,
    CASE WHEN ot.linked_entity_type = 'company' THEN ot.linked_entity_label ELSE NULL END AS company_name
   FROM (ops_tasks ot
     LEFT JOIN profiles p_assign ON ((ot.assigned_to = p_assign.id)))
  WHERE ot.status <> 'Complete' AND ot.due_date IS NOT NULL
    AND ot.linked_entity_type IN ('contact', 'company')
UNION ALL
SELECT e.id,
    'event'::text AS item_type,
    (e.event_type)::text AS sub_type,
    e.subject AS title,
    e.contact_id,
    e.company_id,
    e.created_by AS assigned_to,
    p_creator.name AS assigned_to_name,
    NULL::text AS priority,
    NULL::text AS task_status,
    e.start_at AS due_at,
    CASE
        WHEN (e.start_at)::date < CURRENT_DATE THEN 'past'::text
        WHEN (e.start_at)::date = CURRENT_DATE THEN 'today'::text
        WHEN (e.start_at)::date <= (CURRENT_DATE + '7 days'::interval) THEN 'this_week'::text
        ELSE 'upcoming'::text
    END AS urgency,
    ((c.first_name || ' '::text) || c.last_name) AS contact_name,
    comp.name AS company_name
   FROM (((crm_events e
     LEFT JOIN profiles p_creator ON ((e.created_by = p_creator.id)))
     LEFT JOIN crm_contacts c ON ((e.contact_id = c.id)))
     LEFT JOIN companies comp ON ((e.company_id = comp.id)))
  WHERE e.deleted_at IS NULL
    AND e.start_at >= (now() - '1 day'::interval)
    AND e.start_at <= (now() + '30 days'::interval);
