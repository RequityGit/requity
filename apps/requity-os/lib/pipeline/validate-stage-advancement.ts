import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Validates whether a deal can advance to a target stage by checking
 * the unified_stage_rules configured in the database.
 *
 * Supports both top-level deal fields and uw_data fields (prefixed with "uw:").
 *
 * Returns { valid: true } if all rules pass, or { valid: false, message }
 * with the first failing rule's error message.
 */
export async function validateStageAdvancement(
  deal: Record<string, any>,
  targetStage: string
): Promise<{ valid: true } | { valid: false; message: string }> {
  const admin = createAdminClient();

  // Fetch the unified_stage_config + its rules for the target stage
  const { data: stageConfig, error } = await admin
    .from("unified_stage_configs")
    .select("id, stage, unified_stage_rules(*)")
    .eq("stage", targetStage)
    .single();

  // If no config exists for this stage, allow advancement
  if (error || !stageConfig) {
    return { valid: true };
  }

  const rules = (stageConfig as any).unified_stage_rules ?? [];
  const uwData = (deal.uw_data as Record<string, unknown>) ?? {};

  for (const rule of rules) {
    const fieldKey: string = rule.field_key;
    let value: unknown;

    if (fieldKey.startsWith("uw:")) {
      // Check inside uw_data JSON
      const uwKey = fieldKey.slice(3);
      value = uwData[uwKey];
    } else {
      // Check top-level deal field
      value = deal[fieldKey];
    }

    const isEmpty =
      value === null || value === undefined || value === "";

    if (isEmpty) {
      const fieldLabel = fieldKey
        .replace(/^uw:/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        valid: false,
        message:
          rule.error_message || `${fieldLabel} is required to enter ${stageConfig.stage}`,
      };
    }
  }

  return { valid: true };
}
