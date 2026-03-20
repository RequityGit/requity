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
  currentStepId: string | null,
  options?: { dealId?: string; dealApplicationLinkId?: string }
): Promise<{ id: string; session_token: string } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();

  const insertData: Record<string, unknown> = {
    form_id: formId,
    status: "partial",
    type: "create",
    data,
    current_step_id: currentStepId,
  };

  if (options?.dealId) insertData.deal_id = options.dealId;
  if (options?.dealApplicationLinkId) insertData.deal_application_link_id = options.dealApplicationLinkId;

  const { data: submission, error } = await supabase
    .from("form_submissions")
    .insert(insertData)
    .select("id, session_token")
    .single();

  if (error) {
    console.error("Failed to create submission:", error.message);
    return null;
  }

  // If linked to a deal application link, update the link with the submission_id
  if (options?.dealApplicationLinkId && submission) {
    await supabase
      .from("deal_application_links")
      .update({ submission_id: submission.id })
      .eq("id", options.dealApplicationLinkId);
  }

  return submission as { id: string; session_token: string };
}
