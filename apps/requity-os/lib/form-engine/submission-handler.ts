// Client-side submission logic: calls the API route

interface SubmitFormParams {
  submissionId: string;
  formId: string;
  data: Record<string, unknown>;
  mode: "create" | "update";
  recordId?: string | null;
}

interface SubmitFormResult {
  success: boolean;
  submission_id?: string;
  entity_ids?: Record<string, string>;
  error?: string;
  step?: string;
}

export async function submitForm(params: SubmitFormParams): Promise<SubmitFormResult> {
  try {
    const response = await fetch("/api/forms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submission_id: params.submissionId,
        form_id: params.formId,
        data: params.data,
        mode: params.mode,
        record_id: params.recordId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Submission failed (${response.status})`,
        step: errorData.step,
      };
    }

    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
