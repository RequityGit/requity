"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { SANDBOX_DEFAULT_INPUTS } from "@/lib/underwriting/types";
import { computeOutputs } from "@/lib/underwriting/calculator";
import { COMMERCIAL_SANDBOX_DEFAULTS } from "@/lib/underwriting/commercial-types";
import { computeCommercialOutputs } from "@/lib/underwriting/commercial-calculator";

export async function createSandboxVersion(
  userId: string,
  modelType: string
): Promise<{ success?: boolean; error?: string; versionId?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    const isCommercial = modelType === "commercial";
    const defaultInputs = isCommercial
      ? COMMERCIAL_SANDBOX_DEFAULTS
      : SANDBOX_DEFAULT_INPUTS;
    const defaultOutputs = isCommercial
      ? computeCommercialOutputs(COMMERCIAL_SANDBOX_DEFAULTS)
      : computeOutputs(SANDBOX_DEFAULT_INPUTS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("loan_underwriting_versions")
      .insert({
        loan_id: null,
        opportunity_id: null,
        is_sandbox: true,
        model_type: modelType,
        version_number: 1,
        is_active: false,
        status: "draft",
        created_by: userId,
        calculator_inputs: defaultInputs as unknown as Record<string, unknown>,
        calculator_outputs: defaultOutputs as unknown as Record<string, unknown>,
        computation_status: "computed",
      })
      .select("id")
      .single();

    if (error) {
      console.error("createSandboxVersion error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/models");
    return { success: true, versionId: data.id };
  } catch (err) {
    console.error("createSandboxVersion exception:", err);
    return { error: "Failed to create sandbox version" };
  }
}

export async function saveSandboxVersion(
  versionId: string,
  _loanId: string,
  inputs: Record<string, unknown>,
  outputs: Record<string, unknown>,
  _markActive: boolean,
  _userId: string,
  _userName: string,
  _versionNumber: number,
  _isOpportunity: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAdmin();
    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("loan_underwriting_versions")
      .update({
        calculator_inputs: inputs,
        calculator_outputs: outputs,
      })
      .eq("id", versionId)
      .eq("is_sandbox", true);

    if (error) {
      console.error("saveSandboxVersion error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/models");
    return { success: true };
  } catch (err) {
    console.error("saveSandboxVersion exception:", err);
    return { error: "Failed to save sandbox version" };
  }
}

// Stub clone action for sandbox (not used but needed by UWEditorClient props)
export async function cloneSandboxVersion(
  _loanId: string,
  _sourceVersionId: string,
  _userId: string,
  _modelType: string,
  _isOpportunity: boolean
): Promise<{ success?: boolean; error?: string }> {
  return { error: "Clone is not available in sandbox mode" };
}

// Stub create action for sandbox
export async function createSandboxVersionAction(
  _loanId: string,
  _userId: string,
  _modelType: string,
  _isOpportunity: boolean
): Promise<{ success?: boolean; error?: string }> {
  return { error: "Only one sandbox version is supported" };
}
