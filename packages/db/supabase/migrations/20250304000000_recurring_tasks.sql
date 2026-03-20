-- =============================================================================
-- Recurring Tasks Migration
-- =============================================================================
-- Adds proper recurring task series management to ops_tasks:
--   - Series tracking (recurring_series_id, source_task_id)
--   - End date support (recurrence_end_date)
--   - Pause/stop support (is_active_recurrence)
--   - RPC function for generating next occurrence with fixed-schedule dates
--   - Removes any existing auto-generation trigger
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. DROP EXISTING AUTO-GENERATION TRIGGER (if any)
-- ---------------------------------------------------------------------------
-- The old trigger auto-generated tasks on completion, causing confusion.
-- We replace it with explicit frontend-driven generation via RPC.
-- Try several common naming patterns defensively.
DROP TRIGGER IF EXISTS trigger_generate_recurring_task ON ops_tasks;
DROP TRIGGER IF EXISTS trg_generate_recurring_task ON ops_tasks;
DROP TRIGGER IF EXISTS generate_next_recurring_task_trigger ON ops_tasks;
DROP TRIGGER IF EXISTS on_task_complete_generate_recurring ON ops_tasks;
DROP TRIGGER IF EXISTS recurring_task_trigger ON ops_tasks;
DROP FUNCTION IF EXISTS auto_generate_recurring_task() CASCADE;

-- ---------------------------------------------------------------------------
-- 2. ADD RECURRING SERIES COLUMNS
-- ---------------------------------------------------------------------------
ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS recurring_series_id uuid;
ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES ops_tasks(id);
ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS recurrence_end_date date;
ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS is_active_recurrence boolean DEFAULT true;

-- Indexes for efficient series lookups
CREATE INDEX IF NOT EXISTS idx_ops_tasks_recurring_series_id ON ops_tasks(recurring_series_id);
CREATE INDEX IF NOT EXISTS idx_ops_tasks_source_task_id ON ops_tasks(source_task_id);

-- ---------------------------------------------------------------------------
-- 3. BACKFILL EXISTING RECURRING TASKS
-- ---------------------------------------------------------------------------
-- Set recurring_series_id = id for existing root recurring tasks
UPDATE ops_tasks
SET recurring_series_id = id
WHERE is_recurring = true
  AND recurring_series_id IS NULL;

-- ---------------------------------------------------------------------------
-- 4. RPC FUNCTION: generate_next_recurring_task
-- ---------------------------------------------------------------------------
-- Called explicitly from the frontend when a recurring task is completed.
-- Uses fixed-schedule date calculation (next due date based on current due
-- date, NOT the completion date).
-- Returns jsonb with result details for frontend toast messages.
-- Helper: find the Nth occurrence of a weekday (0=Sun..6=Sat) in a given month.
-- nth=-1 means "last occurrence".
CREATE OR REPLACE FUNCTION find_nth_weekday_in_month(
  p_year int, p_month int, p_dow int, p_nth int
) RETURNS date AS $$
DECLARE
  first_of_month date;
  first_dow int;
  target_day int;
  last_day int;
BEGIN
  first_of_month := make_date(p_year, p_month, 1);
  first_dow := EXTRACT(DOW FROM first_of_month)::int;  -- 0=Sun
  last_day := EXTRACT(DAY FROM (first_of_month + INTERVAL '1 month' - INTERVAL '1 day'))::int;

  IF p_nth = -1 THEN
    -- Last occurrence: start from last day, walk backwards
    target_day := last_day - ((EXTRACT(DOW FROM make_date(p_year, p_month, last_day))::int - p_dow + 7) % 7);
  ELSE
    -- Nth occurrence: first occurrence + (n-1)*7
    target_day := 1 + ((p_dow - first_dow + 7) % 7) + (p_nth - 1) * 7;
    IF target_day > last_day THEN
      RETURN NULL;  -- e.g., no 5th Monday in this month
    END IF;
  END IF;

  RETURN make_date(p_year, p_month, target_day);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


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
  ref_month date;
  candidate date;
