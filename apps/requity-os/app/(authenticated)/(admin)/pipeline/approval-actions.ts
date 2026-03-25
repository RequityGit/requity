"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/require-admin";
import { revalidateDealPaths } from "@/lib/pipeline/revalidate-deal";
import {
  submitForApproval,
  validateChecklist,
  approveRequest,
} from "@/app/(authenticated)/(admin)/tasks/approvals/actions";
import { nq } from "@/lib/notifications";
import type { Json } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Request Approval (underwriter submits deal for super_admin review)
// ---------------------------------------------------------------------------

export async function requestDealApproval(
  dealId: string,
  notes?: string
): Promise<{ success?: true; error?: string; approvalId?: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Fetch the deal
    const { data: deal, error: fetchErr } = await admin
      .from("unified_deals" as never)
      .select("*" as never)
      .eq("id" as never, dealId as never)
      .single();

    if (fetchErr || !deal) return { error: "Deal not found" };

    const d = deal as Record<string, unknown>;

    if (d.stage !== "analysis") {
      return { error: "Deal must be in Analysis stage to request approval" };
    }

    if (d.approval_status === "pending") {
      return { error: "Approval already requested for this deal" };
    }

    // Build snapshot for the approval request
    const dealSnapshot: Record<string, unknown> = {
      deal_id: d.id,
      deal_name: d.name,
      amount: d.amount,
      loan_amount: d.amount,
      asset_class: d.asset_class,
      capital_side: d.capital_side,
      primary_contact_id: d.primary_contact_id,
      property_type: (d.uw_data as Record<string, unknown>)?.property_type,
      borrower_name: (d.uw_data as Record<string, unknown>)?.borrower_name,
      ...(d.uw_data as Record<string, unknown>),
    };

    // Validate checklist (if one exists for unified_deal)
    const { results: checklistResults } = await validateChecklist(
      "unified_deal",
      dealSnapshot
    );

    // Submit via existing approval infrastructure
    const result = await submitForApproval({
      entityType: "unified_deal",
      entityId: dealId,
      submissionNotes: notes,
      dealSnapshot,
      checklistResults,
    });

    if (result.error) return { error: result.error };

    // Update deal's approval_status to pending
    const { error: updateErr } = await admin
      .from("unified_deals" as never)
      .update({
        approval_status: "pending",
        approval_requested_at: new Date().toISOString(),
        approval_requested_by: auth.user.id,
      } as never)
      .eq("id" as never, dealId as never);

    if (updateErr) {
      console.error("Failed to update deal approval_status:", updateErr);
    }

    await revalidateDealPaths(dealId);
    return { success: true, approvalId: result.approvalId };
  } catch (err: unknown) {
    console.error("requestDealApproval error:", err);
    return { error: err instanceof Error ? err.message : "Failed to request approval" };
  }
}

// ---------------------------------------------------------------------------
// Approve Deal (super_admin approves, auto-advances to negotiation)
// ---------------------------------------------------------------------------

export async function approveDealAction(
  dealId: string,
  decisionNotes?: string
): Promise<{ success?: true; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Find the pending approval request for this deal
    const { data: approvals } = await admin
      .from("approval_requests")
      .select("id, submitted_by")
      .eq("entity_type", "unified_deal")
      .eq("entity_id", dealId)
      .eq("status", "pending")
      .limit(1);

    const approval = approvals?.[0];
    if (!approval) return { error: "No pending approval found for this deal" };

    // Approve via existing infrastructure
    const result = await approveRequest(approval.id, decisionNotes);
    if (result.error) return { error: result.error };

    // Update deal status to approved
    await admin
      .from("unified_deals" as never)
      .update({ approval_status: "approved" } as never)
      .eq("id" as never, dealId as never);

    // Auto-advance to negotiation
    const { error: advanceErr } = await admin.rpc("unified_advance_stage", {
      p_deal_id: dealId,
      p_new_stage: "negotiation",
      p_notes: "Auto-advanced after underwriting approval",
    });

    if (advanceErr) {
      console.error("Failed to auto-advance deal:", advanceErr);
      // Still successful -- approval went through, just didn't auto-advance
    }

    // Clear approval_status after advancing (deal is now in negotiation)
    await admin
      .from("unified_deals" as never)
      .update({ approval_status: null } as never)
      .eq("id" as never, dealId as never);

    // Notify the original requester
    try {
      const { data: deal } = await admin
        .from("unified_deals" as never)
        .select("name" as never)
        .eq("id" as never, dealId as never)
        .single();

      const dealName = (deal as { name: string } | null)?.name ?? "Deal";

      await nq(admin).notifications().insert({
        user_id: approval.submitted_by,
        notification_slug: "approval-approved",
        title: `Approved: ${dealName}`,
        body: `Your underwriting for ${dealName} has been approved and advanced to Negotiation.${decisionNotes ? ` Notes: ${decisionNotes}` : ""}`,
        priority: "normal",
        entity_type: "deal",
        entity_id: dealId,
        action_url: `/pipeline/${dealId}`,
      });
    } catch (e) {
      console.error("Error creating approval notification:", e);
    }

    await revalidateDealPaths(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("approveDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to approve deal" };
  }
}

