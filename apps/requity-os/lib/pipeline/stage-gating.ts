import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A field_configurations row with stage gating columns.
 */
interface StageGatingField {
  field_key: string;
  field_label: string;
  module: string;
  required_at_stage: string | null;
  blocks_stage_progression: boolean | null;
}

/**
 * Stage ordering for comparison. A field required at "analysis" means
 * it must be filled at analysis and all subsequent stages.
 */
const STAGE_ORDER: Record<string, number> = {
  lead: 0,
  analysis: 1,
  negotiation: 2,
  execution: 3,
  closed: 4,
};

function stageIndex(stage: string): number {
  return STAGE_ORDER[stage] ?? -1;
}

export interface StageGatingResult {
  canProgress: boolean;
  missingFields: { field_key: string; label: string; module: string }[];
}

/**
 * Validates whether a deal can advance to the target stage by checking
 * field_configurations where blocks_stage_progression = true and
 * required_at_stage <= targetStage.
 *
 * This complements (does not replace) the existing validateStageAdvancement()
 * which checks unified_stage_rules.
 */
export async function validateStageGating(
  targetStage: string,
  dealData: Record<string, unknown>,
  uwData: Record<string, unknown>
): Promise<StageGatingResult> {
  const targetIdx = stageIndex(targetStage);

  // If the target stage isn't in our ordering, skip validation
  if (targetIdx < 0) {
    return { canProgress: true, missingFields: [] };
  }

  const admin = createAdminClient();

  // Fetch all fields that block stage progression
  const { data, error } = await admin
    .from("field_configurations" as never)
    .select("field_key, field_label, module, required_at_stage, blocks_stage_progression" as never)
    .eq("blocks_stage_progression" as never, true as never)
    .eq("is_archived" as never, false as never)
    .eq("is_visible" as never, true as never);

  if (error || !data) {
    // On error, don't block progression
    return { canProgress: true, missingFields: [] };
  }

  const fields = data as unknown as StageGatingField[];
  const missingFields: { field_key: string; label: string; module: string }[] = [];

  for (const field of fields) {
    if (!field.required_at_stage) continue;

    const requiredIdx = stageIndex(field.required_at_stage);
    if (requiredIdx < 0 || targetIdx < requiredIdx) continue;

    // This field is required at or before the target stage
    // Check if it has a value
    const isUwField = field.module.startsWith("uw_");
    const value = isUwField
      ? uwData[field.field_key]
      : dealData[field.field_key];

    const isEmpty = value === null || value === undefined || value === "";
    if (isEmpty) {
      missingFields.push({
        field_key: field.field_key,
        label: field.field_label,
        module: field.module,
      });
    }
  }

  return {
    canProgress: missingFields.length === 0,
    missingFields,
  };
}
