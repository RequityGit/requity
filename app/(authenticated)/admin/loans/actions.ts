"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function deleteLoanAction(loanId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Delete associated loan conditions first
    const { error: conditionsError } = await admin
      .from("loan_conditions")
      .delete()
      .eq("loan_id", loanId);

    if (conditionsError) {
      console.error("deleteLoanAction — error deleting conditions:", conditionsError);
      return { error: conditionsError.message };
    }

    // Soft-delete the loan
    const { error } = await admin
      .from("loans")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", loanId);

    if (error) {
      console.error("deleteLoanAction error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("deleteLoanAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
