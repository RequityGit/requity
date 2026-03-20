-- RLS policies for workflow engine tables
alter table workflow_definitions enable row level security;
alter table workflow_stages enable row level security;
alter table workflow_rules enable row level security;
alter table workflow_instances enable row level security;
alter table workflow_stage_history enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table task_documents enable row level security;

create policy "admin_all_workflow_definitions" on workflow_definitions for all using (is_admin());
create policy "admin_all_workflow_stages" on workflow_stages for all using (is_admin());
create policy "admin_all_workflow_rules" on workflow_rules for all using (is_admin());
create policy "admin_all_workflow_instances" on workflow_instances for all using (is_admin());
create policy "admin_all_stage_history" on workflow_stage_history for all using (is_admin());
create policy "admin_all_tasks" on tasks for all using (is_admin());
create policy "admin_all_task_comments" on task_comments for all using (is_admin());
create policy "admin_all_task_documents" on task_documents for all using (is_admin());

create policy "authenticated_read_workflow_definitions" on workflow_definitions for select using (auth.role() = 'authenticated');
create policy "authenticated_read_workflow_stages" on workflow_stages for select using (auth.role() = 'authenticated');

create policy "borrower_own_tasks" on tasks for select
  using ((select auth.uid()) = requestor_user_id or (select auth.uid()) = assignee_user_id);
create policy "borrower_own_comments" on task_comments for select
  using (
    is_internal = false
    and task_id in (select id from tasks where requestor_user_id = (select auth.uid()))
  );
