"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ApprovalPriority,
  ApprovalEntityType,
  ChecklistItem,
  ChecklistResult,
  RoutingResult,
} from "@/lib/approvals/types";
import { SLA_HOURS } from "@/lib/approvals/types";
import { nq } from "@/lib/notifications";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin")
    return { error: "Unauthorized" } as const;

  return { user, profile } as const;
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return { user, profile } as const;
}

// ---------------------------------------------------------------------------
// Routing Engine
// ---------------------------------------------------------------------------

export async function determineApprover(
  entityType: ApprovalEntityType,
  entityData: Record<string, any>
): Promise<RoutingResult> {
  const admin = createAdminClient();

  const { data: rules } = await admin
    .from("approval_routing_rules" as any)
    .select("*")
    .eq("is_active", true)
    .eq("entity_type", entityType)
    .order("priority_order", { ascending: true });

  if (rules && rules.length > 0) {
    for (const rule of rules) {
      const conditions = (rule as any).conditions as Record<string, any>;
      if (evaluateConditions(conditions, entityData)) {
        return {
          approver_id: (rule as any).approver_id,
          fallback_approver_id: (rule as any).fallback_approver_id,
          sla_hours: (rule as any).sla_hours,
          auto_priority: (rule as any).auto_priority as ApprovalPriority,
          rule_name: (rule as any).name,
        };
      }
    }
  }

  // Ultimate fallback — route to first super_admin
  const { data: superAdmins } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin")
    .eq("is_active", true)
    .limit(1);

  const fallbackId = superAdmins?.[0]?.user_id;
  if (!fallbackId) throw new Error("No super admin found for fallback routing");

  return {
    approver_id: fallbackId,
    fallback_approver_id: null,
    sla_hours: 24,
    auto_priority: "normal",
    rule_name: "Default Fallback",
  };
}

