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
