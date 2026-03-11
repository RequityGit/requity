// Auto-save logic: debounced save on step transitions and field blur

import { createClient } from "@/lib/supabase/client";

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export async function saveSubmission(
  submissionId: string,
  data: Record<string, unknown>,
  currentStepId: string | null
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const { error } = await supabase
    .from("form_submissions")
    .update({
      data,
      current_step_id: currentStepId,
    })
    .eq("id", submissionId);

  if (error) {
    console.error("Auto-save failed:", error.message);
  }
}

export function debouncedSave(
  submissionId: string,
  data: Record<string, unknown>,
  currentStepId: string | null,
  delayMs = 2000
): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveSubmission(submissionId, data, currentStepId);
  }, delayMs);
}

export function immediateSave(
  submissionId: string,
  data: Record<string, unknown>,
  currentStepId: string | null
): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveSubmission(submissionId, data, currentStepId);
}

export async function createSubmission(
  formId: string,
  data: Record<string, unknown>,
  currentStepId: string | null
): Promise<{ id: string; session_token: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();
  const { data: submission, error } = await supabase
    .from("form_submissions")
    .insert({
      form_id: formId,
      status: "partial",
      type: "create",
      data,
      current_step_id: currentStepId,
    })
    .select("id, session_token")
    .single();

  if (error) {
    console.error("Failed to create submission:", error.message);
    return null;
  }

  return submission as { id: string; session_token: string };
}