function evaluateConditions(
  conditions: Record<string, any>,
  entityData: Record<string, any>
): boolean {
  // Empty conditions = catch-all, always matches
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, value] of Object.entries(conditions)) {
    if (key.endsWith("_gte")) {
      const field = key.replace("_gte", "");
      if (Number(entityData[field] ?? 0) < Number(value)) return false;
    } else if (key.endsWith("_lte")) {
      const field = key.replace("_lte", "");
      if (Number(entityData[field] ?? 0) > Number(value)) return false;
    } else if (key.endsWith("_in")) {
      const field = key.replace("_in", "");
      if (!Array.isArray(value) || !value.includes(entityData[field])) return false;
    } else if (key === "has_exception") {
      if (Boolean(entityData.has_exception) !== Boolean(value)) return false;
    } else {
      // Exact match
      if (entityData[key] !== value) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Checklist Validation
// ---------------------------------------------------------------------------

export async function validateChecklist(
  entityType: ApprovalEntityType,
  entityData: Record<string, any>
): Promise<{ passed: boolean; results: ChecklistResult[] }> {
  const admin = createAdminClient();

  const { data: checklists } = await admin
    .from("approval_checklists" as any)
    .select("*")
    .eq("entity_type", entityType)
    .eq("is_active", true)
    .limit(1);

  const checklist = checklists?.[0];
  if (!checklist) {
    return { passed: true, results: [] };
  }

  const items = (checklist as any).items as ChecklistItem[];
  const results: ChecklistResult[] = [];

  for (const item of items) {
    const result = evaluateChecklistItem(item, entityData);
    results.push(result);
  }

  return {
    passed: results.every((r) => r.passed),
    results,
  };
}

function evaluateChecklistItem(
  item: ChecklistItem,
  data: Record<string, any>
): ChecklistResult {
  const value = data[item.field];

  if (item.rule === "required") {
    const passed = value !== null && value !== undefined && value !== "";
    return {
      label: item.label,
      field: item.field,
      passed,
      reason: passed ? undefined : `${item.label} is required`,
    };
  }

  if (item.rule.startsWith("max:")) {
    const max = Number(item.rule.split(":")[1]);
    const numValue = Number(value);
    const passed = !isNaN(numValue) && numValue <= max;
    return {
      label: item.label,
      field: item.field,
      passed,
      reason: passed ? undefined : `${item.label} must be at most ${max}`,
    };
  }

  if (item.rule.startsWith("min:")) {
    const min = Number(item.rule.split(":")[1]);
    const numValue = Number(value);
    const passed = !isNaN(numValue) && numValue >= min;
    return {
      label: item.label,
      field: item.field,
      passed,
      reason: passed ? undefined : `${item.label} must be at least ${min}`,
    };
  }

  if (item.rule.startsWith("min_count:")) {
    const minCount = Number(item.rule.split(":")[1]);
    const count = Array.isArray(value) ? value.length : Number(value ?? 0);
    const passed = count >= minCount;
    return {
      label: item.label,
      field: item.field,
      passed,
      reason: passed ? undefined : `${item.label}: need at least ${minCount}`,
    };
  }

  return { label: item.label, field: item.field, passed: true };
}

// ---------------------------------------------------------------------------
// Submit for Approval
// ---------------------------------------------------------------------------

export async function submitForApproval(input: {
  entityType: ApprovalEntityType;
  entityId: string;
  submissionNotes?: string;
  dealSnapshot: Record<string, any>;
  checklistResults: ChecklistResult[];
}) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Check if there's already a pending approval for this entity
    const { data: existing } = await admin
      .from("approval_requests" as any)
      .select("id, status")
      .eq("entity_type", input.entityType)
      .eq("entity_id", input.entityId)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      return { error: "There is already a pending approval for this item." };
    }

    // Determine approver
    const routing = await determineApprover(input.entityType, input.dealSnapshot);

    // Calculate SLA deadline
    const slaHours = routing.sla_hours || SLA_HOURS[routing.auto_priority as ApprovalPriority] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Create approval request
    const { data: approval, error: approvalError } = await admin
      .from("approval_requests" as any)
      .insert({
        entity_type: input.entityType,
        entity_id: input.entityId,
        submitted_by: auth.user.id,
        assigned_to: routing.approver_id,
        status: "pending",
        priority: routing.auto_priority,
        sla_deadline: slaDeadline,
        deal_snapshot: input.dealSnapshot,
        submission_notes: input.submissionNotes || null,
        checklist_results: input.checklistResults,
      })
      .select("id")
      .single();

    if (approvalError) {
      console.error("Error creating approval request:", approvalError);
      return { error: approvalError.message };
    }

    const approvalId = (approval as any).id;

    // Build task title from snapshot
    const borrowerName = input.dealSnapshot.borrower_name || "Unknown";
    const amount = input.dealSnapshot.loan_amount
      ? `$${Number(input.dealSnapshot.loan_amount).toLocaleString()}`
      : "";
    const assetType = input.dealSnapshot.property_type || input.dealSnapshot.type || "";
    const taskTitle = `Approve: ${borrowerName} - ${amount} ${assetType}`.trim();

    // Create linked task in ops_tasks
    const { data: task, error: taskError } = await admin
      .from("ops_tasks")
      .insert({
        title: taskTitle,
        description: input.submissionNotes || `Approval request for ${input.entityType}`,
        status: "To Do",
        priority: routing.auto_priority === "urgent" ? "Critical" : routing.auto_priority === "high" ? "High" : "Medium",
        assigned_to: routing.approver_id,
        created_by: auth.user.id,
        due_date: slaDeadline.split("T")[0],
        category: "Approval",
        linked_entity_type: "approval",
        linked_entity_id: approvalId,
        linked_entity_label: taskTitle,
      })
      .select("id")
      .single();

    if (!taskError && task) {
      // Update approval with task_id
      await admin
        .from("approval_requests" as any)
        .update({ task_id: task.id })
        .eq("id", approvalId);
    }

    // Insert audit log entry
    await admin.from("approval_audit_log" as any).insert({
      approval_id: approvalId,
      action: "submitted",
      performed_by: auth.user.id,
      notes: input.submissionNotes || null,
      metadata: { routing_rule: routing.rule_name },
      deal_snapshot: input.dealSnapshot,
    });

    // Create in-app notification for the approver
    try {
      const approverAdmin = createAdminClient();
      await nq(approverAdmin).notifications().insert({
        user_id: routing.approver_id,
        notification_slug: "approval-submitted",
        title: `New approval: ${taskTitle}`,
        body: input.submissionNotes || `${auth.profile?.full_name || "Someone"} submitted a ${input.entityType} for your approval.`,
        priority: routing.auto_priority,
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    return { success: true, approvalId };
  } catch (err: any) {
    console.error("submitForApproval error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------------

export async function approveRequest(approvalId: string, decisionNotes?: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Fetch the approval
    const { data: approval, error: fetchError } = await admin
      .from("approval_requests" as any)
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };
    const appr = approval as any;

    if (appr.status !== "pending") {
      return { error: `Cannot approve a request with status: ${appr.status}` };
    }

    const now = new Date().toISOString();

    // Update approval
    const { error: updateError } = await admin
      .from("approval_requests" as any)
      .update({
        status: "approved",
        decision_at: now,
        decision_notes: decisionNotes || null,
      })
      .eq("id", approvalId);

    if (updateError) return { error: updateError.message };

    // Complete the linked task
    if (appr.task_id) {
      await admin
        .from("ops_tasks")
        .update({ status: "Complete", completed_at: now })
        .eq("id", appr.task_id);
    }

    // Update loan stage if entity_type is loan
    if (appr.entity_type === "loan") {
      await admin
        .from("loans")
        .update({
          stage: "approved",
          stage_updated_at: now,
          updated_at: now,
        })
        .eq("id", appr.entity_id);

      // Log activity
      await admin.from("loan_activity_log").insert({
        loan_id: appr.entity_id,
        performed_by: auth.user.id,
        action: "stage_change",
        description: `Approval granted by ${auth.profile?.full_name || "Admin"}`,
      });
    }

    // Sync approval status back to opportunities table if entity_type is opportunity
    if (appr.entity_type === "opportunity") {
      await admin
        .from("opportunities")
        .update({
          approval_status: "approved",
          approval_decided_at: now,
          approval_decided_by: auth.user.id,
          approval_notes: decisionNotes || null,
        })
        .eq("id", appr.entity_id);
    }

    // Audit log
    await admin.from("approval_audit_log" as any).insert({
      approval_id: approvalId,
      action: "approved",
      performed_by: auth.user.id,
      notes: decisionNotes || null,
      deal_snapshot: appr.deal_snapshot,
    });

    // Notify submitter
    try {
      await nq(admin).notifications().insert({
        user_id: appr.submitted_by,
        notification_slug: "approval-decided",
        title: `Approved: ${appr.deal_snapshot?.borrower_name || "Deal"} approved`,
        body: `${auth.profile?.full_name || "An approver"} approved your ${appr.entity_type} request.${decisionNotes ? ` Notes: ${decisionNotes}` : ""}`,
        priority: "normal",
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    return { success: true };
  } catch (err: any) {
    console.error("approveRequest error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Request Changes
// ---------------------------------------------------------------------------

export async function requestChanges(approvalId: string, decisionNotes: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    if (!decisionNotes?.trim()) {
      return { error: "Notes are required when requesting changes." };
    }

    const admin = createAdminClient();

    const { data: approval, error: fetchError } = await admin
      .from("approval_requests" as any)
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };
    const appr = approval as any;

    if (appr.status !== "pending") {
      return { error: `Cannot request changes on a request with status: ${appr.status}` };
    }

    const now = new Date().toISOString();

    // Update approval
    await admin
      .from("approval_requests" as any)
      .update({
        status: "changes_requested",
        decision_at: now,
        decision_notes: decisionNotes,
      })
      .eq("id", approvalId);

    // Update linked task to on_hold
    if (appr.task_id) {
      await admin
        .from("ops_tasks")
        .update({ status: "Blocked" })
        .eq("id", appr.task_id);
    }

    // Create a follow-up task for the submitter
    const dealName = appr.deal_snapshot?.borrower_name || "Deal";
    await admin.from("ops_tasks").insert({
      title: `Changes Requested: ${dealName}`,
      description: decisionNotes,
      status: "To Do",
      priority: "High",
      assigned_to: appr.submitted_by,
      created_by: auth.user.id,
      category: "Approval",
      linked_entity_type: "approval",
      linked_entity_id: approvalId,
      linked_entity_label: `Changes requested on ${dealName}`,
    });

    // Audit log
    await admin.from("approval_audit_log" as any).insert({
      approval_id: approvalId,
      action: "changes_requested",
      performed_by: auth.user.id,
      notes: decisionNotes,
      deal_snapshot: appr.deal_snapshot,
    });

    // Notify submitter
    try {
      await nq(admin).notifications().insert({
        user_id: appr.submitted_by,
        notification_slug: "approval-changes-requested",
        title: `Changes requested: ${dealName}`,
        body: `${auth.profile?.full_name || "An approver"} requested changes: ${decisionNotes.substring(0, 100)}`,
        priority: "high",
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    return { success: true };
  } catch (err: any) {
    console.error("requestChanges error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Decline
// ---------------------------------------------------------------------------

export async function declineRequest(approvalId: string, decisionNotes: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    if (!decisionNotes?.trim()) {
      return { error: "A decline reason is required." };
    }

    const admin = createAdminClient();

    const { data: approval, error: fetchError } = await admin
      .from("approval_requests" as any)
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };
    const appr = approval as any;

    if (appr.status !== "pending") {
      return { error: `Cannot decline a request with status: ${appr.status}` };
    }

    const now = new Date().toISOString();

    // Update approval
    await admin
      .from("approval_requests" as any)
      .update({
        status: "declined",
        decision_at: now,
        decision_notes: decisionNotes,
      })
      .eq("id", approvalId);

    // Complete the linked task
    if (appr.task_id) {
      await admin
        .from("ops_tasks")
        .update({ status: "Complete", completed_at: now })
        .eq("id", appr.task_id);
    }

    // Update loan stage if entity_type is loan
    if (appr.entity_type === "loan") {
      await admin
        .from("loans")
        .update({
          stage: "denied",
          stage_updated_at: now,
          updated_at: now,
        })
        .eq("id", appr.entity_id);

      await admin.from("loan_activity_log").insert({
        loan_id: appr.entity_id,
        performed_by: auth.user.id,
        action: "stage_change",
        description: `Declined by ${auth.profile?.full_name || "Admin"}: ${decisionNotes}`,
      });
    }

    // Sync approval status back to opportunities table if entity_type is opportunity
    if (appr.entity_type === "opportunity") {
      await admin
        .from("opportunities")
        .update({
          approval_status: "denied",
          approval_decided_at: now,
          approval_decided_by: auth.user.id,
          approval_notes: decisionNotes,
        })
        .eq("id", appr.entity_id);
    }

    // Audit log
    await admin.from("approval_audit_log" as any).insert({
      approval_id: approvalId,
      action: "declined",
      performed_by: auth.user.id,
      notes: decisionNotes,
      deal_snapshot: appr.deal_snapshot,
    });

    // Notify submitter
    try {
      await nq(admin).notifications().insert({
        user_id: appr.submitted_by,
        notification_slug: "approval-decided",
        title: `Declined: ${appr.deal_snapshot?.borrower_name || "Deal"}`,
        body: `${auth.profile?.full_name || "An approver"} declined your ${appr.entity_type}: ${decisionNotes.substring(0, 100)}`,
        priority: "high",
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    return { success: true };
  } catch (err: any) {
    console.error("declineRequest error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Resubmit (after changes requested)
// ---------------------------------------------------------------------------

export async function resubmitApproval(input: {
  approvalId: string;
  dealSnapshot: Record<string, any>;
  checklistResults: ChecklistResult[];
  submissionNotes?: string;
}) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: approval, error: fetchError } = await admin
      .from("approval_requests" as any)
      .select("*")
      .eq("id", input.approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };
    const appr = approval as any;

    if (appr.status !== "changes_requested") {
      return { error: "Can only resubmit approvals with status: changes_requested" };
    }

    // Recalculate SLA
    const routing = await determineApprover(appr.entity_type, input.dealSnapshot);
    const slaHours = routing.sla_hours || SLA_HOURS[routing.auto_priority as ApprovalPriority] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Update approval
    await admin
      .from("approval_requests" as any)
      .update({
        status: "pending",
        deal_snapshot: input.dealSnapshot,
        checklist_results: input.checklistResults,
        submission_notes: input.submissionNotes || appr.submission_notes,
        sla_deadline: slaDeadline,
        sla_breached: false,
        decision_at: null,
        decision_notes: null,
      })
      .eq("id", input.approvalId);

    // Reopen linked task
    if (appr.task_id) {
      await admin
        .from("ops_tasks")
        .update({
          status: "To Do",
          completed_at: null,
          due_date: slaDeadline.split("T")[0],
        })
        .eq("id", appr.task_id);
    }

    // Audit log
    await admin.from("approval_audit_log" as any).insert({
      approval_id: input.approvalId,
      action: "resubmitted",
      performed_by: auth.user.id,
      notes: input.submissionNotes || "Resubmitted after changes",
      deal_snapshot: input.dealSnapshot,
    });

    // Notify approver
    try {
      await nq(admin).notifications().insert({
        user_id: appr.assigned_to,
        notification_slug: "approval-submitted",
        title: `Resubmitted: ${appr.deal_snapshot?.borrower_name || "Deal"}`,
        body: `${auth.profile?.full_name || "Someone"} resubmitted after addressing changes.`,
        priority: "high",
        entity_type: "task",
        entity_id: input.approvalId,
        action_url: `/admin/operations/approvals/${input.approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    return { success: true };
  } catch (err: any) {
    console.error("resubmitApproval error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export async function cancelApproval(approvalId: string) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: approval, error: fetchError } = await admin
      .from("approval_requests" as any)
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };
    const appr = approval as any;

    // Only the submitter or admin can cancel
    if (appr.submitted_by !== auth.user.id) {
      const adminCheck = await requireAdmin();
      if ("error" in adminCheck) return { error: "Only the submitter or an admin can cancel." };
    }

    if (appr.status !== "pending" && appr.status !== "changes_requested") {
      return { error: "Cannot cancel an approval that is already decided." };
    }

    const now = new Date().toISOString();

    await admin
      .from("approval_requests" as any)
      .update({ status: "cancelled", decision_at: now })
      .eq("id", approvalId);

    if (appr.task_id) {
      await admin
        .from("ops_tasks")
        .update({ status: "Complete", completed_at: now })
        .eq("id", appr.task_id);
    }

    await admin.from("approval_audit_log" as any).insert({
      approval_id: approvalId,
      action: "cancelled",
      performed_by: auth.user.id,
      notes: "Approval cancelled",
    });

    return { success: true };
  } catch (err: any) {
    console.error("cancelApproval error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Fetch helpers (for pages)
// ---------------------------------------------------------------------------

export async function getApprovalById(approvalId: string) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: approval, error } = await admin
      .from("approval_requests" as any)
      .select("*")
      .eq("id", approvalId)
      .single();

    if (error || !approval) return { error: "Approval not found" };

    // Get profiles for submitter and approver
    const appr = approval as any;
    const [submitterRes, approverRes] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", appr.submitted_by).single(),
      admin.from("profiles").select("full_name, email").eq("id", appr.assigned_to).single(),
    ]);

    // Get audit log
    const { data: auditLog } = await admin
      .from("approval_audit_log" as any)
      .select("*")
      .eq("approval_id", approvalId)
      .order("created_at", { ascending: true });

    // Get performer names for audit entries
    const performerIds = Array.from(new Set((auditLog ?? []).map((e: any) => e.performed_by)));
    const { data: performers } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", performerIds);

    const performerMap: Record<string, string> = {};
    (performers ?? []).forEach((p: any) => {
      performerMap[p.id] = p.full_name || "Unknown";
    });

    const enrichedAuditLog = (auditLog ?? []).map((entry: any) => ({
      ...entry,
      performer_name: performerMap[entry.performed_by] || "Unknown",
    }));

    return {
      approval: {
        ...appr,
        submitter_name: submitterRes.data?.full_name || null,
        submitter_email: submitterRes.data?.email || null,
        approver_name: approverRes.data?.full_name || null,
        approver_email: approverRes.data?.email || null,
      },
      auditLog: enrichedAuditLog,
    };
  } catch (err: any) {
    console.error("getApprovalById error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function getApprovals(filters?: {
  status?: string;
  assignedToMe?: boolean;
  submittedByMe?: boolean;
}) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    let query = admin
      .from("approval_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.assignedToMe) {
      query = query.eq("assigned_to", auth.user.id);
    }

    if (filters?.submittedByMe) {
      query = query.eq("submitted_by", auth.user.id);
    }

    const { data: approvals, error } = await query;
    if (error) return { error: error.message };

    // Get all unique user IDs
    const userIds = new Set<string>();
    (approvals ?? []).forEach((a: any) => {
      userIds.add(a.submitted_by);
      userIds.add(a.assigned_to);
    });

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(userIds));

    const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    (profiles ?? []).forEach((p: any) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    });

    const enriched = (approvals ?? []).map((a: any) => ({
      ...a,
      submitter_name: profileMap[a.submitted_by]?.full_name || null,
      submitter_email: profileMap[a.submitted_by]?.email || null,
      approver_name: profileMap[a.assigned_to]?.full_name || null,
      approver_email: profileMap[a.assigned_to]?.email || null,
    }));

    return { approvals: enriched };
  } catch (err: any) {
    console.error("getApprovals error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function getPendingApprovalsCount() {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { count: 0 };

    const admin = createAdminClient();

    // Check if user is super_admin — super admins see all pending approvals
    const supabase = await createClient();
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);

    const isSuperAdmin = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");

    let query = admin
      .from("approval_requests" as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    // Super admins see all pending; others see only assigned to them
    if (!isSuperAdmin) {
      query = query.eq("assigned_to", auth.user.id);
    }

    const { count } = await query;

    return { count: count ?? 0 };
  } catch {
    return { count: 0 };
  }
}

// ---------------------------------------------------------------------------
// Routing Rules CRUD (admin settings)
// ---------------------------------------------------------------------------

export async function getRoutingRules() {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("approval_routing_rules" as any)
      .select("*")
      .order("priority_order", { ascending: true });

    if (error) return { error: error.message };
    return { rules: data ?? [] };
  } catch (err: any) {
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function upsertRoutingRule(rule: {
  id?: string;
  name: string;
  entity_type: string;
  priority_order: number;
  conditions: Record<string, any>;
  approver_id: string;
  fallback_approver_id?: string | null;
  sla_hours: number;
  auto_priority: string;
  is_active: boolean;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    if (rule.id) {
      const { error } = await admin
        .from("approval_routing_rules" as any)
        .update({
          name: rule.name,
          entity_type: rule.entity_type,
          priority_order: rule.priority_order,
          conditions: rule.conditions,
          approver_id: rule.approver_id,
          fallback_approver_id: rule.fallback_approver_id || null,
          sla_hours: rule.sla_hours,
          auto_priority: rule.auto_priority,
          is_active: rule.is_active,
        })
        .eq("id", rule.id);

      if (error) return { error: error.message };
    } else {
      const { error } = await admin
        .from("approval_routing_rules" as any)
        .insert({
          name: rule.name,
          entity_type: rule.entity_type,
          priority_order: rule.priority_order,
          conditions: rule.conditions,
          approver_id: rule.approver_id,
          fallback_approver_id: rule.fallback_approver_id || null,
          sla_hours: rule.sla_hours,
          auto_priority: rule.auto_priority,
          is_active: rule.is_active,
        });

      if (error) return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "An unexpected error occurred" };
  }
}

export async function deleteRoutingRule(ruleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("approval_routing_rules" as any)
      .delete()
      .eq("id", ruleId);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "An unexpected error occurred" };
  }
}
