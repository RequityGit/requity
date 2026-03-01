"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperAdmin() {
  const supabase = createClient();
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

export async function grantRole(
  targetUserId: string,
  role: string,
  investorId?: string | null,
  borrowerId?: string | null
) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Check if user already has this active role
    const { data: existing } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("role", role as "super_admin" | "admin" | "investor" | "borrower")
      .eq("is_active", true)
      .single();

    if (existing) {
      return { error: `User already has an active ${role} role` };
    }

    const { error } = await admin.from("user_roles").insert({
      user_id: targetUserId,
      role: role as "super_admin" | "admin" | "investor" | "borrower",
      granted_by: auth.user.id,
      investor_id: investorId || null,
      borrower_id: borrowerId || null,
    });

    if (error) {
      console.error("Grant role error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Grant role error:", err);
    return { error: "Failed to grant role" };
  }
}

export async function revokeRole(roleRowId: string, currentUserId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    // Check if user is trying to revoke their own super_admin role
    const admin = createAdminClient();
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("user_id, role")
      .eq("id", roleRowId)
      .single();

    if (!roleRow) return { error: "Role not found" };

    if (
      roleRow.user_id === currentUserId &&
      roleRow.role === "super_admin"
    ) {
      return {
        error:
          "You cannot revoke your own Super Admin access. Another Super Admin must do this.",
      };
    }

    const { error } = await admin
      .from("user_roles")
      .update({ is_active: false })
      .eq("id", roleRowId);

    if (error) {
      console.error("Revoke role error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Revoke role error:", err);
    return { error: "Failed to revoke role" };
  }
}

export async function reactivateRole(roleRowId: string) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_roles")
      .update({ is_active: true })
      .eq("id", roleRowId);

    if (error) {
      console.error("Reactivate role error:", error);
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Reactivate role error:", err);
    return { error: "Failed to reactivate role" };
  }
}
