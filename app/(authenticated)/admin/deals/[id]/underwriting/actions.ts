"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

export { saveUWVersion } from "../actions";

export async function cloneUWVersion(
  loanId: string,
  sourceVersionId: string,
  userId: string,
  modelType: string
) {
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

    // Get next version number
    const { data: versions } = await admin
      .from("loan_underwriting_versions")
      .select("version_number")
      .eq("loan_id", loanId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    // Create clone
    const { data: newVersion, error } = await admin
      .from("loan_underwriting_versions")
      .insert({
        loan_id: loanId,
        version_number: nextVersion,
        is_active: false,
        created_by: userId,
        model_type: modelType,
        calculator_inputs: source.calculator_inputs || {},
        calculator_outputs: {},
        status: "draft",
        label: `Cloned from v${source.version_number}`,
      })
      .select()
      .single();

    if (error) {
      console.error("cloneUWVersion error:", error);
      return { error: error.message };
    }

    return { success: true, version: newVersion };
  } catch (err: unknown) {
    console.error("cloneUWVersion exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function createNewUWVersion(
  loanId: string,
  userId: string,
  modelType: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get next version number
    const { data: versions } = await admin
      .from("loan_underwriting_versions")
      .select("version_number")
      .eq("loan_id", loanId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    const { data: newVersion, error } = await admin
      .from("loan_underwriting_versions")
      .insert({
        loan_id: loanId,
        version_number: nextVersion,
        is_active: false,
        created_by: userId,
        model_type: modelType,
        calculator_inputs: {},
        calculator_outputs: {},
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("createNewUWVersion error:", error);
      return { error: error.message };
    }

    return { success: true, version: newVersion };
  } catch (err: unknown) {
    console.error("createNewUWVersion exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
