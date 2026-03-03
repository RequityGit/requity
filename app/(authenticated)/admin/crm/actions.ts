"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(): Promise<
  { user: { id: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .maybeSingle();

  if (!adminRole) return { error: "Not authorized" };

  return { user };
}

async function requireSuperAdmin(): Promise<
  { user: { id: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .single();

  if (!superAdminRole) return { error: "Not authorized" };

  return { user };
}

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

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteCrmContactAction error:", err);
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
    const { error } = await (admin as any)
      .from("contact_files")
      .delete()
      .eq("id", fileId);

    if (error) {
      console.error("deleteContactFileAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteContactFileAction error:", err);
    return {
      error:
        err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}
