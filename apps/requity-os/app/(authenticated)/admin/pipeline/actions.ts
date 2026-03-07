"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validateStageAdvancement } from "@/lib/pipeline/validate-stage-advancement";
import type { Database } from "@/lib/supabase/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
      .select("*")
      .eq("id", opportunityId)
      .single();

    if (fetchErr || !opp) return { error: "Opportunity not found" };

    // Config-driven stage advancement validation
    if (newStage !== "closed_lost") {
      const validation = await validateStageAdvancement(opp as Record<string, unknown>, newStage);
      if (!validation.valid) {
        return { error: validation.message };
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
    revalidatePath("/admin/pipeline");
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

    revalidatePath("/admin/pipeline");
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

    if (newStage === "closed_lost" && !lossReason) {
      return { error: "Loss reason is required when marking a deal as closed lost" };
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

    revalidatePath("/admin/pipeline");
    return { success: true };
  } catch (err) {
    console.error("moveEquityStageAction error:", err);
    return { error: "An unexpected error occurred" };
  }
}
