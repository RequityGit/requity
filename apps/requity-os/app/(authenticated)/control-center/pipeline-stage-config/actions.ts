"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UnifiedStageRule = {
  id: string;
  stage_config_id: string;
  field_key: string;
  error_message: string | null;
  created_at: string | null;
};

export type UnifiedStageWithRules = {
  id: string;
  stage: string;
  sort_order: number;
  warn_days: number | null;
  alert_days: number | null;
  description: string | null;
  unified_stage_rules: UnifiedStageRule[];
};

// ---------------------------------------------------------------------------
// getStagesWithRules — fetch all unified_stage_configs + their rules
// ---------------------------------------------------------------------------

export async function getStagesWithRules(): Promise<{
  data: UnifiedStageWithRules[] | null;
  error: string | null;
}> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("unified_stage_configs")
    .select("*, unified_stage_rules(*)")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getStagesWithRules error:", error);
    return { data: null, error: error.message };
  }

  return { data: data as unknown as UnifiedStageWithRules[], error: null };
}

// ---------------------------------------------------------------------------
// upsertStage — update warn/alert thresholds
// ---------------------------------------------------------------------------

export async function upsertStage(
  stageId: string,
  updates: { warn_days?: number | null; alert_days?: number | null }
): Promise<{ error: string | null }> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error ?? "Not authorized" };

  const admin = createAdminClient();

  const { error } = await admin
    .from("unified_stage_configs")
    .update(updates)
    .eq("id", stageId);

  if (error) {
    console.error("upsertStage error:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/pipeline-stage-config");
  return { error: null };
}

// ---------------------------------------------------------------------------
// addRule — insert a new advancement rule
// ---------------------------------------------------------------------------

export async function addRule(
  stageConfigId: string,
  fieldKey: string,
  errorMessage?: string
): Promise<{ error: string | null }> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error ?? "Not authorized" };

  const admin = createAdminClient();

  const { error } = await admin.from("unified_stage_rules").insert({
    stage_config_id: stageConfigId,
    field_key: fieldKey,
    error_message: errorMessage || null,
  });

  if (error) {
    console.error("addRule error:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/pipeline-stage-config");
  return { error: null };
}

// ---------------------------------------------------------------------------
// deleteRule — remove a rule
// ---------------------------------------------------------------------------

export async function deleteRule(
  ruleId: string
): Promise<{ error: string | null }> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error ?? "Not authorized" };

  const admin = createAdminClient();

  const { error } = await admin
    .from("unified_stage_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    console.error("deleteRule error:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/pipeline-stage-config");
  return { error: null };
}
