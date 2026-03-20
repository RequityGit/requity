/**
 * Pure utility functions for the document upload pipeline.
 * Extracted for testability — no Supabase or server dependencies.
 */

/** Sanitize a filename for safe storage: timestamp prefix + safe chars only */
export function sanitizeStorageName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Build the storage path for a deal document */
export function buildStoragePath(
  dealId: string,
  fileName: string,
  conditionId?: string
): string {
  const safeName = sanitizeStorageName(fileName);
  if (conditionId) {
    return `deals/${dealId}/conditions/${conditionId}/${safeName}`;
  }
  return `deals/${dealId}/${safeName}`;
}

/** Human-readable file size */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "\u2014";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

/** Maximum file sizes by context (in bytes) */
export const MAX_FILE_SIZES = {
  document: 25 * 1024 * 1024, // 25 MB
  contactFile: 25 * 1024 * 1024, // 25 MB
  profilePhoto: 10 * 1024 * 1024, // 10 MB
} as const;

/** Accepted file extensions for deal documents */
export const ACCEPTED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
] as const;

/** Validate a file for upload — returns an error message or null if valid */
export function validateFile(
  file: { name: string; size: number; type: string },
  options?: { maxSizeBytes?: number; acceptedExtensions?: readonly string[] }
): string | null {
  const maxSize = options?.maxSizeBytes ?? MAX_FILE_SIZES.document;
  const extensions = options?.acceptedExtensions ?? ACCEPTED_DOCUMENT_EXTENSIONS;

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return `File size must be less than ${maxMB}MB`;
  }

  if (file.size === 0) {
    return "File is empty";
  }

  const ext = file.name.includes(".")
    ? "." + file.name.split(".").pop()!.toLowerCase()
    : "";

  if (extensions.length > 0 && ext && !extensions.includes(ext as never)) {
    return `File type ${ext} is not accepted`;
  }

  return null;
}

/** Check if a review status indicates the document is still being processed */
export function isReviewInFlight(
  status: string | null | undefined
): boolean {
  return status === "pending" || status === "processing";
}

/** Check if any document statuses indicate in-flight processing */
export function hasInFlightDocuments(
  statuses: (string | null | undefined)[]
): boolean {
  return statuses.some(isReviewInFlight);
}
