"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Database } from "@/lib/supabase/types";

export async function advanceStage(
  loanId: string,
  fromStage: string,
  toStage: string,
  userId: string,
  userName: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Update loan stage
    const { error: updateError } = await admin
      .from("loans")
      .update({
        stage: toStage as Database["public"]["Enums"]["loan_status"],
        stage_updated_at: new Date().toISOString(),
      })
      .eq("id", loanId);

    if (updateError) {
      console.error("advanceStage update error:", updateError);
      return { error: updateError.message };
    }

    // Log stage history
    await admin.from("loan_stage_history").insert({
      loan_id: loanId,
      from_stage: fromStage,
      to_stage: toStage,
      changed_by: userId,
    });

    // Log activity
    await admin.from("loan_activity_log").insert({
      loan_id: loanId,
      action: "stage_change",
      description: `Stage changed from ${fromStage} to ${toStage}`,
      performed_by: userId,
      metadata: { from: fromStage, to: toStage },
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("advanceStage exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createUWVersion(
  loanId: string,
  userId: string,
  modelType: "commercial" | "rtl" | "dscr" = "rtl",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?: Record<string, any>,
  isOpportunity: boolean = false
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get current max version — query by appropriate FK
    const versionQuery = isOpportunity
      ? admin
          .from("loan_underwriting_versions")
          .select("version_number, calculator_inputs")
          .eq("opportunity_id", loanId)
          .order("version_number", { ascending: false })
          .limit(1)
      : admin
          .from("loan_underwriting_versions")
          .select("version_number, calculator_inputs")
          .eq("loan_id", loanId)
          .order("version_number", { ascending: false })
          .limit(1);

    const { data: versions } = await versionQuery;

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;
    const baseInputs = inputs || versions?.[0]?.calculator_inputs || {};

    const insertPayload = {
      ...(isOpportunity ? { opportunity_id: loanId } : { loan_id: loanId }),
      version_number: nextVersion,
      is_active: false,
      created_by: userId,
      model_type: modelType,
      calculator_inputs: baseInputs,
      calculator_outputs: {},
      status: "draft" as const,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newVersion, error } = await (admin as any)
      .from("loan_underwriting_versions")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("createUWVersion error:", error);
      return { error: error.message };
    }

    return { success: true, version: newVersion };
  } catch (err: unknown) {
    console.error("createUWVersion exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function saveUWVersion(
  versionId: string,
  loanId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Record<string, any>,
  markActive: boolean,
  userId: string,
  userName: string,
  versionNumber: number,
  isOpportunity: boolean = false
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Update version
    const { error: vError } = await admin
      .from("loan_underwriting_versions")
      .update({
        calculator_inputs: inputs,
        calculator_outputs: outputs,
        status: "submitted",
      })
      .eq("id", versionId);

    if (vError) return { error: vError.message };

    if (markActive) {
      // Deactivate all versions for this deal
      const deactivateQuery = isOpportunity
        ? admin
            .from("loan_underwriting_versions")
            .update({ is_active: false })
            .eq("opportunity_id", loanId)
        : admin
            .from("loan_underwriting_versions")
            .update({ is_active: false })
            .eq("loan_id", loanId);
      await deactivateQuery;

      // Activate this one
      await admin
        .from("loan_underwriting_versions")
        .update({ is_active: true })
        .eq("id", versionId);

      // Sync key outputs to loans table (only for actual loans, not opportunities)
      if (!isOpportunity) {
        const loanUpdate: Record<string, unknown> = {};
        if (outputs.rate != null) loanUpdate.interest_rate = outputs.rate;
        if (outputs.dscr != null) loanUpdate.dscr_ratio = outputs.dscr;
        if (outputs.ltv != null) loanUpdate.ltv = outputs.ltv;
        if (outputs.loan_amount != null) loanUpdate.loan_amount = outputs.loan_amount;
        if (outputs.points != null) loanUpdate.points = outputs.points;
        if (outputs.monthly_pi != null) loanUpdate.monthly_payment = outputs.monthly_pi;

        if (Object.keys(loanUpdate).length > 0) {
          await admin.from("loans").update(loanUpdate).eq("id", loanId);
        }
      }
    }

    // Log activity (only for loans — loan_activity_log has FK to loans)
    if (!isOpportunity) {
      await admin.from("loan_activity_log").insert({
        loan_id: loanId,
        action: "underwriting_saved",
        description: `UW v${versionNumber} saved${markActive ? " and marked active" : ""}`,
        performed_by: userId,
        metadata: { version_id: versionId, outputs },
      });
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("saveUWVersion exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function postComment(
  dealId: string,
  userId: string,
  userName: string,
  comment: string,
  isInternal: boolean,
  isOpportunity: boolean = false
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const insertPayload = isOpportunity
      ? { opportunity_id: dealId, author_id: userId, author_name: userName, comment, is_internal: isInternal }
      : { loan_id: dealId, author_id: userId, author_name: userName, comment, is_internal: isInternal };

    const { data, error } = await admin
      .from("loan_comments")
      .insert(insertPayload)
      .select()
      .single();

    if (error) return { error: error.message };

    // Log activity (only for loans — loan_activity_log has FK to loans)
    if (!isOpportunity) {
      await admin.from("loan_activity_log").insert({
        loan_id: dealId,
        action: "comment",
        description: `Comment posted by ${userName}`,
        performed_by: userId,
      });
    }

    return { success: true, comment: data };
  } catch (err: unknown) {
    console.error("postComment exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
