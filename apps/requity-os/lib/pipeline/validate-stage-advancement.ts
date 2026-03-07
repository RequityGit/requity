import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Validates whether a deal can advance to a target stage by checking
 * the pipeline_stage_rules configured in the database.
 *
 * Returns { valid: true } if all rules pass, or { valid: false, message }
 * with the first failing rule's error message.
 */
export async function validateStageAdvancement(
  deal: Record<string, any>,
  targetStage: string
): Promise<{ valid: true } | { valid: false; message: string }> {
  const admin = createAdminClient();

  // Fetch the pipeline_stage + its rules for the target stage
  const { data: stage, error } = await admin
    .from("pipeline_stages")
    .select("id, stage_key, name, pipeline_stage_rules(*)")
    .eq("stage_key", targetStage)
    .single();

  // If no config exists for this stage, allow advancement
  if (error || !stage) {
    return { valid: true };
  }

  const rules = (stage as any).pipeline_stage_rules ?? [];

  for (const rule of rules) {
    const value = deal[rule.field_key];
    const isEmpty =
      value === null || value === undefined || value === "";

    if (isEmpty) {
      const fieldLabel = rule.field_key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        valid: false,
        message:
          rule.error_message || `${fieldLabel} is required to enter ${stage.name}`,
      };
    }
  }

  return { valid: true };
}
