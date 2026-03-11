export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string | null;
  entity_type: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WorkflowStage {
  id: string;
  workflow_id: string | null;
  name: string;
  slug: string;
  position: number;
  is_terminal: boolean | null;
  warn_after_days: number | null;
  alert_after_days: number | null;
  borrower_label: string | null;
  created_at: string | null;
}

export interface WorkflowRule {
  id: string;
  workflow_id: string | null;
  name: string;
  is_active: boolean | null;
  trigger_type: string;
  trigger_stage_id: string | null;
  trigger_days: number | null;
  action_type: string;
  task_title_template: string | null;
  task_description: string | null;
  task_category: string | null;
  task_priority: string | null;
  task_is_approval: boolean | null;
  assign_to_role: string | null;
  assign_to_user_id: string | null;
  requestor_role: string | null;
  due_days_offset: number | null;
  due_anchor: string | null;
  notify_roles: string[] | null;
  notify_user_ids: string[] | null;
  notification_title: string | null;
  notification_body: string | null;
  notification_type: string | null;
  is_blocking: boolean | null;
  execution_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const TRIGGER_TYPES = [
  { value: "stage_enter", label: "Stage Enter" },
  { value: "stage_exit", label: "Stage Exit" },
  { value: "approval_approved", label: "Approval Approved" },
  { value: "approval_rejected", label: "Approval Rejected" },
  { value: "approval_resubmitted", label: "Approval Resubmitted" },
  { value: "days_in_stage", label: "Days in Stage" },
] as const;

export const ACTION_TYPES = [
  { value: "create_task", label: "Create Task" },
  { value: "create_approval", label: "Create Approval" },
  { value: "send_notification", label: "Send Notification" },
  { value: "advance_stage", label: "Advance Stage" },
] as const;

export const ASSIGNEE_ROLES = [
  { value: "ceo", label: "CEO" },
  { value: "loan_officer", label: "Loan Officer" },
  { value: "controller", label: "Controller" },
  { value: "borrower", label: "Borrower" },
  { value: "requestor", label: "Requestor" },
] as const;

export const TEMPLATE_VARIABLES = [
  "{{deal_name}}",
  "{{borrower_name}}",
  "{{requestor_name}}",
  "{{amount}}",
  "{{property_address}}",
  "{{loan_number}}",
] as const;
