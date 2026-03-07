"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateTermSheetTemplate(
  templateId: string,
  updates: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Verify super_admin role
    const { data: superAdminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .maybeSingle();

    if (!superAdminRole) {
      return { error: "Unauthorized — super admin access required" };
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("term_sheet_templates")
      .update({
        ...updates,
        last_edited_by: user.id,
        last_edited_at: new Date().toISOString(),
      })
      .eq("id", templateId);

    if (error) {
      console.error("Failed to update term sheet template:", error);
      return { error: error.message };
    }

    revalidatePath("/admin/settings/term-sheets");
    return { success: true };
  } catch (err) {
    console.error("updateTermSheetTemplate error:", err);
    return { error: "An unexpected error occurred" };
  }
}
