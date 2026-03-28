"use server";

// Loan condition uploads are disabled while the borrower portal is being rebuilt.
// This stub prevents import errors from components that reference this module.

export async function uploadConditionDocument(
  _formData: FormData
): Promise<{ success?: true; error?: string }> {
  return { error: "Loan uploads are temporarily unavailable" };
}
