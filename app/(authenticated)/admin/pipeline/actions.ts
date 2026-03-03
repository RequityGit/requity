"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin")
    return { error: "Unauthorized" } as const;

  return { user } as const;
}

// ---------------------------------------------------------------------------
// Move Opportunity Stage (debt pipeline - opportunity phase)
// ---------------------------------------------------------------------------

export async function moveOpportunityStageAction(
  opportunityId: string,
  newStage: string,
  lossReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    if (newStage === "closed_lost" && !lossReason) {
      return { error: "Loss reason is required when closing a deal as lost" };
    }

    const { data: opp, error: fetchErr } = await admin
      .from("opportunities")
      .select("stage, approval_status, funding_channel")
      .eq("id", opportunityId)
      .single();

    if (fetchErr || !opp) return { error: "Opportunity not found" };

    // Validate stage advancement rules
    if (newStage !== "closed_lost") {
      if (
        opp.stage === "uw" &&
        !["awaiting_info", "closed_lost"].includes(newStage)
      ) {
        if (
          opp.approval_status !== "approved" &&
          opp.approval_status !== "auto_approved"
        ) {
          return { error: "Approval is required before advancing from UW" };
        }
      }

      if (newStage === "quoting" && opp.funding_channel !== "brokered") {
        return {
          error: "Quoting stage is only available for brokered deals",
        };
      }
    }

    const updateData: any = {
      stage: newStage,
      stage_changed_at: new Date().toISOString(),
      stage_changed_by: auth.user.id,
    };

    if (newStage === "closed_lost") {
      updateData.loss_reason = lossReason;
    }

    const { error } = await admin
      .from("opportunities")
      .update(updateData)
      .eq("id", opportunityId);

    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    console.error("moveOpportunityStageAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Move Loan Stage (debt pipeline - loan phase)
// ---------------------------------------------------------------------------

export async function moveLoanStageAction(
  loanId: string,
  newStage: Database["public"]["Enums"]["loan_status"]
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { data: loan, error: fetchErr } = await admin
      .from("loans")
      .select("stage")
      .eq("id", loanId)
      .single();

    if (fetchErr || !loan) return { error: "Loan not found" };

    const now = new Date().toISOString();

    // Update loan stage
    const { error } = await admin
      .from("loans")
      .update({
        stage: newStage,
        stage_updated_at: now,
      })
      .eq("id", loanId);

    if (error) return { error: error.message };

    // Log to loan_stage_history
    await admin.from("loan_stage_history" as any).insert({
      loan_id: loanId,
      from_stage: loan.stage,
      to_stage: newStage,
      changed_by: auth.user.id,
      changed_at: now,
    });

    return { success: true };
  } catch (err: any) {
    console.error("moveLoanStageAction error:", err);
    return { error: err?.message || "An unexpected error occurred" };
  }
}

// ---------------------------------------------------------------------------
// Move Equity Deal Stage
// ---------------------------------------------------------------------------

export async function moveEquityStageAction(
  dealId: string,
  newStage: string,
  lossReason?: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    if (newStage === "dead" && !lossReason) {
      return { error: "Loss reason is required when marking a deal as dead" };
    }

    const { data: deal, error: fetchErr } = await admin
      .from("equity_deals")
      .select("stage")
      .eq("id", dealId)
      .single();

    if (fetchErr || !deal) return { error: "Deal not found" };

    const updateData: any = {
      stage: newStage,
      stage_changed_by: auth.user.id,
    };

    if (lossReason) {
      updateData.loss_reason = lossReason;
    }

    const { error: updateErr } = await admin
      .from("equity_deals")
      .update(updateData)
      .eq("id", dealId);

    if (updateErr) {
      console.error("Failed to move equity deal stage:", updateErr);
      return { error: "Failed to update deal stage" };
    }

    return { success: true };
  } catch (err) {
    console.error("moveEquityStageAction error:", err);
    return { error: "An unexpected error occurred" };
  }
}
