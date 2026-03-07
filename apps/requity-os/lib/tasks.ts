import { createClient } from "@/lib/supabase/client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface OpsTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  linked_entity_label: string | null;
  is_recurring: boolean | null;
  is_active_recurrence: boolean | null;
  recurrence_pattern: string | null;
  recurrence_repeat_interval: number | null;
  recurrence_days_of_week: number[] | null;
  recurrence_day_of_month: number | null;
  recurrence_monthly_when: string | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  next_recurrence_date: string | null;
  recurring_series_id: string | null;
  source_task_id: string | null;
  parent_task_id: string | null;
  created_by: string | null;
  sort_order: number;
  updated_at: string | null;
  created_at: string | null;
  type: "task" | "approval";
  approval_status: string | null;
  active_party: string | null;
  requestor_user_id: string | null;
  requestor_name: string | null;
  amount: number | null;
  decision_note: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  resubmitted_at: string | null;
  revision_count: number | null;
}

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const TASK_STATUSES = ["To Do", "In Progress", "Complete"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["High", "Medium", "Low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_CATEGORIES = [
  "Approval",
  "General",
  "Investments",
  "Investor Relations",
  "Lending Ops",
  "Marketing/Website",
  "Tech/Infrastructure",
] as const;

export const TASK_TYPE_FILTER = ["all", "task", "approval"] as const;
export type TaskTypeFilter = (typeof TASK_TYPE_FILTER)[number];

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  awaiting_revision: "Awaiting Revision",
  resubmitted: "Resubmitted",
  approved: "Approved",
};

export const APPROVAL_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  reviewing: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  awaiting_revision: {
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-400",
  },
  resubmitted: {
    bg: "bg-violet-100 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
  },
  approved: {
    bg: "bg-emerald-100 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Lending Ops": {
    bg: "bg-violet-100 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
  },
  "Tech/Infrastructure": {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  Investments: {
    bg: "bg-amber-100 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  "Investor Relations": {
    bg: "bg-emerald-100 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  "Marketing/Website": {
    bg: "bg-pink-100 dark:bg-pink-950/30",
    text: "text-pink-700 dark:text-pink-400",
  },
  General: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-400",
  },
  Approval: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
  },
};

export const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-destructive",
  Medium: "bg-amber-500",
  Low: "bg-muted-foreground/40",
};

// ── Queries ────────────────────────────────────────────────────────────────

export async function completeTask(taskId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ops_tasks")
    .update({
      status: "Complete",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function completeRecurringTask(taskId: string): Promise<{
  completed: boolean;
  next_created: boolean;
  next_task_id?: string;
  next_due_date?: string;
  error?: string;
}> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("complete_recurring_task", {
    p_task_id: taskId,
  });

  if (error) return { completed: false, next_created: false, error: error.message };
  const result = data as Record<string, unknown>;
  if (result.error) return { completed: false, next_created: false, error: result.error as string };
  return {
    completed: true,
    next_created: result.next_created as boolean,
    next_task_id: result.next_task_id as string | undefined,
    next_due_date: result.next_due_date as string | undefined,
  };
}

export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "Complete") {
    updateData.completed_at = new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }

  const { error } = await supabase
    .from("ops_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ── Utilities ──────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function isDueOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const d = new Date(dueDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

function taskSortWeight(t: OpsTask): number {
  if (t.type === "approval" && t.approval_status === "awaiting_revision") return 0;
  if (t.type === "approval") return 1;
  return 2;
}

export function sortTasksByColumn(tasks: OpsTask[], status: string): OpsTask[] {
  if (status === "Complete") {
    return [...tasks].sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });
  }
  return [...tasks].sort((a, b) => {
    const wa = taskSortWeight(a);
    const wb = taskSortWeight(b);
    if (wa !== wb) return wa - wb;
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });
}

export async function submitApprovalDecision(
  taskId: string,
  decision: "approve" | "reject" | "resubmit",
  userId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("submit_approval_decision", {
    p_task_id: taskId,
    p_decision: decision,
    p_user_id: userId,
    p_note: note || null,
  });

  if (error) return { success: false, error: error.message };
  const result = data as Record<string, unknown>;
  if (result.error) return { success: false, error: result.error as string };
  return { success: true };
}
