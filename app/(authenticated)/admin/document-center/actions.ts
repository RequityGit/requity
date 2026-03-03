"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" } as const;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"]);

  if (!roles || roles.length === 0)
    return { error: "Unauthorized" } as const;

  return { user } as const;
}

export interface UploadDocumentInput {
  file_name: string;
  display_name: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  document_type: string;
  category: string;
  visibility: string;
  notes: string | null;
  loan_id: string | null;
  fund_id: string | null;
  borrower_id: string | null;
  investor_id: string | null;
  company_id: string | null;
  crm_contact_id: string | null;
}

export async function createPortalDocumentAction(input: UploadDocumentInput) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("portal_documents")
      .insert({
        file_name: input.file_name,
        display_name: input.display_name || null,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        document_type: input.document_type,
        category: input.category,
        visibility: input.visibility,
        notes: input.notes || null,
        loan_id: input.loan_id || null,
        fund_id: input.fund_id || null,
        borrower_id: input.borrower_id || null,
        investor_id: input.investor_id || null,
        company_id: input.company_id || null,
        crm_contact_id: input.crm_contact_id || null,
        uploaded_by: auth.user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating portal document:", error);
      return { error: error.message };
    }

    return { success: true, documentId: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error creating portal document:", err);
    return { error: message };
  }
}

export async function deletePortalDocumentAction(documentId: string) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Get the document to find its storage path
    const { data: doc, error: fetchError } = await admin
      .from("portal_documents")
      .select("file_path")
      .eq("id", documentId)
      .single();

    if (fetchError) {
      console.error("Error fetching portal document:", fetchError);
      return { error: fetchError.message };
    }

    // Soft delete the record
    const { error: deleteError } = await admin
      .from("portal_documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", documentId);

    if (deleteError) {
      console.error("Error deleting portal document:", deleteError);
      return { error: deleteError.message };
    }

    // Also remove from storage
    if (doc?.file_path) {
      await admin.storage.from("portal-documents").remove([doc.file_path]);
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error deleting portal document:", err);
    return { error: message };
  }
}

export async function updateDocumentVisibilityAction(
  documentId: string,
  visibility: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("portal_documents")
      .update({ visibility })
      .eq("id", documentId);

    if (error) {
      console.error("Error updating document visibility:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error updating document visibility:", err);
    return { error: message };
  }
}
