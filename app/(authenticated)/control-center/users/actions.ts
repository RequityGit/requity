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

// ---------------------------------------------------------------------------
// Invite / Add User
// ---------------------------------------------------------------------------

export interface InviteUserInput {
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "investor" | "borrower";
  investor_id?: string;
  borrower_id?: string;
}

async function upsertProfileRow(
  admin: ReturnType<typeof createAdminClient>,
  data: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    allowed_roles: string[];
    activation_status: string;
  }
): Promise<string | null> {
  const { error } = await admin.from("profiles").upsert(data);
  if (error) {
    if (error.message.includes("full_name")) {
      const { full_name: _omitted, ...rest } = data;
      void _omitted;
      const { error: retryError } = await admin
        .from("profiles")
        .upsert(rest as never);
      return retryError?.message ?? null;
    }
    return error.message;
  }
  return null;
}

async function grantRoleForUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  role: string,
  investorId?: string,
  borrowerId?: string
) {
  try {
    await admin.rpc("grant_role" as never, {
      _user_id: userId,
      _role: role,
      _investor_id: investorId || null,
      _borrower_id: borrowerId || null,
    } as never);
  } catch (err) {
    console.error("grant_role RPC error:", err);
  }
}

export async function inviteUser(
  input: InviteUserInput
): Promise<{ success: true; userId: string } | { error: string }> {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();

    // Check if user already exists in profiles
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("id, email")
      .eq("email", input.email);

    if (existingProfiles && existingProfiles.length > 0) {
      return { error: `A user with email ${input.email} already exists.` };
    }

    // Create the auth user with invite (sends email)
    const { data: newUser, error: createError } =
      await admin.auth.admin.inviteUserByEmail(input.email, {
        data: {
          full_name: input.full_name,
          role: input.role,
        },
      });

    if (createError) {
      // If auth user exists but no profile (orphaned), fix it
      if (
        createError.message.includes("already been registered") ||
        createError.message.includes("already exists")
      ) {
        const { data: listData } = await admin.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(
          (u) => u.email === input.email
        );
        if (existingAuthUser) {
          const upsertError = await upsertProfileRow(admin, {
            id: existingAuthUser.id,
            email: input.email,
            full_name: input.full_name,
            role: input.role,
            allowed_roles: [input.role],
            activation_status: "link_sent",
          });

          if (upsertError) return { error: upsertError };

          await grantRoleForUser(
            admin,
            existingAuthUser.id,
            input.role,
            input.investor_id,
            input.borrower_id
          );

          return { success: true, userId: existingAuthUser.id };
        }
      }
      return { error: createError.message };
    }

    if (!newUser.user) {
      return { error: "Failed to create user" };
    }

    // Update profile created by trigger (or create if trigger didn't fire)
    const upsertError = await upsertProfileRow(admin, {
      id: newUser.user.id,
      email: input.email,
      full_name: input.full_name,
      role: input.role,
      allowed_roles: [input.role],
      activation_status: "link_sent",
    });

    if (upsertError) {
      console.error("Profile upsert error:", upsertError);
    }

    // Grant role via database function
    await grantRoleForUser(
      admin,
      newUser.user.id,
      input.role,
      input.investor_id,
      input.borrower_id
    );

    return { success: true, userId: newUser.user.id };
  } catch (err: unknown) {
    console.error("inviteUser error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
