-- =============================================================================
-- Update Recurring Task RPCs
-- =============================================================================
-- Adds support for:
--   - recurrence_repeat_interval on all patterns (every N days/weeks/months/years)
--   - annually_date:MM:DD pattern for annual on specific month+day
--   - monthly patterns using structured columns via generate_next_recurring_task
--   - complete_recurring_task now handles monthly_day, monthly_nth, annually_date
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. UPDATE generate_next_recurring_task
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_next_recurring_task(task_id uuid)
RETURNS jsonb AS $$
DECLARE
  src ops_tasks%ROWTYPE;
  next_due date;
  new_id uuid;
  series_id uuid;
  pattern_parts text[];
  nth_val int;
  dow_val int;
  day_val int;
  month_val int;
  ref_month date;
  candidate date;
  repeat_n int;
BEGIN
  SELECT * INTO src FROM ops_tasks WHERE id = task_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Task not found');
  END IF;

  IF NOT src.is_recurring THEN
    RETURN jsonb_build_object('error', 'Task is not recurring');
  END IF;

  IF NOT COALESCE(src.is_active_recurrence, true) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Recurrence is paused');
  END IF;

  series_id := COALESCE(src.recurring_series_id, src.id);
  repeat_n := GREATEST(COALESCE(src.recurrence_repeat_interval, 1), 1);

  -- Calculate next due date from the CURRENT due date (fixed schedule)
  IF src.due_date IS NULL THEN
    next_due := CURRENT_DATE;

  ELSIF src.recurrence_pattern LIKE 'monthly_nth:%' THEN
    -- Pattern: monthly_nth:N:DOW (e.g. monthly_nth:1:1 = 1st Monday)
    pattern_parts := string_to_array(src.recurrence_pattern, ':');
    nth_val := pattern_parts[2]::int;
    dow_val := pattern_parts[3]::int;
    ref_month := (date_trunc('month', src.due_date) + (repeat_n || ' months')::interval)::date;
    next_due := find_nth_weekday_in_month(
      EXTRACT(YEAR FROM ref_month)::int,
      EXTRACT(MONTH FROM ref_month)::int,
      dow_val, nth_val
    );
    WHILE next_due IS NULL LOOP
      ref_month := (ref_month + INTERVAL '1 month')::date;
      next_due := find_nth_weekday_in_month(
        EXTRACT(YEAR FROM ref_month)::int,
        EXTRACT(MONTH FROM ref_month)::int,
        dow_val, nth_val
      );
    END LOOP;

  ELSIF src.recurrence_pattern LIKE 'monthly_day:%' THEN
    -- Pattern: monthly_day:DD (e.g. monthly_day:15 = 15th of each month)
    day_val := (string_to_array(src.recurrence_pattern, ':'))[2]::int;
    ref_month := (date_trunc('month', src.due_date) + (repeat_n || ' months')::interval)::date;
    candidate := ref_month + (LEAST(day_val, EXTRACT(DAY FROM (ref_month + INTERVAL '1 month' - INTERVAL '1 day'))::int) - 1) * INTERVAL '1 day';
    next_due := candidate::date;

  ELSIF src.recurrence_pattern LIKE 'annually_date:%' THEN
    -- Pattern: annually_date:MM:DD (e.g. annually_date:2:15 = March 15, 0-indexed month)
    pattern_parts := string_to_array(src.recurrence_pattern, ':');
    month_val := pattern_parts[2]::int + 1; -- convert 0-indexed to 1-indexed
    day_val := pattern_parts[3]::int;
    BEGIN
      next_due := make_date(
        EXTRACT(YEAR FROM src.due_date)::int + repeat_n,
        month_val,
        LEAST(day_val, 28) -- safe for Feb
      );
    EXCEPTION WHEN OTHERS THEN
      next_due := make_date(
        EXTRACT(YEAR FROM src.due_date)::int + repeat_n,
        month_val,
        28
      );
    END;

  ELSE
    next_due := CASE src.recurrence_pattern
      WHEN 'daily'     THEN src.due_date + (repeat_n || ' days')::interval
      WHEN 'weekly'    THEN src.due_date + (repeat_n * 7 || ' days')::interval
      WHEN 'biweekly'  THEN src.due_date + INTERVAL '2 weeks'
      WHEN 'monthly'   THEN src.due_date + (repeat_n || ' months')::interval
      WHEN 'quarterly' THEN src.due_date + INTERVAL '3 months'
      WHEN 'annually'  THEN src.due_date + (repeat_n || ' years')::interval
      ELSE NULL
    END;
  END IF;

  IF next_due IS NULL THEN
    RETURN jsonb_build_object('error', 'Unknown recurrence pattern');
  END IF;

  -- If next_due is in the past, advance until future
  WHILE next_due < CURRENT_DATE LOOP
    IF src.recurrence_pattern LIKE 'monthly_nth:%' THEN
      pattern_parts := string_to_array(src.recurrence_pattern, ':');
      nth_val := pattern_parts[2]::int;
      dow_val := pattern_parts[3]::int;
      ref_month := (date_trunc('month', next_due) + (repeat_n || ' months')::interval)::date;
      next_due := NULL;
      WHILE next_due IS NULL LOOP
        next_due := find_nth_weekday_in_month(
          EXTRACT(YEAR FROM ref_month)::int,
          EXTRACT(MONTH FROM ref_month)::int,
          dow_val, nth_val
        );
        IF next_due IS NULL THEN
          ref_month := (ref_month + INTERVAL '1 month')::date;
        END IF;
      END LOOP;
    ELSIF src.recurrence_pattern LIKE 'monthly_day:%' THEN
      day_val := (string_to_array(src.recurrence_pattern, ':'))[2]::int;
      ref_month := (date_trunc('month', next_due) + (repeat_n || ' months')::interval)::date;
      next_due := (ref_month + (LEAST(day_val, EXTRACT(DAY FROM (ref_month + INTERVAL '1 month' - INTERVAL '1 day'))::int) - 1) * INTERVAL '1 day')::date;
    ELSIF src.recurrence_pattern LIKE 'annually_date:%' THEN
      pattern_parts := string_to_array(src.recurrence_pattern, ':');
      month_val := pattern_parts[2]::int + 1;
      day_val := pattern_parts[3]::int;
      BEGIN
        next_due := make_date(
          EXTRACT(YEAR FROM next_due)::int + repeat_n,
          month_val,
          LEAST(day_val, 28)
        );
      EXCEPTION WHEN OTHERS THEN
        next_due := make_date(
          EXTRACT(YEAR FROM next_due)::int + repeat_n,
          month_val,
          28
        );
      END;
    ELSE
      next_due := CASE src.recurrence_pattern
        WHEN 'daily'     THEN next_due + (repeat_n || ' days')::interval
        WHEN 'weekly'    THEN next_due + (repeat_n * 7 || ' days')::interval
        WHEN 'biweekly'  THEN next_due + INTERVAL '2 weeks'
        WHEN 'monthly'   THEN next_due + (repeat_n || ' months')::interval
        WHEN 'quarterly' THEN next_due + INTERVAL '3 months'
        WHEN 'annually'  THEN next_due + (repeat_n || ' years')::interval
      END;
    END IF;
  END LOOP;

  -- Check end date
  IF src.recurrence_end_date IS NOT NULL AND next_due > src.recurrence_end_date THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Past recurrence end date');
  END IF;

  -- Duplicate prevention
  IF EXISTS (
    SELECT 1 FROM ops_tasks
    WHERE recurring_series_id = series_id
      AND due_date = next_due
      AND status != 'Complete'
  ) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Task for this date already exists');
  END IF;

  new_id := gen_random_uuid();

  INSERT INTO ops_tasks (
    id, title, description, status, priority,
    assigned_to, assigned_to_name, project_id, due_date,
    category, linked_entity_type, linked_entity_id, linked_entity_label,
    is_recurring, recurrence_pattern, recurrence_end_date,
    recurrence_repeat_interval, recurrence_days_of_week,
    recurrence_day_of_month, recurrence_monthly_when,
    recurrence_start_date, next_recurrence_date,
    is_active_recurrence, recurring_series_id, source_task_id,
    created_by, created_at
  ) VALUES (
    new_id,
    src.title,
    src.description,
    'To Do',
    src.priority,
    src.assigned_to,
    src.assigned_to_name,
    src.project_id,
    next_due,
    src.category,
    src.linked_entity_type,
    src.linked_entity_id,
    src.linked_entity_label,
    true,
    src.recurrence_pattern,
    src.recurrence_end_date,
    src.recurrence_repeat_interval,
    src.recurrence_days_of_week,
    src.recurrence_day_of_month,
    src.recurrence_monthly_when,
    src.recurrence_start_date,
    next_due,
    src.is_active_recurrence,
    series_id,
    src.id,
    src.created_by,
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_task_id', new_id,
    'next_due_date', next_due::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- 2. UPDATE complete_recurring_task
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_recurring_task(p_task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task ops_tasks%ROWTYPE;
  v_new_id uuid;
  v_next_date date;
  v_repeat_n int;
  v_pattern_parts text[];
  v_nth_val int;
  v_dow_val int;
  v_day_val int;
  v_month_val int;
  v_ref_month date;
BEGIN
  SELECT * INTO v_task FROM ops_tasks WHERE id = p_task_id FOR UPDATE;

  IF v_task IS NULL THEN
    RETURN jsonb_build_object('error', 'Task not found');
  END IF;

  UPDATE ops_tasks
  SET status = 'Complete', completed_at = now(), updated_at = now()
  WHERE id = p_task_id;

  IF v_task.is_active_recurrence = true
     AND (v_task.recurrence_end_date IS NULL OR v_task.recurrence_end_date > CURRENT_DATE) THEN

    v_repeat_n := GREATEST(COALESCE(v_task.recurrence_repeat_interval, 1), 1);

    -- Calculate next date based on pattern
    IF v_task.recurrence_pattern LIKE 'monthly_nth:%' THEN
      v_pattern_parts := string_to_array(v_task.recurrence_pattern, ':');
      v_nth_val := v_pattern_parts[2]::int;
      v_dow_val := v_pattern_parts[3]::int;
      v_ref_month := (date_trunc('month', COALESCE(v_task.due_date, CURRENT_DATE)) + (v_repeat_n || ' months')::interval)::date;
      v_next_date := find_nth_weekday_in_month(
        EXTRACT(YEAR FROM v_ref_month)::int,
        EXTRACT(MONTH FROM v_ref_month)::int,
        v_dow_val, v_nth_val
      );
      WHILE v_next_date IS NULL OR v_next_date <= CURRENT_DATE LOOP
        v_ref_month := (v_ref_month + INTERVAL '1 month')::date;
        v_next_date := find_nth_weekday_in_month(
          EXTRACT(YEAR FROM v_ref_month)::int,
          EXTRACT(MONTH FROM v_ref_month)::int,
          v_dow_val, v_nth_val
        );
      END LOOP;

    ELSIF v_task.recurrence_pattern LIKE 'monthly_day:%' THEN
      v_day_val := (string_to_array(v_task.recurrence_pattern, ':'))[2]::int;
      v_ref_month := (date_trunc('month', COALESCE(v_task.due_date, CURRENT_DATE)) + (v_repeat_n || ' months')::interval)::date;
      v_next_date := (v_ref_month + (LEAST(v_day_val, EXTRACT(DAY FROM (v_ref_month + INTERVAL '1 month' - INTERVAL '1 day'))::int) - 1) * INTERVAL '1 day')::date;
      WHILE v_next_date <= CURRENT_DATE LOOP
        v_ref_month := (v_ref_month + (v_repeat_n || ' months')::interval)::date;
        v_next_date := (v_ref_month + (LEAST(v_day_val, EXTRACT(DAY FROM (v_ref_month + INTERVAL '1 month' - INTERVAL '1 day'))::int) - 1) * INTERVAL '1 day')::date;
      END LOOP;

    ELSIF v_task.recurrence_pattern LIKE 'annually_date:%' THEN
      v_pattern_parts := string_to_array(v_task.recurrence_pattern, ':');
      v_month_val := v_pattern_parts[2]::int + 1;
      v_day_val := v_pattern_parts[3]::int;
      BEGIN
        v_next_date := make_date(
          EXTRACT(YEAR FROM CURRENT_DATE)::int + v_repeat_n,
          v_month_val,
          LEAST(v_day_val, 28)
        );
      EXCEPTION WHEN OTHERS THEN
        v_next_date := make_date(
          EXTRACT(YEAR FROM CURRENT_DATE)::int + v_repeat_n,
          v_month_val,
          28
        );
      END;
      -- If that date is still in the past, advance
      WHILE v_next_date <= CURRENT_DATE LOOP
        BEGIN
          v_next_date := make_date(
            EXTRACT(YEAR FROM v_next_date)::int + v_repeat_n,
            v_month_val,
            LEAST(v_day_val, 28)
          );
        EXCEPTION WHEN OTHERS THEN
          v_next_date := make_date(
            EXTRACT(YEAR FROM v_next_date)::int + v_repeat_n,
            v_month_val,
            28
          );
        END;
      END LOOP;

    ELSE
      v_next_date := CASE v_task.recurrence_pattern
        WHEN 'daily' THEN CURRENT_DATE + (v_repeat_n || ' days')::interval
        WHEN 'weekly' THEN CURRENT_DATE + (v_repeat_n * 7 || ' days')::interval
        WHEN 'biweekly' THEN CURRENT_DATE + INTERVAL '2 weeks'
        WHEN 'monthly' THEN CURRENT_DATE + (v_repeat_n || ' months')::interval
        WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
        WHEN 'annually' THEN CURRENT_DATE + (v_repeat_n || ' years')::interval
        ELSE CURRENT_DATE + interval '7 days'
      END;
    END IF;

    IF v_task.recurrence_end_date IS NOT NULL AND v_next_date > v_task.recurrence_end_date THEN
      UPDATE ops_tasks SET is_active_recurrence = false WHERE id = p_task_id;
      RETURN jsonb_build_object('completed', true, 'next_created', false);
    END IF;

    v_new_id := gen_random_uuid();

    INSERT INTO ops_tasks (
      id, title, description, status, priority, assigned_to, assigned_to_name,
      created_by, project_id, due_date, category,
      linked_entity_type, linked_entity_id, linked_entity_label,
      is_recurring, is_active_recurrence, recurrence_pattern,
      recurrence_repeat_interval, recurrence_days_of_week,
      recurrence_day_of_month, recurrence_monthly_when,
      recurrence_start_date, recurrence_end_date, next_recurrence_date,
      recurring_series_id, source_task_id, sort_order
    ) VALUES (
      v_new_id, v_task.title, v_task.description, 'To Do', v_task.priority,
      v_task.assigned_to, v_task.assigned_to_name,
      v_task.created_by, v_task.project_id, v_next_date, v_task.category,
      v_task.linked_entity_type, v_task.linked_entity_id, v_task.linked_entity_label,
      true, true, v_task.recurrence_pattern,
      v_task.recurrence_repeat_interval, v_task.recurrence_days_of_week,
      v_task.recurrence_day_of_month, v_task.recurrence_monthly_when,
      v_task.recurrence_start_date, v_task.recurrence_end_date, v_next_date,
      COALESCE(v_task.recurring_series_id, v_task.id), p_task_id, 0
    );

    RETURN jsonb_build_object('completed', true, 'next_created', true, 'next_task_id', v_new_id, 'next_due_date', v_next_date);
  END IF;

  RETURN jsonb_build_object('completed', true, 'next_created', false);
END;
$$;
