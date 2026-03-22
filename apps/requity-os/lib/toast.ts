// lib/toast.ts — Standardized toast notifications
//
// Usage:
//   showSuccess("Contact deleted")
//   showError("Could not delete contact", error)
//   showLoading("Generating PDF...")  → returns ID for resolveLoading/rejectLoading
//   showWarning("This action is irreversible")
//   showInfo("Email draft saved")

import { toast as sonnerToast } from "sonner";

/** Success — action completed */
export function showSuccess(message: string) {
  sonnerToast.success(message);
}

/** Error — action failed. Accepts string or Error object. */
export function showError(message: string, error?: unknown) {
  const description =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : undefined;
  sonnerToast.error(message, { description });
}

/** Warning — action succeeded with caveats, or validation issue */
export function showWarning(message: string, description?: string) {
  sonnerToast.warning(message, { description });
}

/** Info — neutral notification */
export function showInfo(message: string, description?: string) {
  sonnerToast(message, { description });
}

/** Loading — starts a persistent toast, returns ID for updating */
export function showLoading(message: string): string | number {
  return sonnerToast.loading(message);
}

/** Resolve a loading toast to success */
export function resolveLoading(id: string | number, message: string) {
  sonnerToast.success(message, { id });
}

/** Resolve a loading toast to error */
export function rejectLoading(
  id: string | number,
  message: string,
  error?: unknown,
) {
  const description =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : undefined;
  sonnerToast.error(message, { id, description });
}

/** Dismiss a specific toast or all toasts */
export function dismissToast(id?: string | number) {
  sonnerToast.dismiss(id);
}
