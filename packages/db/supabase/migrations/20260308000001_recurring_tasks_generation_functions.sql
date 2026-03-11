-- Helper: Calculate next due date from current due date and recurrence config
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  p_recurrence_type TEXT,
  p_current_due DATE,
  p_anchor_day INT,
  p_anchor_month INT,
  p_every_x_months INT,
  p_monthly_mode TEXT,
  p_nth_occurrence INT,
  p_nth_weekday INT
) RETURNS DATE AS $$
DECLARE
  next_date DATE;
  target_month INT;
  target_year INT;
  first_of_month DATE;
  day_count INT;
  found_date DATE;
BEGIN
  CASE p_recurrence_type
    WHEN 'daily' THEN
      next_date := p_current_due + INTERVAL '1 day';

    WHEN 'weekly' THEN
      next_date := p_current_due + INTERVAL '7 days';

    WHEN 'monthly' THEN
      target_month := EXTRACT(MONTH FROM p_current_due)::INT + COALESCE(p_every_x_months, 1);
      target_year := EXTRACT(YEAR FROM p_current_due)::INT;

      WHILE target_month > 12 LOOP
        target_month := target_month - 12;
        target_year := target_year + 1;
      END LOOP;

      IF p_monthly_mode = 'weekday' THEN
        first_of_month := make_date(target_year, target_month, 1);
        day_count := 0;
        found_date := NULL;

        FOR i IN 0..30 LOOP
          IF EXTRACT(DOW FROM first_of_month + (i || ' days')::INTERVAL)::INT = p_nth_weekday THEN
            day_count := day_count + 1;
            IF day_count = p_nth_occurrence THEN
              found_date := first_of_month + (i || ' days')::INTERVAL;
              EXIT;
            END IF;
          END IF;
          EXIT WHEN EXTRACT(MONTH FROM first_of_month + ((i + 1) || ' days')::INTERVAL) != target_month;
        END LOOP;

        next_date := COALESCE(found_date, make_date(target_year, target_month, 28));
      ELSE
        next_date := make_date(target_year, target_month, LEAST(COALESCE(p_anchor_day, 1), 28));
      END IF;

    WHEN 'annually' THEN
      next_date := make_date(
        EXTRACT(YEAR FROM p_current_due)::INT + 1,
        COALESCE(p_anchor_month, 1),
        LEAST(COALESCE(p_anchor_day, 1), 28)
      );
  END CASE;

  RETURN next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main generation function: creates ops_tasks from active templates whose generation date has arrived
CREATE OR REPLACE FUNCTION generate_recurring_tasks() RETURNS void AS $$
DECLARE
  tmpl RECORD;
  prev_incomplete BOOLEAN;
  period_label TEXT;
  new_due DATE;
  new_gen DATE;
BEGIN
  FOR tmpl IN
    SELECT * FROM recurring_task_templates
    WHERE is_active = true
      AND next_generation_date <= CURRENT_DATE
  LOOP
    period_label := CASE tmpl.recurrence_type
      WHEN 'daily' THEN to_char(tmpl.next_due_date, 'Mon DD, YYYY')
      WHEN 'weekly' THEN 'Week of ' || to_char(
        tmpl.next_due_date - ((EXTRACT(DOW FROM tmpl.next_due_date)::INT) || ' days')::INTERVAL,
        'Mon DD'
      )
      WHEN 'monthly' THEN to_char(tmpl.next_due_date, 'FMMonth YYYY')
      WHEN 'annually' THEN to_char(tmpl.next_due_date, 'YYYY')
    END;

    IF EXISTS (
      SELECT 1 FROM ops_tasks
      WHERE recurring_template_id = tmpl.id
        AND recurrence_period = period_label
    ) THEN
      CONTINUE;
    END IF;

    prev_incomplete := EXISTS (
      SELECT 1 FROM ops_tasks
      WHERE recurring_template_id = tmpl.id
        AND status != 'Complete'
        AND due_date < tmpl.next_due_date::TEXT
    );

    INSERT INTO ops_tasks (
      title, description, category, priority, assigned_to,
      recurring_template_id, recurrence_period, due_date, previous_incomplete,
      status, type, is_recurring, sort_order, created_at
    ) VALUES (
      tmpl.title, tmpl.description, tmpl.category, tmpl.priority, tmpl.assigned_to,
      tmpl.id, period_label, tmpl.next_due_date::TEXT, prev_incomplete,
      'To Do', 'task', true, 0, now()
    );

    new_due := calculate_next_due_date(
      tmpl.recurrence_type, tmpl.next_due_date, tmpl.anchor_day,
      tmpl.anchor_month, tmpl.every_x_months, tmpl.monthly_mode,
      tmpl.nth_occurrence, tmpl.nth_weekday
    );
    new_gen := new_due - (tmpl.lead_days || ' days')::INTERVAL;

    UPDATE recurring_task_templates SET
      next_due_date = new_due,
      next_generation_date = new_gen
    WHERE id = tmpl.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
