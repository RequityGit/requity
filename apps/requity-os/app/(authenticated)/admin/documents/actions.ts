"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

type DocumentSource = "loan" | "contact" | "company" | "deal";

// ---------------------------------------------------------------------------
// Rename
// ---------------------------------------------------------------------------

export async function renameDocumentAction(
  id: string,
  source: DocumentSource,
  newName: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error as string };

    const trimmed = newName.trim();
    if (!trimmed) return { error: "Name cannot be empty" };

    const admin = createAdminClient();

    let error: { message: string } | null = null;

    switch (source) {
      case "loan": {
        const res = await admin
          .from("documents")
          .update({ file_name: trimmed, description: trimmed })
          .eq("id", id);
        error = res.error;
        break;
      }
      case "contact": {
        const res = await admin
          .from("contact_files")
          .update({ file_name: trimmed })
          .eq("id", id);
        error = res.error;
        break;
      }
      case "company": {
        const res = await admin
          .from("company_files")
          .update({ file_name: trimmed })
          .eq("id", id);
        error = res.error;
        break;
      }
      case "deal": {
        const res = await admin
          .from("unified_deal_documents")
          .update({ document_name: trimmed })
          .eq("id", id);
        error = res.error;
        break;
      }
    }

    if (error) return { error: error.message };

    revalidatePath("/admin/documents");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Rename failed" };
  }
}

// ---------------------------------------------------------------------------
// Delete (soft delete, super_admin only)
// ---------------------------------------------------------------------------

export async function deleteDocumentAction(
  id: string,
  source: DocumentSource
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error as string };

    const admin = createAdminClient();
    const now = new Date().toISOString();

    let error: { message: string } | null = null;

    switch (source) {
      case "loan": {
        const res = await admin
          .from("documents")
          .update({ deleted_at: now })
          .eq("id", id);
        error = res.error;
        break;
      }
      case "contact": {
        const res = await admin
          .from("contact_files")
          .update({ deleted_at: now })
          .eq("id", id);
        error = res.error;
        break;
      }
      case "company": {
        const res = await admin
          .from("company_files")
          .update({ deleted_at: now })
          .eq("id", id);
        error = res.error;
        break;
      }
      case "deal": {
        const res = await admin
          .from("unified_deal_documents")
          .update({ deleted_at: now })
          .eq("id", id);
        error = res.error;
        break;
      }
    }

    if (error) return { error: error.message };

    revalidatePath("/admin/documents");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Delete failed" };
  }
}

// ---------------------------------------------------------------------------
// Preview URL (signed URL for storage-backed docs)
// ---------------------------------------------------------------------------

export async function getDocumentPreviewUrl(
  id: string,
  source: DocumentSource
): Promise<{ url: string; mime_type: string | null } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error as string };

    const admin = createAdminClient();

    switch (source) {
      case "loan": {
        const { data, error } = await admin
          .from("documents")
          .select("file_path, file_url, mime_type")
          .eq("id", id)
          .single();
        if (error || !data) return { error: "Document not found" };

        if (data.file_path) {
          const { data: signed, error: signErr } = await admin.storage
            .from("loan-documents")
            .createSignedUrl(data.file_path, 3600);
          if (signErr || !signed) return { error: "Failed to generate preview URL" };
          return { url: signed.signedUrl, mime_type: data.mime_type };
        }
        if (data.file_url) return { url: data.file_url, mime_type: data.mime_type };
        return { error: "No file path available" };
      }

      case "contact": {
        const { data, error } = await admin
          .from("contact_files")
          .select("storage_path, mime_type")
          .eq("id", id)
          .single();
        if (error || !data) return { error: "Document not found" };

        const { data: signed, error: signErr } = await admin.storage
          .from("contact-files")
          .createSignedUrl(data.storage_path, 3600);
        if (signErr || !signed) return { error: "Failed to generate preview URL" };
        return { url: signed.signedUrl, mime_type: data.mime_type };
      }

      case "company": {
        const { data, error } = await admin
          .from("company_files")
          .select("storage_path, mime_type")
          .eq("id", id)
          .single();
        if (error || !data) return { error: "Document not found" };

        const { data: signed, error: signErr } = await admin.storage
          .from("company-files")
          .createSignedUrl(data.storage_path, 3600);
        if (signErr || !signed) return { error: "Failed to generate preview URL" };
        return { url: signed.signedUrl, mime_type: data.mime_type };
      }

      case "deal": {
        const { data, error } = await admin
          .from("unified_deal_documents")
          .select("storage_path, file_url, mime_type")
          .eq("id", id)
          .single();
        if (error || !data) return { error: "Document not found" };

        if (data.storage_path) {
          const { data: signed, error: signErr } = await admin.storage
            .from("deal-documents")
            .createSignedUrl(data.storage_path, 3600);
          if (signErr || !signed) return { error: "Failed to generate preview URL" };
          return { url: signed.signedUrl, mime_type: data.mime_type };
        }
        if (data.file_url) return { url: data.file_url, mime_type: data.mime_type };
        return { error: "No file path available" };
      }

      default:
        return { error: "Invalid source" };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to get preview URL" };
  }
}
