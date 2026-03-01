"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UnderwritingInputs, UnderwritingOutputs } from "@/lib/underwriting/types";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const, user: null };
  return { user, error: null };
}

export async function getUnderwritingVersions(loanId: string) {
  const { user, error } = await requireAuth();
  if (error) return { data: null, error };

  const supabase = await createClient();
  const { data, error: dbError } = await supabase
    .from("loan_underwriting_versions")
    .select("*, creator:profiles!loan_underwriting_versions_created_by_fkey(full_name)")
    .eq("loan_id", loanId)
    .order("version_number", { ascending: false });

  if (dbError) return { data: null, error: dbError.message };
  return { data, error: null };
}

export async function createUnderwritingVersion(params: {
  loanId: string;
  label: string | null;
  notes: string | null;
  calculatorInputs: UnderwritingInputs;
  calculatorOutputs: UnderwritingOutputs;
  setActive?: boolean;
}): Promise<{ success?: true; id?: string; error?: string }> {
  const { user, error } = await requireAuth();
  if (error) return { error };

  try {
    const admin = createAdminClient();

    const { data, error: insertError } = await admin
      .from("loan_underwriting_versions")
      .insert({
        loan_id: params.loanId,
        created_by: user!.id,
        label: params.label,
        notes: params.notes,
        calculator_inputs: params.calculatorInputs as any,
        calculator_outputs: params.calculatorOutputs as any,
        status: "draft",
        is_active: false,
      })
      .select("id")
      .single();

    if (insertError) return { error: insertError.message };

    if (params.setActive && data) {
      await admin.rpc("set_active_underwriting_version", {
        p_version_id: data.id,
      });
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("createUnderwritingVersion error:", err);
    return { error: err?.message ?? "Unexpected error" };
  }
}

export async function updateUnderwritingVersionStatus(
  versionId: string,
  status: string
): Promise<{ success?: true; error?: string }> {
  const { user, error } = await requireAuth();
  if (error) return { error };

  try {
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("loan_underwriting_versions")
      .update({ status })
      .eq("id", versionId);

    if (updateError) return { error: updateError.message };
    return { success: true };
  } catch (err: any) {
    console.error("updateUnderwritingVersionStatus error:", err);
    return { error: err?.message ?? "Unexpected error" };
  }
}

export async function setActiveVersion(
  versionId: string
): Promise<{ success?: true; error?: string }> {
  const { user, error } = await requireAuth();
  if (error) return { error };

  try {
    const admin = createAdminClient();
    const { error: rpcError } = await admin.rpc(
      "set_active_underwriting_version",
      { p_version_id: versionId }
    );

    if (rpcError) return { error: rpcError.message };
    return { success: true };
  } catch (err: any) {
    console.error("setActiveVersion error:", err);
    return { error: err?.message ?? "Unexpected error" };
  }
}
