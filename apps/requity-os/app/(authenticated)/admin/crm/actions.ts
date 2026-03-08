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
  storagePath: string
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Delete from storage
    const { error: storageError } = await admin.storage
      .from("contact-files")
      .remove([storagePath]);

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
