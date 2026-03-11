"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nq } from "@/lib/notifications";

// Task shape from ops_tasks (avoids Supabase generated type mismatch for new columns)
interface TaskRow {
  id: string;
  title: string;
  status: string;
  requires_approval: boolean;
  approver_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  approval_instructions: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();
  return !!data;
}

// ---------------------------------------------------------------------------
// Create task with approval
// ---------------------------------------------------------------------------

export async function createTaskApproval(input: {
  taskId: string;
  approverId: string;
  approvalInstructions?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user } = await requireAuth();
    const admin = createAdminClient();

    const { error } = await admin.from("task_approvals" as never).insert({
      task_id: input.taskId,
      approver_id: input.approverId,
      approval_status: "pending",
      approval_instructions: input.approvalInstructions || null,
      created_by: user.id,
    } as never);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Submit task for approval (assignee action)
// ---------------------------------------------------------------------------

export async function submitTaskForApproval(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, profile } = await requireAuth();
    const admin = createAdminClient();

    // Get the task
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: taskRaw, error: taskErr } = await admin
      .from("ops_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    const task = taskRaw as unknown as TaskRow | null;
    if (taskErr || !task) return { success: false, error: "Task not found" };
    if (!task.requires_approval) return { success: false, error: "Task does not require approval" };

    // Update task status to Pending Approval
    const { error: updateErr } = await admin
      .from("ops_tasks")
      .update({
        status: "Pending Approval",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", taskId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Reset/update the task_approvals record
    const { error: approvalErr } = await admin
      .from("task_approvals" as never)
      .update({
        approval_status: "pending",
        approval_note: null,
        responded_at: null,
        requested_at: new Date().toISOString(),
      } as never)
      .eq("task_id" as never, taskId as never);

    if (approvalErr) {
      console.error("Failed to reset approval record:", approvalErr);
    }

    // Notify approver
    if (task.approver_id) {
      try {
        await nq(admin).notifications().insert({
          user_id: task.approver_id,
          notification_slug: "task-approval-requested",
          title: `${profile?.full_name || "Someone"} submitted "${task.title}" for your approval`,
          body: "A task has been submitted for your review.",
          priority: "normal",
          entity_type: "task",
          entity_id: taskId,
          action_url: "/admin/operations",
        } as never);
      } catch {
        console.error("Failed to send approval notification");
      }
    }

    revalidatePath("/admin/operations");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Approve task (approver or super_admin action)
// ---------------------------------------------------------------------------

export async function approveTask(
  taskId: string,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, profile } = await requireAuth();
    const admin = createAdminClient();

    // Get the task and approval
    const { data: taskRaw, error: taskErr } = await admin
      .from("ops_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    const task = taskRaw as unknown as TaskRow | null;
    if (taskErr || !task) return { success: false, error: "Task not found" };
    if (!task.requires_approval) return { success: false, error: "Task does not require approval" };
    if (task.status !== "Pending Approval") return { success: false, error: "Task is not pending approval" };

    // Verify authorization
    const isApprover = task.approver_id === user.id;
    const isAdmin = await isSuperAdmin(user.id);
    if (!isApprover && !isAdmin) {
      return { success: false, error: "Only the designated approver or super_admin can approve" };
    }

    // Update approval record
    const { error: approvalErr } = await admin
      .from("task_approvals" as never)
      .update({
        approval_status: "approved",
        approval_note: note || null,
        responded_at: new Date().toISOString(),
      } as never)
      .eq("task_id" as never, taskId as never);

    if (approvalErr) return { success: false, error: approvalErr.message };

    // Complete the task
    const { error: taskUpdateErr } = await admin
      .from("ops_tasks")
      .update({
        status: "Complete",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", taskId);

    if (taskUpdateErr) return { success: false, error: taskUpdateErr.message };

    // Notify assignee and creator
    const approverName = profile?.full_name || "An approver";
    const recipientSet: string[] = [];
    if (task.assigned_to && task.assigned_to !== user.id) recipientSet.push(task.assigned_to);
    if (task.created_by && task.created_by !== user.id && task.created_by !== task.assigned_to) recipientSet.push(task.created_by);

    for (let ri = 0; ri < recipientSet.length; ri++) {
      const recipientId = recipientSet[ri];
      try {
        await nq(admin).notifications().insert({
          user_id: recipientId,
          notification_slug: "task-approval-approved",
          title: `${approverName} approved "${task.title}"`,
          body: note || "Your task has been approved.",
          priority: "normal",
          entity_type: "task",
          entity_id: taskId,
          action_url: "/admin/operations",
        } as never);
      } catch {
        console.error("Failed to send approval notification");
      }
    }

    // If super_admin override, notify original approver
    if (isAdmin && !isApprover && task.approver_id) {
      try {
        await nq(admin).notifications().insert({
          user_id: task.approver_id,
          notification_slug: "task-approval-overridden",
          title: `${approverName} approved "${task.title}" (override)`,
          body: "A super admin approved this task on your behalf.",
          priority: "normal",
          entity_type: "task",
          entity_id: taskId,
          action_url: "/admin/operations",
        } as never);
      } catch {
        console.error("Failed to send override notification");
      }
    }

    revalidatePath("/admin/operations");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Request revision (approver or super_admin action)
// ---------------------------------------------------------------------------

export async function requestTaskRevision(
  taskId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, profile } = await requireAuth();
    const admin = createAdminClient();

    const { data: taskRaw, error: taskErr } = await admin
      .from("ops_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    const task = taskRaw as unknown as TaskRow | null;
    if (taskErr || !task) return { success: false, error: "Task not found" };
    if (!task.requires_approval) return { success: false, error: "Task does not require approval" };
    if (task.status !== "Pending Approval") return { success: false, error: "Task is not pending approval" };

    const isApprover = task.approver_id === user.id;
    const isAdmin = await isSuperAdmin(user.id);
    if (!isApprover && !isAdmin) {
      return { success: false, error: "Only the designated approver or super_admin can request revision" };
    }

    // Update approval record
    const { error: approvalErr } = await admin
      .from("task_approvals" as never)
      .update({
        approval_status: "revision_requested",
        approval_note: note,
        responded_at: new Date().toISOString(),
      } as never)
      .eq("task_id" as never, taskId as never);

    if (approvalErr) return { success: false, error: approvalErr.message };

    // Move task back to In Progress
    const { error: taskUpdateErr } = await admin
      .from("ops_tasks")
      .update({
        status: "In Progress",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", taskId);

    if (taskUpdateErr) return { success: false, error: taskUpdateErr.message };

    // Notify assignee and creator
    const approverName = profile?.full_name || "An approver";
    const recipientSet: string[] = [];
    if (task.assigned_to && task.assigned_to !== user.id) recipientSet.push(task.assigned_to);
    if (task.created_by && task.created_by !== user.id && task.created_by !== task.assigned_to) recipientSet.push(task.created_by);

    for (let ri = 0; ri < recipientSet.length; ri++) {
      const recipientId = recipientSet[ri];
      try {
        await nq(admin).notifications().insert({
          user_id: recipientId,
          notification_slug: "task-approval-revision-requested",
          title: `${approverName} requested revisions on "${task.title}"`,
          body: note,
          priority: "high",
          entity_type: "task",
          entity_id: taskId,
          action_url: "/admin/operations",
        } as never);
      } catch {
        console.error("Failed to send revision notification");
      }
    }

    revalidatePath("/admin/operations");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Reject task (approver or super_admin action)
// ---------------------------------------------------------------------------

export async function rejectTask(
  taskId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, profile } = await requireAuth();
    const admin = createAdminClient();

    const { data: taskRaw, error: taskErr } = await admin
      .from("ops_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    const task = taskRaw as unknown as TaskRow | null;
    if (taskErr || !task) return { success: false, error: "Task not found" };
    if (!task.requires_approval) return { success: false, error: "Task does not require approval" };
    if (task.status !== "Pending Approval") return { success: false, error: "Task is not pending approval" };

    const isApprover = task.approver_id === user.id;
    const isAdmin = await isSuperAdmin(user.id);
    if (!isApprover && !isAdmin) {
      return { success: false, error: "Only the designated approver or super_admin can reject" };
    }

    // Update approval record
    const { error: approvalErr } = await admin
      .from("task_approvals" as never)
      .update({
        approval_status: "rejected",
        rejection_reason: reason,
        responded_at: new Date().toISOString(),
      } as never)
      .eq("task_id" as never, taskId as never);

    if (approvalErr) return { success: false, error: approvalErr.message };

    // Complete the task (rejected is terminal)
    const { error: taskUpdateErr } = await admin
      .from("ops_tasks")
      .update({
        status: "Complete",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", taskId);

    if (taskUpdateErr) return { success: false, error: taskUpdateErr.message };

    // Notify assignee and creator
    const approverName = profile?.full_name || "An approver";
    const recipientSet: string[] = [];
    if (task.assigned_to && task.assigned_to !== user.id) recipientSet.push(task.assigned_to);
    if (task.created_by && task.created_by !== user.id && task.created_by !== task.assigned_to) recipientSet.push(task.created_by);

    for (let ri = 0; ri < recipientSet.length; ri++) {
      const recipientId = recipientSet[ri];
      try {
        await nq(admin).notifications().insert({
          user_id: recipientId,
          notification_slug: "task-approval-rejected",
          title: `${approverName} rejected "${task.title}"`,
          body: reason,
          priority: "high",
          entity_type: "task",
          entity_id: taskId,
          action_url: "/admin/operations",
        } as never);
      } catch {
        console.error("Failed to send rejection notification");
      }
    }

    revalidatePath("/admin/operations");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Fetch task approval data (for client components)
// ---------------------------------------------------------------------------

export async function getTaskApproval(
  taskId: string
): Promise<{
  data: {
    id: string;
    task_id: string;
    approver_id: string;
    approval_status: string;
    approval_instructions: string | null;
    approval_note: string | null;
    rejection_reason: string | null;
    requested_at: string;
    responded_at: string | null;
    created_by: string;
  } | null;
  error?: string;
}> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("task_approvals" as never)
      .select("*" as never)
      .eq("task_id" as never, taskId as never)
      .order("created_at" as never, { ascending: false } as never)
      .limit(1)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: data as any };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}
