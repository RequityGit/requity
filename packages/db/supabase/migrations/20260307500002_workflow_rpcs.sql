-- Workflow RPCs: execute_workflow_trigger, advance_stage, submit_approval_decision

create or replace function execute_workflow_trigger(
  p_instance_id   uuid,
  p_trigger_type  text,
  p_stage_id      uuid,
  p_triggered_by  uuid,
  p_context       jsonb default '{}'::jsonb
) returns void
language plpgsql security definer as $$
declare
  v_rule          workflow_rules%rowtype;
  v_title         text;
  v_due_date      date;
  v_assignee_id   uuid;
begin
  for v_rule in
    select wr.*
    from workflow_rules wr
    join workflow_instances wi on wi.workflow_id = wr.workflow_id
    where wi.id = p_instance_id
      and wr.trigger_type = p_trigger_type
      and (wr.trigger_stage_id = p_stage_id or wr.trigger_stage_id is null)
      and wr.is_active = true
    order by wr.execution_order
  loop
    v_title := v_rule.task_title_template;
    v_title := replace(v_title, '{{deal_name}}',        coalesce(p_context->>'deal_name', ''));
    v_title := replace(v_title, '{{borrower_name}}',    coalesce(p_context->>'borrower_name', ''));
    v_title := replace(v_title, '{{requestor_name}}',   coalesce(p_context->>'requestor_name', ''));
    v_title := replace(v_title, '{{amount}}',           coalesce(p_context->>'amount', ''));
    v_title := replace(v_title, '{{property_address}}', coalesce(p_context->>'property_address', ''));
    v_title := replace(v_title, '{{loan_number}}',      coalesce(p_context->>'loan_number', ''));

    if v_rule.due_days_offset is not null then
      v_due_date := current_date + v_rule.due_days_offset;
    end if;

    v_assignee_id := v_rule.assign_to_user_id;

    if v_rule.action_type in ('create_task', 'create_approval') then
      insert into tasks (
        title, description, type, category, priority, status,
        assignee_user_id, assignee_role, requestor_user_id, active_party,
        amount, workflow_rule_id, workflow_instance_id,
        entity_type, entity_id, due_date
      )
      select
        v_title,
        v_rule.task_description,
        case when v_rule.task_is_approval then 'approval' else 'task' end,
        v_rule.task_category,
        v_rule.task_priority,
        case when v_rule.task_is_approval then 'pending' else 'todo' end,
        v_assignee_id,
        v_rule.assign_to_role,
        p_triggered_by,
        'assignee',
        (p_context->>'amount')::numeric,
        v_rule.id,
        p_instance_id,
        wi.entity_type,
        wi.entity_id,
        v_due_date
      from workflow_instances wi where wi.id = p_instance_id;

    elsif v_rule.action_type = 'send_notification' then
      insert into notifications (
        user_id, notification_slug, title, body, priority, entity_type, entity_id
      )
      select
        unnest(v_rule.notify_user_ids),
        coalesce(v_rule.notification_type, 'workflow_notification'),
        coalesce(v_rule.notification_title, v_title),
        v_rule.notification_body,
        'normal',
        wi.entity_type,
        wi.entity_id
      from workflow_instances wi where wi.id = p_instance_id;
    end if;
  end loop;
end;
$$;

create or replace function advance_stage(
  p_instance_id   uuid,
  p_to_stage_id   uuid,
  p_user_id       uuid,
  p_note          text default null
) returns jsonb
language plpgsql security definer as $$
declare
  v_instance          workflow_instances%rowtype;
  v_blocking_count    integer;
begin
  select * into v_instance from workflow_instances where id = p_instance_id;

  select count(*) into v_blocking_count
  from tasks t
  join workflow_rules wr on wr.id = t.workflow_rule_id
  where t.workflow_instance_id = p_instance_id
    and wr.is_blocking = true
    and t.status not in ('completed', 'approved');

  if v_blocking_count > 0 then
    return jsonb_build_object(
      'success', false,
      'error', format('%s blocking task(s) must be completed before advancing', v_blocking_count)
    );
  end if;

  insert into workflow_stage_history(instance_id, from_stage_id, to_stage_id, transitioned_by, note)
  values (p_instance_id, v_instance.current_stage_id, p_to_stage_id, p_user_id, p_note);

  perform execute_workflow_trigger(p_instance_id, 'stage_exit', v_instance.current_stage_id, p_user_id, '{}'::jsonb);

  update workflow_instances
  set current_stage_id = p_to_stage_id,
      previous_stage_id = v_instance.current_stage_id,
      updated_at = now()
  where id = p_instance_id;

  perform execute_workflow_trigger(p_instance_id, 'stage_enter', p_to_stage_id, p_user_id, '{}'::jsonb);

  if (select is_terminal from workflow_stages where id = p_to_stage_id) then
    update workflow_instances
    set status = 'completed', completed_at = now(), updated_at = now()
    where id = p_instance_id;
  end if;

  return jsonb_build_object('success', true, 'new_stage_id', p_to_stage_id);
end;
$$;

create or replace function submit_approval_decision(
  p_task_id   uuid,
  p_decision  text,
  p_user_id   uuid,
  p_note      text default null
) returns jsonb
language plpgsql security definer as $$
declare
  v_task tasks%rowtype;
begin
  select * into v_task from tasks where id = p_task_id;

  if v_task.id is null then
    return jsonb_build_object('success', false, 'error', 'Task not found');
  end if;

  if p_decision = 'approve' then
    update tasks set
      status = 'approved',
      active_party = 'assignee',
      decision_note = p_note,
      approved_at = now(),
      completed_at = now(),
      updated_at = now()
    where id = p_task_id;

    if v_task.workflow_instance_id is not null then
      perform execute_workflow_trigger(v_task.workflow_instance_id, 'approval_approved', null, p_user_id,
        jsonb_build_object('task_id', p_task_id));
    end if;

  elsif p_decision = 'reject' then
    update tasks set
      status = 'awaiting_revision',
      active_party = 'requestor',
      decision_note = p_note,
      rejected_at = now(),
      updated_at = now()
    where id = p_task_id;

    if v_task.workflow_instance_id is not null then
      perform execute_workflow_trigger(v_task.workflow_instance_id, 'approval_rejected', null, p_user_id,
        jsonb_build_object('task_id', p_task_id, 'requestor_user_id', v_task.requestor_user_id));
    end if;

  elsif p_decision = 'resubmit' then
    update tasks set
      status = 'resubmitted',
      active_party = 'assignee',
      resubmitted_at = now(),
      revision_count = revision_count + 1,
      updated_at = now()
    where id = p_task_id;

    if v_task.workflow_instance_id is not null then
      perform execute_workflow_trigger(v_task.workflow_instance_id, 'approval_resubmitted', null, p_user_id,
        jsonb_build_object('task_id', p_task_id, 'assignee_user_id', v_task.assignee_user_id));
    end if;
  else
    return jsonb_build_object('success', false, 'error', 'Invalid decision. Must be approve, reject, or resubmit');
  end if;

  return jsonb_build_object('success', true, 'decision', p_decision);
end;
$$;
