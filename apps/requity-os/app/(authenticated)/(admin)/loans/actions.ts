"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

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

    revalidatePath("/loans");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteLoanAction error:", err);
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
