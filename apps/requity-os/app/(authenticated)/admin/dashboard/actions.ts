"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

// ── Types ──────────────────────────────────────────────────────────────────

export interface DashboardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface BorrowerRequest {
  id: string;
  requested_by: string;
  loan_id: string;
  borrower_name: string;
  description: string;
  sent_at: string;
  follow_up_count: number;
  last_follow_up_at: string | null;
  resolved_at: string | null;
  created_at: string;
  loan_name: string | null;
  loan_number: string | null;
  days_since_sent: number;
  status: string;
}

export interface UserStreak {
  current_streak: number;
  best_streak: number;
  last_completed_date: string | null;
}

export interface PendingApproval {
  id: string;
  entity_id: string;
  entity_type: string;
  priority: string;
  status: string;
  created_at: string;
  sla_deadline: string | null;
  sla_breached: boolean | null;
  submission_notes: string | null;
  deal_snapshot: Record<string, unknown>;
  wait_days: number;
}

export interface DealLogEntry {
  id: string;
  loan_id: string;
  action: string;
  description: string;
  created_at: string;
  loan_number: string | null;
  property_address: string | null;
}

export interface WeeklySummary {
  tasks_completed: number;
  tasks_created: number;
  period: string;
}

export interface ActionDashboardData {
  tasks: DashboardTask[];
  borrowerRequests: BorrowerRequest[];
  streak: UserStreak;
  pendingApprovals: PendingApproval[];
  dealLog: DealLogEntry[];
  weeklySummary: WeeklySummary | null;
  userName: string;
}

// ── Fetch all dashboard data ───────────────────────────────────────────────

export async function fetchActionDashboardData(): Promise<
  { data: ActionDashboardData } | { error: string }
