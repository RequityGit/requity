"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Update one or more fields on a loan record.
 * Accepts a partial object of columns to update.
 */
export async function updateDealField(
  dealId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: Record<string, any>
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Never allow updating these system-managed fields
    const forbidden = ["id", "loan_number", "created_at", "deleted_at"];
    for (const key of forbidden) {
      delete fields[key];
    }

    if (Object.keys(fields).length === 0) {
      return { error: "No fields to update" };
    }

    const { error } = await admin
      .from("loans")
      .update(fields)
      .eq("id", dealId);

    if (error) {
      console.error("updateDealField error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("updateDealField exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