BEGIN
  SELECT * INTO src FROM ops_tasks WHERE id = task_id;

  -- Guard: task must exist and be recurring
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Task not found');
  END IF;

  IF NOT src.is_recurring THEN
    RETURN jsonb_build_object('error', 'Task is not recurring');
  END IF;

  IF NOT COALESCE(src.is_active_recurrence, true) THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Recurrence is paused');
  END IF;

  -- Determine series_id
  series_id := COALESCE(src.recurring_series_id, src.id);

  -- Calculate next due date from the CURRENT due date (fixed schedule)
  IF src.due_date IS NULL THEN
    next_due := CURRENT_DATE;
  ELSIF src.recurrence_pattern LIKE 'monthly_nth:%' THEN
    -- Pattern: monthly_nth:N:DOW  (e.g. monthly_nth:1:1 = 1st Monday)
    pattern_parts := string_to_array(src.recurrence_pattern, ':');
    nth_val := pattern_parts[2]::int;
    dow_val := pattern_parts[3]::int;
    -- Start from the next month after current due date
    ref_month := (date_trunc('month', src.due_date) + INTERVAL '1 month')::date;
    next_due := find_nth_weekday_in_month(
      EXTRACT(YEAR FROM ref_month)::int,
      EXTRACT(MONTH FROM ref_month)::int,
      dow_val, nth_val
    );
    -- If the Nth weekday doesn't exist in that month (e.g. 5th Monday), skip to next
    WHILE next_due IS NULL LOOP
      ref_month := (ref_month + INTERVAL '1 month')::date;
      next_due := find_nth_weekday_in_month(
        EXTRACT(YEAR FROM ref_month)::int,
        EXTRACT(MONTH FROM ref_month)::int,
        dow_val, nth_val
      );
    END LOOP;
  ELSIF src.recurrence_pattern LIKE 'monthly_day:%' THEN
    -- Pattern: monthly_day:DD  (e.g. monthly_day:15 = 15th of each month)
    day_val := (string_to_array(src.recurrence_pattern, ':'))[2]::int;
    ref_month := (date_trunc('month', src.due_date) + INTERVAL '1 month')::date;
    -- Clamp day to last day of month (e.g. day 31 in Feb → 28/29)
    candidate := ref_month + (LEAST(day_val, EXTRACT(DAY FROM (ref_month + INTERVAL '1 month' - INTERVAL '1 day'))::int) - 1) * INTERVAL '1 day';
    next_due := candidate::date;
  ELSE
    next_due := CASE src.recurrence_pattern
      WHEN 'daily'     THEN src.due_date + INTERVAL '1 day'
      WHEN 'weekly'    THEN src.due_date + INTERVAL '1 week'
      WHEN 'biweekly'  THEN src.due_date + INTERVAL '2 weeks'
      WHEN 'monthly'   THEN src.due_date + INTERVAL '1 month'
      WHEN 'quarterly' THEN src.due_date + INTERVAL '3 months'
      WHEN 'annually'  THEN src.due_date + INTERVAL '1 year'
      ELSE NULL
    END;
  END IF;

  IF next_due IS NULL THEN
    RETURN jsonb_build_object('error', 'Unknown recurrence pattern');
  END IF;

  -- If next_due is in the past (task was overdue), advance until future
  WHILE next_due < CURRENT_DATE LOOP
    IF src.recurrence_pattern LIKE 'monthly_nth:%' THEN
      pattern_parts := string_to_array(src.recurrence_pattern, ':');
      nth_val := pattern_parts[2]::int;
      dow_val := pattern_parts[3]::int;
      ref_month := (date_trunc('month', next_due) + INTERVAL '1 month')::date;
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
      ref_month := (date_trunc('month', next_due) + INTERVAL '1 month')::date;
      next_due := (ref_month + (LEAST(day_val, EXTRACT(DAY FROM (ref_month + INTERVAL '1 month' - INTERVAL '1 day'))::int) - 1) * INTERVAL '1 day')::date;
    ELSE
      next_due := CASE src.recurrence_pattern
        WHEN 'daily'     THEN next_due + INTERVAL '1 day'
        WHEN 'weekly'    THEN next_due + INTERVAL '1 week'
        WHEN 'biweekly'  THEN next_due + INTERVAL '2 weeks'
        WHEN 'monthly'   THEN next_due + INTERVAL '1 month'
        WHEN 'quarterly' THEN next_due + INTERVAL '3 months'
        WHEN 'annually'  THEN next_due + INTERVAL '1 year'
      END;
    END IF;
  END LOOP;

  -- Check if the series has an end date and we've passed it
  IF src.recurrence_end_date IS NOT NULL AND next_due > src.recurrence_end_date THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'Past recurrence end date');
  END IF;

  -- Duplicate prevention: check if a non-complete task already exists for this date
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
