-- Fix submit_approval_decision RPC to reference ops_tasks instead of non-existent tasks table
create or replace function submit_approval_decision(
  p_task_id   uuid,
  p_decision  text,
  p_user_id   uuid,
  p_note      text default null
) returns jsonb
language plpgsql security definer as $$
declare
  v_task ops_tasks%rowtype;
begin
  select * into v_task from ops_tasks where id = p_task_id;

  if v_task.id is null then
    return jsonb_build_object('success', false, 'error', 'Task not found');
  end if;

  if p_decision = 'approve' then
    update ops_tasks set
      approval_status = 'approved',
      active_party = 'assignee',
      decision_note = p_note,
      approved_at = now(),
      completed_at = now(),
      status = 'Complete',
      updated_at = now()
    where id = p_task_id;

    if v_task.workflow_instance_id is not null then
      perform execute_workflow_trigger(v_task.workflow_instance_id, 'approval_approved', null, p_user_id,
        jsonb_build_object('task_id', p_task_id));
    end if;

  elsif p_decision = 'reject' then
    update ops_tasks set
      approval_status = 'awaiting_revision',
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
    update ops_tasks set
      approval_status = 'resubmitted',
      active_party = 'assignee',
      resubmitted_at = now(),
      revision_count = coalesce(revision_count, 0) + 1,
      updated_at = now()
    where id = p_task_id;

    if v_task.workflow_instance_id is not null then
      perform execute_workflow_trigger(v_task.workflow_instance_id, 'approval_resubmitted', null, p_user_id,
        jsonb_build_object('task_id', p_task_id, 'assignee_user_id', v_task.assigned_to));
    end if;
  else
    return jsonb_build_object('success', false, 'error', 'Invalid decision. Must be approve, reject, or resubmit');
  end if;

  return jsonb_build_object('success', true, 'decision', p_decision);
end;
$$;
