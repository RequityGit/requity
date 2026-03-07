"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";
import { saveUWVersion as _saveUWVersion } from "../actions";
import type { UWModelType } from "../components";
import type { UWVersionData } from "@/components/admin/underwriting/uw-editor-client";

// Wrapper needed because "use server" files can only export async functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const result = await _saveUWVersion(versionId, loanId, inputs, outputs, markActive, userId, userName, versionNumber, isOpportunity);
  revalidatePath("/admin/pipeline");
  return result;
}

export async function cloneUWVersion(
  loanId: string,
  sourceVersionId: string,
  userId: string,
  modelType: string,
  isOpportunity: boolean = false
): Promise<{ success?: boolean; error?: string; version?: UWVersionData }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Fetch source version inputs
    const { data: source, error: srcErr } = await admin
      .from("loan_underwriting_versions")
      .select("calculator_inputs, version_number")
      .eq("id", sourceVersionId)
      .single();

    if (srcErr || !source) {
      return { error: srcErr?.message || "Source version not found" };
    }

    // Get next version number — query by appropriate FK
    const versionQuery = isOpportunity
      ? admin
          .from("loan_underwriting_versions")
          .select("version_number")
          .eq("opportunity_id", loanId)
          .order("version_number", { ascending: false })
          .limit(1)
      : admin
          .from("loan_underwriting_versions")
          .select("version_number")
          .eq("loan_id", loanId)
          .order("version_number", { ascending: false })
          .limit(1);

    const { data: versions } = await versionQuery;
    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    // Create clone with appropriate FK
    const insertPayload = {
      ...(isOpportunity ? { opportunity_id: loanId } : { loan_id: loanId }),
      version_number: nextVersion,
      is_active: false,
      created_by: userId,
      model_type: modelType,
      calculator_inputs: source.calculator_inputs || {},
      calculator_outputs: {},
      status: "draft" as const,
      label: `Cloned from v${source.version_number}`,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newVersion, error } = await (admin as any)
      .from("loan_underwriting_versions")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("cloneUWVersion error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/pipeline");
    return { success: true, version: { ...newVersion, model_type: modelType as UWModelType } as UWVersionData };
  } catch (err: unknown) {
    console.error("cloneUWVersion exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createNewUWVersion(
  loanId: string,
  userId: string,
  modelType: string,
  isOpportunity: boolean = false
): Promise<{ success?: boolean; error?: string; version?: UWVersionData }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get next version number — query by appropriate FK
    const versionQuery = isOpportunity
      ? admin
          .from("loan_underwriting_versions")
          .select("version_number")
          .eq("opportunity_id", loanId)
          .order("version_number", { ascending: false })
          .limit(1)
      : admin
          .from("loan_underwriting_versions")
          .select("version_number")
          .eq("loan_id", loanId)
          .order("version_number", { ascending: false })
          .limit(1);

    const { data: versions } = await versionQuery;
    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    const insertPayload = {
      ...(isOpportunity ? { opportunity_id: loanId } : { loan_id: loanId }),
      version_number: nextVersion,
      is_active: false,
      created_by: userId,
      model_type: modelType,
      calculator_inputs: {},
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
      console.error("createNewUWVersion error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/pipeline");
    return { success: true, version: { ...newVersion, model_type: modelType as UWModelType } as UWVersionData };
  } catch (err: unknown) {
    console.error("createNewUWVersion exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