// ---------------------------------------------------------------------------
// Decline Deal
// ---------------------------------------------------------------------------

export async function declineDealAction(
  dealId: string,
  decisionNotes?: string
): Promise<{ success?: true; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Find and update the pending approval
    const { data: approvals } = await admin
      .from("approval_requests")
      .select("id, submitted_by")
      .eq("entity_type", "unified_deal")
      .eq("entity_id", dealId)
      .eq("status", "pending")
      .limit(1);

    const approval = approvals?.[0];
    if (!approval) return { error: "No pending approval found for this deal" };

    const now = new Date().toISOString();

    // Update approval request
    await admin
      .from("approval_requests")
      .update({
        status: "declined",
        decision_at: now,
        decision_notes: decisionNotes || null,
      })
      .eq("id", approval.id);

    // Audit log
    await admin.from("approval_audit_log").insert({
      approval_id: approval.id,
      action: "declined",
      performed_by: auth.user.id,
      notes: decisionNotes || null,
      metadata: {} as Json,
      deal_snapshot: {} as Json,
    });

    // Update deal status
    await admin
      .from("unified_deals" as never)
      .update({ approval_status: "declined" } as never)
      .eq("id" as never, dealId as never);

    // Notify requester
    try {
      const { data: deal } = await admin
        .from("unified_deals" as never)
        .select("name" as never)
        .eq("id" as never, dealId as never)
        .single();

      const dealName = (deal as { name: string } | null)?.name ?? "Deal";

      await nq(admin).notifications().insert({
        user_id: approval.submitted_by,
        notification_slug: "approval-declined",
        title: `Declined: ${dealName}`,
        body: `Underwriting approval for ${dealName} was declined.${decisionNotes ? ` Reason: ${decisionNotes}` : ""}`,
        priority: "high",
        entity_type: "deal",
        entity_id: dealId,
        action_url: `/pipeline/${dealId}`,
      });
    } catch (e) {
      console.error("Error creating decline notification:", e);
    }

    await revalidateDealPaths(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("declineDealAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to decline deal" };
  }
}

// ---------------------------------------------------------------------------
// Request Changes
// ---------------------------------------------------------------------------

export async function requestDealChangesAction(
  dealId: string,
  decisionNotes: string
): Promise<{ success?: true; error?: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: approvals } = await admin
      .from("approval_requests")
      .select("id, submitted_by")
      .eq("entity_type", "unified_deal")
      .eq("entity_id", dealId)
      .eq("status", "pending")
      .limit(1);

    const approval = approvals?.[0];
    if (!approval) return { error: "No pending approval found for this deal" };

    const now = new Date().toISOString();

    // Update approval request
    await admin
      .from("approval_requests")
      .update({
        status: "changes_requested",
        decision_at: now,
        decision_notes: decisionNotes,
      })
      .eq("id", approval.id);

    // Audit log
    await admin.from("approval_audit_log").insert({
      approval_id: approval.id,
      action: "changes_requested",
      performed_by: auth.user.id,
      notes: decisionNotes,
      metadata: {} as Json,
      deal_snapshot: {} as Json,
    });

    // Update deal status
    await admin
      .from("unified_deals" as never)
      .update({ approval_status: "changes_requested" } as never)
      .eq("id" as never, dealId as never);

    // Notify requester
    try {
      const { data: deal } = await admin
        .from("unified_deals" as never)
        .select("name" as never)
        .eq("id" as never, dealId as never)
        .single();

      const dealName = (deal as { name: string } | null)?.name ?? "Deal";

      await nq(admin).notifications().insert({
        user_id: approval.submitted_by,
        notification_slug: "approval-changes-requested",
        title: `Changes requested: ${dealName}`,
        body: `Changes requested on ${dealName}: ${decisionNotes}`,
        priority: "high",
        entity_type: "deal",
        entity_id: dealId,
        action_url: `/pipeline/${dealId}`,
      });
    } catch (e) {
      console.error("Error creating changes-requested notification:", e);
    }

    await revalidateDealPaths(dealId);
    return { success: true };
  } catch (err: unknown) {
    console.error("requestDealChangesAction error:", err);
    return { error: err instanceof Error ? err.message : "Failed to request changes" };
  }
}

// ---------------------------------------------------------------------------
// Fetch approval info for a deal (for the banner display)
// ---------------------------------------------------------------------------

export async function getDealApprovalInfo(dealId: string): Promise<{
  approvalId: string | null;
  status: string | null;
  submittedBy: string | null;
  submitterName: string | null;
  decisionNotes: string | null;
  submissionNotes: string | null;
} | null> {
  try {
    const admin = createAdminClient();

    const { data: approval } = await admin
      .from("approval_requests")
      .select("id, status, submitted_by, decision_notes, submission_notes")
      .eq("entity_type", "unified_deal")
      .eq("entity_id", dealId)
      .in("status", ["pending", "changes_requested", "declined"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!approval) return null;

    // Get submitter name
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", approval.submitted_by)
      .single();

    return {
      approvalId: approval.id,
      status: approval.status,
      submittedBy: approval.submitted_by,
      submitterName: profile?.full_name ?? null,
      decisionNotes: approval.decision_notes,
      submissionNotes: approval.submission_notes,
    };
  } catch {
    return null;
  }
}
