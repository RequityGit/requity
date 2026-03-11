"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth/require-admin";

export async function deleteCrmContactAction(contactId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("crm_contacts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", contactId);

    if (error) {
      console.error("deleteCrmContactAction error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/crm");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCrmContactAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function deleteCrmCompanyAction(companyId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("companies")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", companyId);

    if (error) {
      console.error("deleteCrmCompanyAction error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/crm");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCrmCompanyAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}

export async function deleteContactFileAction(
  fileId: string,
  _storagePath: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Look up the actual storage path from the database instead of trusting client input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fileRecord, error: lookupError } = await (admin as any)
      .from("contact_files")
      .select("storage_path")
      .eq("id", fileId)
      .single();

    if (lookupError || !fileRecord) {
      console.error("deleteContactFileAction lookup error:", lookupError);
      return { error: "File not found" };
    }

    const verifiedPath = (fileRecord as { storage_path: string }).storage_path;

    // Delete from storage using the verified path
    const { error: storageError } = await admin.storage
      .from("contact-files")
      .remove([verifiedPath]);

    if (storageError) {
      console.error("deleteContactFileAction storage error:", storageError);
    }

    // Delete from database
    const { error } = await admin
      .from("contact_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      console.error("deleteContactFileAction error:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/crm");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteContactFileAction error:", err);
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
