-- Task Approval Workflow
-- Adds ad-hoc approval capability to regular tasks (type='task').
-- A task with requires_approval=true follows: To Do -> In Progress -> Pending Approval -> Complete

-- ============================================================
-- 1. Add approval columns to ops_tasks
-- ============================================================

ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false;
ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS approver_id uuid REFERENCES auth.users(id);
ALTER TABLE ops_tasks ADD COLUMN IF NOT EXISTS approval_instructions text;

-- ============================================================
-- 2. Add "Pending Approval" to status CHECK constraint
-- ============================================================

ALTER TABLE ops_tasks DROP CONSTRAINT IF EXISTS ops_tasks_status_check;
ALTER TABLE ops_tasks ADD CONSTRAINT ops_tasks_status_check
  CHECK (status IN ('To Do', 'In Progress', 'In Review', 'Blocked', 'Pending Approval', 'Complete'));

-- ============================================================
-- 3. Create task_approvals table
-- ============================================================

CREATE TABLE IF NOT EXISTS task_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES ops_tasks(id) ON DELETE CASCADE,
  approver_id uuid NOT NULL REFERENCES auth.users(id),
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  approval_instructions text,
  approval_note text,
  rejection_reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_approvals_task_id ON task_approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_task_approvals_approver_id ON task_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_task_approvals_status ON task_approvals(approval_status);

-- updated_at trigger
CREATE TRIGGER set_updated_at_task_approvals
  BEFORE UPDATE ON task_approvals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. RLS Policies on task_approvals
-- ============================================================

ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;

-- Admins/super_admins have full access
CREATE POLICY "Admins can do everything on task_approvals"
  ON task_approvals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin')
        AND ur.is_active = true
    )
  );

-- Approver can view and update their approvals
CREATE POLICY "Approver can view own approvals"
  ON task_approvals FOR SELECT
  USING (auth.uid() = approver_id OR auth.uid() = created_by);

CREATE POLICY "Approver can update own approvals"
  ON task_approvals FOR UPDATE
  USING (auth.uid() = approver_id);

-- Creator can insert
CREATE POLICY "Creator can insert approvals"
  ON task_approvals FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- 5. Status transition enforcement trigger
-- ============================================================

CREATE OR REPLACE FUNCTION validate_task_approval_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Block direct completion of approval-required tasks (must go through Pending Approval)
  IF OLD.requires_approval = true
    AND NEW.status = 'Complete'
    AND OLD.status != 'Pending Approval'
  THEN
    RAISE EXCEPTION 'Approval tasks must go through Pending Approval before completion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_task_approval_status
  BEFORE UPDATE OF status ON ops_tasks
  FOR EACH ROW
  WHEN (OLD.requires_approval = true)
  EXECUTE FUNCTION validate_task_approval_status();

-- ============================================================
-- 6. Notification types for task approval workflow
-- ============================================================

INSERT INTO public.notification_types (
  id, slug, display_name, description, category,
  default_email_enabled, default_in_app_enabled,
  applicable_roles, default_priority,
  email_subject_template, email_body_template,
  is_active, sort_order
) VALUES
  (gen_random_uuid(), 'task-approval-requested', 'Task Approval Requested',
   'When a task is submitted for your approval', 'operations',
   false, true, ARRAY['admin', 'super_admin'], 'normal',
   '{{creator_name}} submitted "{{task_title}}" for your approval',
   'A task has been submitted for your approval: "{{task_title}}"',
   true, 500),
  (gen_random_uuid(), 'task-approval-approved', 'Task Approved',
   'When your task is approved', 'operations',
   false, true, ARRAY['admin', 'super_admin'], 'normal',
   '"{{task_title}}" has been approved',
   '{{approver_name}} approved your task: "{{task_title}}"',
   true, 501),
  (gen_random_uuid(), 'task-approval-revision-requested', 'Task Revision Requested',
   'When changes are requested on your task', 'operations',
   false, true, ARRAY['admin', 'super_admin'], 'high',
   'Revision requested on "{{task_title}}"',
   '{{approver_name}} requested revisions on "{{task_title}}"',
   true, 502),
  (gen_random_uuid(), 'task-approval-rejected', 'Task Rejected',
   'When your task is rejected', 'operations',
   false, true, ARRAY['admin', 'super_admin'], 'high',
   '"{{task_title}}" has been rejected',
   '{{approver_name}} rejected your task: "{{task_title}}"',
   true, 503),
  (gen_random_uuid(), 'task-approval-overridden', 'Task Approval Override',
   'When a super admin overrides approval on your task', 'operations',
   false, true, ARRAY['admin', 'super_admin'], 'normal',
   '"{{task_title}}" approved via override',
   '{{admin_name}} approved "{{task_title}}" as a super admin override',
   true, 504)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
