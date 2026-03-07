CREATE OR REPLACE FUNCTION public.complete_recurring_task(p_task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_task ops_tasks%ROWTYPE;
  v_new_id uuid;
  v_next_date date;
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

    v_next_date := CASE v_task.recurrence_pattern
      WHEN 'daily' THEN CURRENT_DATE + (v_task.recurrence_repeat_interval || ' days')::interval
      WHEN 'weekly' THEN CURRENT_DATE + (v_task.recurrence_repeat_interval * 7 || ' days')::interval
      WHEN 'monthly' THEN CURRENT_DATE + (v_task.recurrence_repeat_interval || ' months')::interval
      ELSE CURRENT_DATE + interval '7 days'
    END;

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
