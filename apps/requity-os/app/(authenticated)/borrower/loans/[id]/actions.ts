"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// uploadConditionDocument
// Uploads a file to loan-documents storage and records metadata in loan_documents.
// Uses admin client for storage + DB write (service role bypasses storage RLS).
// Auth check is done via the session client first.
// ---------------------------------------------------------------------------
export async function uploadConditionDocument(
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  const file = formData.get("file") as File | null;
  const conditionId = formData.get("conditionId") as string | null;
  const loanId = formData.get("loanId") as string | null;

  if (!file || !conditionId || !loanId) {
    return { error: "Missing required fields" };
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Verify the borrower owns this loan (RLS will enforce this, but check explicitly)
    const { data: condition } = await supabase
      .from("loan_conditions")
      .select("id, loan_id")
      .eq("id", conditionId)
      .eq("loan_id", loanId)
      .single();

    if (!condition) {
      return { error: "Condition not found or access denied" };
    }

    const adminClient = createAdminClient();

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${sanitizedName}`;
    const storagePath = `${loanId}/${fileName}`;

    const { error: storageError } = await adminClient.storage
      .from("loan-documents")
      .upload(storagePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (storageError) return { error: storageError.message };

    const { error: dbError } = await adminClient
      .from("loan_documents")
      .insert({
        loan_id: loanId,
        condition_id: conditionId,
        document_name: file.name,
        file_url: storagePath,
        uploaded_by: user.id,
        file_size_bytes: file.size,
        mime_type: file.type || null,
      });

    if (dbError) {
      // Best-effort: remove the uploaded file if DB insert fails
      await adminClient.storage
        .from("loan-documents")
        .remove([storagePath]);
      return { error: dbError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("uploadConditionDocument error:", err);
    return { error: err?.message ?? "Unexpected error" };
  }
}

// ---------------------------------------------------------------------------
// addConditionComment
// Posts an external (non-internal) comment on a condition.
// Borrowers can only post is_internal = false comments.
// ---------------------------------------------------------------------------
export async function addConditionComment(
  conditionId: string,
  loanId: string,
  comment: string
): Promise<{ success?: true; error?: string }> {
  if (!comment.trim()) return { error: "Comment cannot be empty" };

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    // Fetch the borrower's display name from their profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const authorName = profile?.full_name ?? "Borrower";

    // RLS policy on loan_condition_comments enforces borrower ownership
    // and prevents is_internal = true from being set by borrowers.
    const { error } = await (supabase as any)
      .from("loan_condition_comments")
      .insert({
        condition_id: conditionId,
        loan_id: loanId,
        author_id: user.id,
        author_name: authorName,
        comment: comment.trim(),
        is_internal: false,
        mentions: [],
      });

    if (error) return { error: error.message };

    return { success: true };
  } catch (err: any) {
    console.error("addConditionComment error:", err);
    return { error: err?.message ?? "Unexpected error" };
  }
}