> {
  try {
    const { getSessionData } = await import("@/lib/auth/session-cache");
    const session = await getSessionData();
    if (!session) return { error: "Not authenticated" };

    const user = session.user;
    const profile = session.profile;

    const supabase = createClient();

    // Fetch tasks assigned to user
    const { data: tasks } = await supabase
      .from("ops_tasks")
      .select("*")
      .eq("assigned_to", user.id)
      .neq("status", "Complete")
      .order("due_date", { ascending: true });

    // Fetch borrower requests from the view
    const { data: borrowerRequests } = await supabase
      .from("borrower_requests_view")
      .select("*")
      .eq("requested_by", user.id)
      .order("sent_at", { ascending: true });

    // Fetch streak
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak, best_streak, last_completed_date")
      .eq("user_id", user.id)
      .single();

    // Fetch pending approvals assigned to user
    const { data: approvals } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("assigned_to", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    // Compute wait_days for approvals
    const now = new Date();
    const pendingApprovals: PendingApproval[] = (approvals || []).map((a) => ({
      id: a.id,
      entity_id: a.entity_id,
      entity_type: a.entity_type,
      priority: a.priority,
      status: a.status,
      created_at: a.created_at,
      sla_deadline: a.sla_deadline,
      sla_breached: a.sla_breached,
      submission_notes: a.submission_notes,
      deal_snapshot: (a.deal_snapshot as Record<string, unknown>) || {},
      wait_days: Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(a.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      ),
    }));

    // Fetch recent deal activity log
    const { data: activityLog } = await supabase
      .from("loan_activity_log")
      .select("id, loan_id, action, description, created_at, loans(loan_number, property_address)")
      .in("action", ["stage_change", "document_upload", "missing_doc", "condition_update"])
      .order("created_at", { ascending: false })
      .limit(10);

    const dealLog: DealLogEntry[] = (activityLog || []).map((entry) => {
      const loan = (entry as Record<string, unknown>).loans as Record<string, unknown> | null;
      return {
        id: entry.id,
        loan_id: entry.loan_id,
        action: entry.action,
        description: entry.description,
        created_at: entry.created_at,
        loan_number: loan?.loan_number as string | null,
        property_address: loan?.property_address as string | null,
      };
    });

    // Fetch weekly summary
    const { data: weeklyData } = await supabase
      .from("weekly_dashboard_summary")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return {
      data: {
        tasks: (tasks as DashboardTask[]) || [],
        borrowerRequests: (borrowerRequests as BorrowerRequest[]) || [],
        streak: {
          current_streak: streakData?.current_streak ?? 0,
          best_streak: streakData?.best_streak ?? 0,
          last_completed_date: streakData?.last_completed_date ?? null,
        },
        pendingApprovals,
        dealLog,
        weeklySummary: weeklyData
          ? {
              tasks_completed: Number(weeklyData.tasks_completed) || 0,
              tasks_created: Number(weeklyData.tasks_created) || 0,
              period: String(weeklyData.period || ""),
            }
          : null,
        userName: (profile?.full_name as string) || "there",
      },
    };
  } catch (err) {
    console.error("fetchActionDashboardData error:", err);
    return { error: "Failed to load dashboard data" };
  }
}

// ── Toggle task completion ─────────────────────────────────────────────────

export async function toggleTask(
  taskId: string,
  isCompleted: boolean
): Promise<{ success: boolean } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return { error: auth.error ?? "Not authorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("ops_tasks")
      .update({
        status: isCompleted ? "Complete" : "To Do",
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .eq("assigned_to", auth.user.id);

    if (error) return { error: error.message };

    // Update streak if completing
    if (isCompleted) {
      const { error: streakErr } = await admin.rpc("update_user_streak", { p_user_id: auth.user.id });
      if (streakErr) {
        console.error("toggleTask: failed to update streak", streakErr);
      }
    }

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    console.error("toggleTask error:", err);
    return { error: "Failed to toggle task" };
  }
}

// ── Create a new task ──────────────────────────────────────────────────────

export async function createTask(input: {
  title: string;
  category: string;
  due_date: string;
  loan_id?: string;
}): Promise<{ success: boolean; id?: string } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return { error: auth.error ?? "Not authorized" };

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("ops_tasks")
      .insert({
        title: input.title,
        category: input.category,
        due_date: input.due_date,
        status: "To Do",
        priority: "Medium",
        assigned_to: auth.user.id,
        created_by: auth.user.id,
        linked_entity_type: input.loan_id ? "loan" : null,
        linked_entity_id: input.loan_id || null,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/admin/dashboard");
    return { success: true, id: data.id };
  } catch (err) {
    console.error("createTask error:", err);
    return { error: "Failed to create task" };
  }
}

// ── Follow up on borrower request ──────────────────────────────────────────

export async function followUpBorrowerRequest(
  requestId: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return { error: auth.error ?? "Not authorized" };

    const admin = createAdminClient();

    // Fetch current follow_up_count
    const { data: current, error: fetchError } = await admin
      .from("borrower_requests")
      .select("follow_up_count")
      .eq("id", requestId)
      .eq("requested_by", auth.user.id)
      .single();

    if (fetchError || !current) return { error: fetchError?.message || "Request not found" };

    const { error } = await admin
      .from("borrower_requests")
      .update({
        follow_up_count: (current.follow_up_count || 0) + 1,
        last_follow_up_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("requested_by", auth.user.id);

    if (error) return { error: error.message };

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    console.error("followUpBorrowerRequest error:", err);
    return { error: "Failed to follow up" };
  }
}

// ── Approve a pending approval ─────────────────────────────────────────────

export async function approveRequest(
  approvalId: string,
  notes?: string
): Promise<{ success: boolean } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return { error: auth.error ?? "Not authorized" };

    const admin = createAdminClient();

    const { error } = await admin
      .from("approval_requests")
      .update({
        status: "approved",
        decision_at: new Date().toISOString(),
        decision_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", approvalId)
      .eq("assigned_to", auth.user.id);

    if (error) return { error: error.message };

    // Log the approval in audit log
    const { error: auditErr } = await (admin as any).from("approval_audit_log").insert({
      approval_id: approvalId,
      performed_by: auth.user.id,
      action: "approved",
      notes: notes || null,
    });

    if (auditErr) {
      console.error("approveRequest: failed to write audit log", auditErr);
    }

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err) {
    console.error("approveRequest error:", err);
    return { error: "Failed to approve" };
  }
}
