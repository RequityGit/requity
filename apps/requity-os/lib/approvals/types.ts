// Approval Workflow Types

export type ApprovalStatus = "pending" | "approved" | "changes_requested" | "declined" | "cancelled";
export type ApprovalPriority = "low" | "normal" | "high" | "urgent";
export type ApprovalEntityType = "loan" | "draw_request" | "payoff" | "exception" | "investor_distribution" | "opportunity" | "condition";
export type ApprovalAuditAction =
  | "submitted"
  | "approved"
  | "declined"
  | "changes_requested"
  | "reassigned"
  | "sla_breached"
  | "cancelled"
  | "resubmitted";

export interface ApprovalRequest {
  id: string;
  created_at: string;
  updated_at: string;
  entity_type: ApprovalEntityType;
  entity_id: string;
  submitted_by: string;
  assigned_to: string;
  status: ApprovalStatus;
  priority: ApprovalPriority;
  sla_deadline: string | null;
  sla_breached: boolean;
  decision_at: string | null;
  decision_notes: string | null;
  deal_snapshot: Record<string, unknown>;
  submission_notes: string | null;
  checklist_results: Record<string, unknown>;
  task_id: string | null;
}

export interface ApprovalRequestWithProfiles extends ApprovalRequest {
  submitter_name: string | null;
  submitter_email: string | null;
  approver_name: string | null;
  approver_email: string | null;
}

export interface ApprovalRoutingRule {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  name: string;
  entity_type: string;
  priority_order: number;
  conditions: Record<string, unknown>;
  approver_id: string;
  fallback_approver_id: string | null;
  sla_hours: number;
  auto_priority: string;
}

export interface ApprovalAuditLogEntry {
  id: string;
  created_at: string;
  approval_id: string;
  action: ApprovalAuditAction;
  performed_by: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  deal_snapshot: Record<string, unknown>;
}

export interface ApprovalAuditLogEntryWithProfile extends ApprovalAuditLogEntry {
  performer_name: string | null;
}

export interface ApprovalChecklist {
  id: string;
  created_at: string;
  is_active: boolean;
  entity_type: string;
  name: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  field: string;
  rule: string;
  label: string;
}

export interface ChecklistResult {
  label: string;
  field: string;
  passed: boolean;
  reason?: string;
  /** Field input type for inline editing in the approval dialog */
  field_type?: "currency" | "percent" | "number" | "text" | "boolean" | "select" | "date";
  /** Dropdown options (when field_type is "select") */
  options?: string[];
  /** Special fields that need custom UI instead of UwField */
  is_special?: "borrower_picker" | "loan_amount";
}

export interface RoutingResult {
  approver_id: string;
  fallback_approver_id: string | null;
  sla_hours: number;
  auto_priority: ApprovalPriority;
  rule_name: string;
}

// SLA defaults by priority
export const SLA_HOURS: Record<ApprovalPriority, number> = {
  low: 48,
  normal: 24,
  high: 12,
  urgent: 4,
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  changes_requested: "Changes Requested",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const APPROVAL_PRIORITY_LABELS: Record<ApprovalPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const APPROVAL_PRIORITY_COLORS: Record<ApprovalPriority, { bg: string; text: string; badge: string }> = {
  urgent: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  high: { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
  normal: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
  low: { bg: "bg-gray-50", text: "text-gray-600", badge: "bg-gray-100 text-gray-600" },
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, { bg: string; text: string; badge: string }> = {
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-800" },
  approved: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100 text-green-800" },
  changes_requested: { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
  declined: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-800" },
  cancelled: { bg: "bg-gray-50", text: "text-gray-600", badge: "bg-gray-100 text-gray-600" },
};

export const ENTITY_TYPE_LABELS: Record<ApprovalEntityType, string> = {
  loan: "Loan",
  draw_request: "Draw Request",
  payoff: "Payoff",
  exception: "Exception",
  investor_distribution: "Investor Distribution",
  opportunity: "Deal",
  condition: "Condition",
};
