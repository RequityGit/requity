"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelineStageRule = {
  id: string;
  stage_id: string;
  field_key: string;
  error_message: string | null;
  created_at: string | null;
};

export type PipelineStageWithRules = {
  id: string;
  stage_key: string;
  name: string;
  color: string;
  stage_order: number;
  warn_days: number;
  alert_days: number;
  created_at: string | null;
  updated_at: string | null;
  pipeline_stage_rules: PipelineStageRule[];
};

// ---------------------------------------------------------------------------
// getStagesWithRules — fetch all pipeline_stages + their rules
// ---------------------------------------------------------------------------

export async function getStagesWithRules(): Promise<{
  data: PipelineStageWithRules[] | null;
  error: string | null;
}> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("pipeline_stages")
    .select("*, pipeline_stage_rules(*)")
    .order("stage_order", { ascending: true });

  if (error) {
    console.error("getStagesWithRules error:", error);
    return { data: null, error: error.message };
  }

  return { data: data as PipelineStageWithRules[], error: null };
}

// ---------------------------------------------------------------------------
// upsertStage — update warn/alert thresholds
// ---------------------------------------------------------------------------

export async function upsertStage(
  stageId: string,
  updates: { warn_days?: number; alert_days?: number }
): Promise<{ error: string | null }> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error ?? "Not authorized" };

  const admin = createAdminClient();

  const { error } = await admin
    .from("pipeline_stages")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
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
  stageId: string,
  fieldKey: string,
  errorMessage?: string
): Promise<{ error: string | null }> {
  const auth = await requireSuperAdmin();
  if ("error" in auth) return { error: auth.error ?? "Not authorized" };

  const admin = createAdminClient();

  const { error } = await admin.from("pipeline_stage_rules").insert({
    stage_id: stageId,
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
    .from("pipeline_stage_rules")
    .delete()
    .eq("id", ruleId);

  if (error) {
    console.error("deleteRule error:", error);
    return { error: error.message };
  }

  revalidatePath("/control-center/pipeline-stage-config");
  return { error: null };
}
