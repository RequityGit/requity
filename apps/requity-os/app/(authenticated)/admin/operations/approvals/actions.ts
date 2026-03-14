"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/constants";
import type {
  ApprovalPriority,
  ApprovalEntityType,
  ChecklistItem,
  ChecklistResult,
  RoutingResult,
} from "@/lib/approvals/types";
import { SLA_HOURS } from "@/lib/approvals/types";
import { nq } from "@/lib/notifications";
import type { Json } from "@/lib/supabase/types";

// User-facing labels for entity types (keys stay as DB values)
const ENTITY_TYPE_DISPLAY: Record<string, string> = {
  opportunity: "deal",
  loan: "loan",
  draw_request: "draw request",
  payoff: "payoff",
  exception: "exception",
  condition: "condition",
  borrower: "borrower",
  investor: "investor",
  fund: "fund",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  entityData: Record<string, unknown>
): Promise<RoutingResult> {
  const admin = createAdminClient();

  const { data: rules, error: rulesErr } = await admin
    .from("approval_routing_rules")
    .select("*")
    .eq("is_active", true)
    .eq("entity_type", entityType)
    .order("priority_order", { ascending: true });

  if (rulesErr) {
    console.error("Failed to fetch routing rules:", rulesErr);
  }

  if (rules && rules.length > 0) {
    for (const rule of rules) {
      const conditions = rule.conditions as Record<string, unknown>;
      if (evaluateConditions(conditions, entityData)) {
        return {
          approver_id: rule.approver_id,
          fallback_approver_id: rule.fallback_approver_id,
          sla_hours: rule.sla_hours,
          auto_priority: rule.auto_priority as ApprovalPriority,
          rule_name: rule.name,
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
  conditions: Record<string, unknown>,
  entityData: Record<string, unknown>
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

// Map field_configurations types to UwField types
function mapFieldConfigType(
  fcType: string
): ChecklistResult["field_type"] {
  switch (fcType) {
    case "percentage":
      return "percent";
    case "dropdown":
      return "select";
    case "currency":
      return "currency";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "text":
    default:
      return "text";
  }
}

// Special fields that need custom UI instead of standard UwField inputs
const SPECIAL_FIELDS: Record<string, ChecklistResult["is_special"]> = {
  borrower_id: "borrower_picker",
  borrower_name: "borrower_picker",
  primary_contact_id: "borrower_picker",
  loan_amount: "loan_amount",
};

export async function validateChecklist(
  entityType: ApprovalEntityType,
  entityData: Record<string, unknown>
): Promise<{ passed: boolean; results: ChecklistResult[] }> {
  const admin = createAdminClient();

  const { data: checklists, error: checklistErr } = await admin
    .from("approval_checklists")
    .select("*")
    .eq("entity_type", entityType)
    .eq("is_active", true)
    .limit(1);

  if (checklistErr) {
    console.error("Failed to fetch approval checklists:", checklistErr);
  }

  const checklist = checklists?.[0];
  if (!checklist) {
    return { passed: true, results: [] };
  }

  const items = checklist.items as unknown as ChecklistItem[];
  const results: ChecklistResult[] = [];

  for (const item of items) {
    const result = evaluateChecklistItem(item, entityData);
    results.push(result);
  }

  // Fetch field configurations to attach type metadata for inline editing
  const fieldKeys = items.map((i) => i.field);
  const { data: fieldConfigs } = await admin
    .from("field_configurations")
    .select("field_key, field_type, dropdown_options, module")
    .in("module", ["uw_deal", "uw_property", "uw_borrower", "loan_details", "property", "borrower_entity"])
    .in("field_key", fieldKeys);

  // Build lookup map: field_key -> config
  const configMap = new Map<string, { field_type: string; dropdown_options: string[] | null }>();
  if (fieldConfigs) {
    for (const fc of fieldConfigs) {
      // First match wins (uw_ modules take priority)
      if (!configMap.has(fc.field_key)) {
        configMap.set(fc.field_key, {
          field_type: fc.field_type,
          dropdown_options: fc.dropdown_options as string[] | null,
        });
      }
    }
  }

  // Enrich results with field type metadata
  for (const result of results) {
    // Check for special fields first
    if (SPECIAL_FIELDS[result.field]) {
      result.is_special = SPECIAL_FIELDS[result.field];
      continue;
    }

    const config = configMap.get(result.field);
    if (config) {
      result.field_type = mapFieldConfigType(config.field_type);
      if (config.dropdown_options && config.dropdown_options.length > 0) {
        result.options = config.dropdown_options;
      }
    } else {
      // Default to text for unknown fields
      result.field_type = "text";
    }

    // Fallback: ensure property_type always has dropdown options
    if (result.field === "property_type" && (!result.options || result.options.length === 0)) {
      result.field_type = "select";
      result.options = PROPERTY_TYPE_OPTIONS.map((o) => o.value);
    }
  }

  return {
    passed: results.every((r) => r.passed),
    results,
  };
}

function evaluateChecklistItem(
  item: ChecklistItem,
  data: Record<string, unknown>
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
// Save field from approval dialog (inline editing)
// ---------------------------------------------------------------------------

export async function saveApprovalFieldAction(
  entityId: string,
  entityType: ApprovalEntityType,
  fieldKey: string,
  value: unknown
): Promise<{ success?: true; error?: string }> {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Special case: loan_amount -> update deal amount
    if (fieldKey === "loan_amount") {
      if (entityType === "opportunity") {
        const { error } = await admin
          .from("unified_deals")
          .update({ amount: value as number })
          .eq("id", entityId);
        if (error) return { error: error.message };
      } else if (entityType === "loan") {
        const { error } = await admin
          .from("loans")
          .update({ loan_amount: value as number })
          .eq("id", entityId);
        if (error) return { error: error.message };
      }
      return { success: true };
    }

    // Special case: borrower -> update primary_contact_id on the deal
    if (fieldKey === "borrower_id" || fieldKey === "borrower_name" || fieldKey === "primary_contact_id") {
      if (entityType === "opportunity") {
        const { error } = await admin
          .from("unified_deals")
          .update({ primary_contact_id: value as string })
          .eq("id", entityId);
        if (error) return { error: error.message };
      }
      return { success: true };
    }

    // Default: use the pipeline updateUwDataAction pattern
    // Import the logic inline to avoid circular deps
    const { updateUwDataAction } = await import(
      "@/app/(authenticated)/admin/pipeline/actions"
    );
    const uwResult = await updateUwDataAction(entityId, fieldKey, value);
    if (uwResult.error) return { error: uwResult.error };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save field";
    console.error("saveApprovalFieldAction error:", err);
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Search contacts for borrower picker in approval dialog
// ---------------------------------------------------------------------------

export async function searchContactsForApproval(
  query: string
): Promise<{ contacts: { id: string; name: string }[]; error?: string }> {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { contacts: [], error: auth.error };

    const admin = createAdminClient();

    let q = admin
      .from("crm_contacts")
      .select("id, first_name, last_name")
      .order("last_name", { ascending: true })
      .limit(50);

    if (query && query.trim().length > 0) {
      q = q.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      );
    }

    const { data, error } = await q;
    if (error) return { contacts: [], error: error.message };

    const contacts = (data ?? []).map((c) => ({
      id: c.id,
      name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed",
    }));

    return { contacts };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to search contacts";
    return { contacts: [], error: message };
  }
}

// ---------------------------------------------------------------------------
// Submit for Approval
// ---------------------------------------------------------------------------

export async function submitForApproval(input: {
  entityType: ApprovalEntityType;
  entityId: string;
  submissionNotes?: string;
  dealSnapshot: Record<string, unknown>;
  checklistResults: ChecklistResult[];
}) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Check if there's already a pending approval for this entity
    const { data: existing } = await admin
      .from("approval_requests")
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
      .from("approval_requests")
      .insert({
        entity_type: input.entityType,
        entity_id: input.entityId,
        submitted_by: auth.user.id,
        assigned_to: routing.approver_id,
        status: "pending",
        priority: routing.auto_priority,
        sla_deadline: slaDeadline,
        deal_snapshot: input.dealSnapshot as unknown as Json,
        submission_notes: input.submissionNotes || null,
        checklist_results: input.checklistResults as unknown as Json,
      })
      .select("id")
      .single();

    if (approvalError) {
      console.error("Failed to submit approval request:", approvalError);
      return { error: approvalError.message };
    }

    const approvalId = approval.id;

    // Build task title from snapshot
    const snapshot = input.dealSnapshot;
    const borrowerName = (snapshot.borrower_name as string) || "Unknown";
    const amount = snapshot.loan_amount
      ? `$${Number(snapshot.loan_amount).toLocaleString()}`
      : "";
    const assetType = (snapshot.property_type as string) || (snapshot.type as string) || "";
    const taskTitle = `Approve: ${borrowerName} - ${amount} ${assetType}`.trim();

    // Create linked task in ops_tasks
    const loanAmount = snapshot.loan_amount ? Number(snapshot.loan_amount) : null;
    const { data: task, error: taskError } = await admin
      .from("ops_tasks")
      .insert({
        title: taskTitle,
        description: input.submissionNotes || `Approval request for ${ENTITY_TYPE_DISPLAY[input.entityType] ?? input.entityType}`,
        status: "Pending Approval",
        priority: routing.auto_priority === "urgent" ? "Critical" : routing.auto_priority === "high" ? "High" : "Medium",
        assigned_to: routing.approver_id,
        created_by: auth.user.id,
        due_date: slaDeadline.split("T")[0],
        category: "Approval",
        linked_entity_type: "approval",
        linked_entity_id: approvalId,
        linked_entity_label: taskTitle,
        type: "approval",
        requires_approval: true,
        approver_id: routing.approver_id,
        approval_status: "pending",
        requestor_user_id: auth.user.id,
        requestor_name: auth.profile?.full_name || null,
        amount: loanAmount,
      })
      .select("id")
      .single();

    if (taskError) {
      console.error("Failed to create linked task for approval:", taskError);
    }

    if (!taskError && task) {
      // Update approval with task_id
      const { error: linkErr } = await admin
        .from("approval_requests")
        .update({ task_id: task.id })
        .eq("id", approvalId);

      if (linkErr) {
        console.error("Failed to link task to approval:", linkErr);
      }
    }

    // Insert audit log entry
    const { error: auditErr } = await admin.from("approval_audit_log").insert({
      approval_id: approvalId,
      action: "submitted",
      performed_by: auth.user.id,
      notes: input.submissionNotes || null,
      metadata: { routing_rule: routing.rule_name },
      deal_snapshot: input.dealSnapshot as unknown as Json,
    });

    if (auditErr) {
      console.error("Failed to insert audit log for submission:", auditErr);
    }

    // Create in-app notification for the approver
    try {
      const approverAdmin = createAdminClient();
      await nq(approverAdmin).notifications().insert({
        user_id: routing.approver_id,
        notification_slug: "approval-submitted",
        title: `New approval: ${taskTitle}`,
        body: input.submissionNotes || `${auth.profile?.full_name || "Someone"} submitted a ${ENTITY_TYPE_DISPLAY[input.entityType] ?? input.entityType} for your approval.`,
        priority: routing.auto_priority,
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    revalidatePath("/admin/operations/approvals");
    return { success: true, approvalId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to submit approval";
    console.error("submitForApproval error:", err);
    return { error: message };
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
      .from("approval_requests")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };

    if (approval.status !== "pending") {
      return { error: `Cannot approve a request with status: ${approval.status}` };
    }

    const now = new Date().toISOString();

    // Update approval
    const { error: updateError } = await admin
      .from("approval_requests")
      .update({
        status: "approved",
        decision_at: now,
        decision_notes: decisionNotes || null,
      })
      .eq("id", approvalId);

    if (updateError) return { error: updateError.message };

    // Complete the linked task
    if (approval.task_id) {
      const { error: taskErr } = await admin
        .from("ops_tasks")
        .update({ status: "Complete", completed_at: now })
        .eq("id", approval.task_id);

      if (taskErr) {
        console.error("Failed to complete linked task on approval:", taskErr);
      }
    }

    // Update loan stage if entity_type is loan
    if (approval.entity_type === "loan") {
      const { error: loanErr } = await admin
        .from("loans")
        .update({
          stage: "approved",
          stage_updated_at: now,
          updated_at: now,
        })
        .eq("id", approval.entity_id);

      if (loanErr) {
        console.error("Failed to update loan stage on approval:", loanErr);
      }

      // Log activity
      const { error: logErr } = await admin.from("loan_activity_log").insert({
        loan_id: approval.entity_id,
        performed_by: auth.user.id,
        action: "stage_change",
        description: `Approval granted by Admin`,
      });

      if (logErr) {
        console.error("Failed to insert loan activity log:", logErr);
      }
    }

    // Update condition status if entity_type is condition
    if (approval.entity_type === "condition") {
      const { error: condErr } = await admin
        .from("unified_deal_conditions" as never)
        .update({
          status: "approved",
          reviewed_at: now,
          reviewed_by: auth.user.id,
        } as never)
        .eq("id" as never, approval.entity_id as never);

      if (condErr) {
        console.error("Failed to update condition status on approval:", condErr);
      }

      revalidatePath("/admin/pipeline");
    }

    // Sync approval status back to opportunities table if entity_type is opportunity
    if (approval.entity_type === "opportunity") {
      const { error: oppErr } = await admin
        .from("opportunities")
        .update({
          approval_status: "approved",
          approval_decided_at: now,
          approval_decided_by: auth.user.id,
          approval_notes: decisionNotes || null,
        })
        .eq("id", approval.entity_id);

      if (oppErr) {
        console.error("Failed to sync approval status to opportunity:", oppErr);
      }
    }

    // Audit log
    const dealSnapshot = approval.deal_snapshot as Record<string, unknown> | null;
    const { error: auditErr } = await admin.from("approval_audit_log").insert({
      approval_id: approvalId,
      action: "approved",
      performed_by: auth.user.id,
      notes: decisionNotes || null,
      deal_snapshot: dealSnapshot as unknown as Json,
    });

    if (auditErr) {
      console.error("Failed to insert audit log for approval:", auditErr);
    }

    // Notify submitter
    try {
      const borrowerName = dealSnapshot && typeof dealSnapshot === "object"
        ? (dealSnapshot.borrower_name as string) || "Deal"
        : "Deal";
      await nq(admin).notifications().insert({
        user_id: approval.submitted_by,
        notification_slug: "approval-decided",
        title: `Approved: ${borrowerName} approved`,
        body: `An approver approved your ${ENTITY_TYPE_DISPLAY[approval.entity_type] ?? approval.entity_type} request.${decisionNotes ? ` Notes: ${decisionNotes}` : ""}`,
        priority: "normal",
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to approve request";
    console.error("approveRequest error:", err);
    return { error: message };
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
      .from("approval_requests")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };

    if (approval.status !== "pending") {
      return { error: `Cannot request changes on a request with status: ${approval.status}` };
    }

    const now = new Date().toISOString();
    const dealSnapshot = approval.deal_snapshot as Record<string, unknown> | null;
    const dealName = dealSnapshot && typeof dealSnapshot === "object"
      ? (dealSnapshot.borrower_name as string) || "Deal"
      : "Deal";

    // Update approval
    const { error: updateErr } = await admin
      .from("approval_requests")
      .update({
        status: "changes_requested",
        decision_at: now,
        decision_notes: decisionNotes,
      })
      .eq("id", approvalId);

    if (updateErr) {
      console.error("Failed to update approval for changes requested:", updateErr);
      return { error: updateErr.message };
    }

    // Revert condition status to pending if entity_type is condition
    if (approval.entity_type === "condition") {
      const { error: condErr } = await admin
        .from("unified_deal_conditions" as never)
        .update({ status: "pending" } as never)
        .eq("id" as never, approval.entity_id as never);

      if (condErr) {
        console.error("Failed to revert condition status on changes requested:", condErr);
      }

      revalidatePath("/admin/pipeline");
    }

    // Update linked task to on_hold
    if (approval.task_id) {
      const { error: taskErr } = await admin
        .from("ops_tasks")
        .update({ status: "Blocked" })
        .eq("id", approval.task_id);

      if (taskErr) {
        console.error("Failed to update linked task to Blocked:", taskErr);
      }
    }

    // Create a follow-up task for the submitter
    const { error: followupErr } = await admin.from("ops_tasks").insert({
      title: `Changes Requested: ${dealName}`,
      description: decisionNotes,
      status: "To Do",
      priority: "High",
      assigned_to: approval.submitted_by,
      created_by: auth.user.id,
      category: "Approval",
      linked_entity_type: "approval",
      linked_entity_id: approvalId,
      linked_entity_label: `Changes requested on ${dealName}`,
    });

    if (followupErr) {
      console.error("Failed to create follow-up task for changes requested:", followupErr);
    }

    // Audit log
    const { error: auditErr } = await admin.from("approval_audit_log").insert({
      approval_id: approvalId,
      action: "changes_requested",
      performed_by: auth.user.id,
      notes: decisionNotes,
      deal_snapshot: dealSnapshot as unknown as Json,
    });

    if (auditErr) {
      console.error("Failed to insert audit log for changes requested:", auditErr);
    }

    // Notify submitter
    try {
      await nq(admin).notifications().insert({
        user_id: approval.submitted_by,
        notification_slug: "approval-changes-requested",
        title: `Changes requested: ${dealName}`,
        body: `An approver requested changes: ${decisionNotes.substring(0, 100)}`,
        priority: "high",
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to request changes";
    console.error("requestChanges error:", err);
    return { error: message };
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
      .from("approval_requests")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };

    if (approval.status !== "pending") {
      return { error: `Cannot decline a request with status: ${approval.status}` };
    }

    const now = new Date().toISOString();
    const dealSnapshot = approval.deal_snapshot as Record<string, unknown> | null;

    // Update approval
    const { error: updateErr } = await admin
      .from("approval_requests")
      .update({
        status: "declined",
        decision_at: now,
        decision_notes: decisionNotes,
      })
      .eq("id", approvalId);

    if (updateErr) {
      console.error("Failed to update approval to declined:", updateErr);
      return { error: updateErr.message };
    }

    // Complete the linked task
    if (approval.task_id) {
      const { error: taskErr } = await admin
        .from("ops_tasks")
        .update({ status: "Complete", completed_at: now })
        .eq("id", approval.task_id);

      if (taskErr) {
        console.error("Failed to complete linked task on decline:", taskErr);
      }
    }

    // Update loan stage if entity_type is loan
    if (approval.entity_type === "loan") {
      const { error: loanErr } = await admin
        .from("loans")
        .update({
          stage: "denied",
          stage_updated_at: now,
          updated_at: now,
        })
        .eq("id", approval.entity_id);

      if (loanErr) {
        console.error("Failed to update loan stage on decline:", loanErr);
      }

      const { error: logErr } = await admin.from("loan_activity_log").insert({
        loan_id: approval.entity_id,
        performed_by: auth.user.id,
        action: "stage_change",
        description: `Declined by Admin: ${decisionNotes}`,
      });

      if (logErr) {
        console.error("Failed to insert loan activity log on decline:", logErr);
      }
    }

    // Revert condition status if entity_type is condition
    if (approval.entity_type === "condition") {
      const { error: condErr } = await admin
        .from("unified_deal_conditions" as never)
        .update({ status: "rejected" } as never)
        .eq("id" as never, approval.entity_id as never);

      if (condErr) {
        console.error("Failed to update condition status on decline:", condErr);
      }

      revalidatePath("/admin/pipeline");
    }

    // Sync approval status back to opportunities table if entity_type is opportunity
    if (approval.entity_type === "opportunity") {
      const { error: oppErr } = await admin
        .from("opportunities")
        .update({
          approval_status: "denied",
          approval_decided_at: now,
          approval_decided_by: auth.user.id,
          approval_notes: decisionNotes,
        })
        .eq("id", approval.entity_id);

      if (oppErr) {
        console.error("Failed to sync decline status to opportunity:", oppErr);
      }
    }

    // Audit log
    const { error: auditErr } = await admin.from("approval_audit_log").insert({
      approval_id: approvalId,
      action: "declined",
      performed_by: auth.user.id,
      notes: decisionNotes,
      deal_snapshot: dealSnapshot as unknown as Json,
    });

    if (auditErr) {
      console.error("Failed to insert audit log for decline:", auditErr);
    }

    // Notify submitter
    try {
      const borrowerName = dealSnapshot && typeof dealSnapshot === "object"
        ? (dealSnapshot.borrower_name as string) || "Deal"
        : "Deal";
      await nq(admin).notifications().insert({
        user_id: approval.submitted_by,
        notification_slug: "approval-decided",
        title: `Declined: ${borrowerName}`,
        body: `An approver declined your ${ENTITY_TYPE_DISPLAY[approval.entity_type] ?? approval.entity_type}: ${decisionNotes.substring(0, 100)}`,
        priority: "high",
        entity_type: "task",
        entity_id: approvalId,
        action_url: `/admin/operations/approvals/${approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to decline request";
    console.error("declineRequest error:", err);
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Resubmit (after changes requested)
// ---------------------------------------------------------------------------

export async function resubmitApproval(input: {
  approvalId: string;
  dealSnapshot: Record<string, unknown>;
  checklistResults: ChecklistResult[];
  submissionNotes?: string;
}) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: approval, error: fetchError } = await admin
      .from("approval_requests")
      .select("*")
      .eq("id", input.approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };

    if (approval.status !== "changes_requested") {
      return { error: "Can only resubmit approvals with status: changes_requested" };
    }

    // Recalculate SLA
    const routing = await determineApprover(approval.entity_type as ApprovalEntityType, input.dealSnapshot);
    const slaHours = routing.sla_hours || SLA_HOURS[routing.auto_priority as ApprovalPriority] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // Update approval
    const { error: updateErr } = await admin
      .from("approval_requests")
      .update({
        status: "pending",
        deal_snapshot: input.dealSnapshot as unknown as Json,
        checklist_results: input.checklistResults as unknown as Json,
        submission_notes: input.submissionNotes || approval.submission_notes,
        sla_deadline: slaDeadline,
        sla_breached: false,
        decision_at: null,
        decision_notes: null,
      })
      .eq("id", input.approvalId);

    if (updateErr) {
      console.error("Failed to resubmit approval:", updateErr);
      return { error: updateErr.message };
    }

    // Reopen linked task
    if (approval.task_id) {
      const { error: taskErr } = await admin
        .from("ops_tasks")
        .update({
          status: "To Do",
          completed_at: null,
          due_date: slaDeadline.split("T")[0],
        })
        .eq("id", approval.task_id);

      if (taskErr) {
        console.error("Failed to reopen linked task on resubmit:", taskErr);
      }
    }

    // Audit log
    const { error: auditErr } = await admin.from("approval_audit_log").insert({
      approval_id: input.approvalId,
      action: "resubmitted",
      performed_by: auth.user.id,
      notes: input.submissionNotes || "Resubmitted after changes",
      deal_snapshot: input.dealSnapshot as unknown as Json,
    });

    if (auditErr) {
      console.error("Failed to insert audit log for resubmission:", auditErr);
    }

    // Notify approver
    try {
      const dealSnapshot = approval.deal_snapshot as Record<string, unknown> | null;
      const borrowerName = dealSnapshot && typeof dealSnapshot === "object"
        ? (dealSnapshot.borrower_name as string) || "Deal"
        : "Deal";
      await nq(admin).notifications().insert({
        user_id: approval.assigned_to,
        notification_slug: "approval-submitted",
        title: `Resubmitted: ${borrowerName}`,
        body: `${auth.profile?.full_name || "Someone"} resubmitted after addressing changes.`,
        priority: "high",
        entity_type: "task",
        entity_id: input.approvalId,
        action_url: `/admin/operations/approvals/${input.approvalId}`,
      });
    } catch (e) {
      console.error("Error creating notification:", e);
    }

    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resubmit approval";
    console.error("resubmitApproval error:", err);
    return { error: message };
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
      .from("approval_requests")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (fetchError || !approval) return { error: "Approval not found" };

    // Only the submitter or admin can cancel
    if (approval.submitted_by !== auth.user.id) {
      const adminCheck = await requireAdmin();
      if ("error" in adminCheck) return { error: "Only the submitter or an admin can cancel." };
    }

    if (approval.status !== "pending" && approval.status !== "changes_requested") {
      return { error: "Cannot cancel an approval that is already decided." };
    }

    const now = new Date().toISOString();

    const { error: updateErr } = await admin
      .from("approval_requests")
      .update({ status: "cancelled", decision_at: now })
      .eq("id", approvalId);

    if (updateErr) {
      console.error("Failed to cancel approval:", updateErr);
      return { error: updateErr.message };
    }

    if (approval.task_id) {
      const { error: taskErr } = await admin
        .from("ops_tasks")
        .update({ status: "Complete", completed_at: now })
        .eq("id", approval.task_id);

      if (taskErr) {
        console.error("Failed to complete linked task on cancel:", taskErr);
      }
    }

    const { error: auditErr } = await admin.from("approval_audit_log").insert({
      approval_id: approvalId,
      action: "cancelled",
      performed_by: auth.user.id,
      notes: "Approval cancelled",
    });

    if (auditErr) {
      console.error("Failed to insert audit log for cancellation:", auditErr);
    }

    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to cancel approval";
    console.error("cancelApproval error:", err);
    return { error: message };
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
      .from("approval_requests")
      .select("*")
      .eq("id", approvalId)
      .single();

    if (error || !approval) return { error: "Approval not found" };

    // Get profiles for submitter and approver
    const [submitterRes, approverRes] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", approval.submitted_by).single(),
      admin.from("profiles").select("full_name, email").eq("id", approval.assigned_to).single(),
    ]);

    // Get audit log
    const { data: auditLog, error: auditErr } = await admin
      .from("approval_audit_log")
      .select("*")
      .eq("approval_id", approvalId)
      .order("created_at", { ascending: true });

    if (auditErr) {
      console.error("Failed to fetch audit log:", auditErr);
    }

    // Get performer names for audit entries
    const performerIds = Array.from(
      new Set((auditLog ?? []).map((e) => e.performed_by))
    );
    const { data: performers } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", performerIds);

    const performerMap: Record<string, string> = {};
    (performers ?? []).forEach((p) => {
      performerMap[p.id] = p.full_name || "Unknown";
    });

    const enrichedAuditLog = (auditLog ?? []).map((entry) => ({
      ...entry,
      performer_name: performerMap[entry.performed_by] || "Unknown",
    }));

    return {
      approval: {
        ...approval,
        submitter_name: submitterRes.data?.full_name || null,
        submitter_email: submitterRes.data?.email || null,
        approver_name: approverRes.data?.full_name || null,
        approver_email: approverRes.data?.email || null,
      },
      auditLog: enrichedAuditLog,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch approval details";
    console.error("getApprovalById error:", err);
    return { error: message };
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
      .from("approval_requests")
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
    (approvals ?? []).forEach((a) => {
      userIds.add(a.submitted_by);
      userIds.add(a.assigned_to);
    });

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(userIds));

    const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
    (profiles ?? []).forEach((p) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    });

    const enriched = (approvals ?? []).map((a) => ({
      ...a,
      submitter_name: profileMap[a.submitted_by]?.full_name || null,
      submitter_email: profileMap[a.submitted_by]?.email || null,
      approver_name: profileMap[a.assigned_to]?.full_name || null,
      approver_email: profileMap[a.assigned_to]?.email || null,
    }));

    return { approvals: enriched };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch approvals";
    console.error("getApprovals error:", err);
    return { error: message };
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
      .from("approval_requests")
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
      .from("approval_routing_rules")
      .select("*")
      .order("priority_order", { ascending: true });

    if (error) return { error: error.message };
    return { rules: data ?? [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch routing rules";
    return { error: message };
  }
}

export async function upsertRoutingRule(rule: {
  id?: string;
  name: string;
  entity_type: string;
  priority_order: number;
  conditions: Json;
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
        .from("approval_routing_rules")
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
        .from("approval_routing_rules")
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

    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save routing rule";
    return { error: message };
  }
}

export async function deleteRoutingRule(ruleId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("approval_routing_rules")
      .delete()
      .eq("id", ruleId);

    if (error) return { error: error.message };
    revalidatePath("/admin/operations/approvals");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete routing rule";
    return { error: message };
  }
}
