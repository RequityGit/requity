"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  { user: { id: string }; error?: never } | { error: string; user?: never }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") return { error: "Unauthorized" };

  return { user };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  allowed_roles: (string | null)[];
  activation_status: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  user_roles: {
    role: string;
    is_active: boolean;
    investor_id: string | null;
    borrower_id: string | null;
  }[];
}

export interface InviteUserInput {
  email: string;
  full_name: string;
  role: "super_admin" | "admin" | "investor" | "borrower";
  investor_id?: string;
  borrower_id?: string;
}

// ---------------------------------------------------------------------------
// Fetch all users with their roles
// ---------------------------------------------------------------------------

export async function fetchUsersAction(): Promise<
  { success: true; users: UserRow[] } | { error: string }
> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) return { error: profilesError.message };

    // Fetch auth users for last_sign_in_at
    const { data: authData, error: authError } =
      await admin.auth.admin.listUsers({ perPage: 1000 });

    if (authError) return { error: authError.message };

    const authUsersMap = new Map(
      authData.users.map((u) => [u.id, u])
    );

    // Build a map of user_id → roles from user_roles table
    const userRolesMap = new Map<
      string,
      { role: string; is_active: boolean; investor_id: string | null; borrower_id: string | null }[]
    >();

    // Try to query user_roles directly
    try {
      const { data: rawRoles } = await admin
        .from("user_roles" as never)
        .select("user_id, role, is_active, investor_id, borrower_id" as never) as {
        data: {
          user_id: string;
          role: string;
          is_active: boolean;
          investor_id: string | null;
          borrower_id: string | null;
        }[] | null;
      };

      if (rawRoles) {
        for (const r of rawRoles) {
          const existing = userRolesMap.get(r.user_id) || [];
          existing.push({
            role: r.role,
            is_active: r.is_active,
            investor_id: r.investor_id,
            borrower_id: r.borrower_id,
          });
          userRolesMap.set(r.user_id, existing);
        }
      }
    } catch {
      // user_roles table query failed — continue without it
    }

    const users: UserRow[] = (profiles ?? []).map((p) => {
      const authUser = authUsersMap.get(p.id);
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        role: p.role,
        allowed_roles: p.allowed_roles ?? [p.role],
        activation_status: p.activation_status ?? "pending",
        created_at: p.created_at,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        user_roles: userRolesMap.get(p.id) || [],
      };
    });

    return { success: true, users };
  } catch (err: unknown) {
    console.error("fetchUsersAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Helper: upsert a profile row, retrying without full_name if the column
// doesn't exist yet in the database (schema cache miss).
// ---------------------------------------------------------------------------

async function upsertProfileRow(
  admin: ReturnType<typeof createAdminClient>,
  data: {
    id: string;
    email: string;
    full_name: string;
    role: "super_admin" | "admin" | "borrower" | "investor";
    allowed_roles: ("super_admin" | "admin" | "borrower" | "investor")[];
    activation_status: "pending" | "link_sent" | "activated";
  }
): Promise<string | null> {
  const { error } = await admin.from("profiles").upsert(data);
  if (error) {
    if (error.message.includes("full_name")) {
      // The full_name column hasn't been added to the DB yet — retry without it.
      const { full_name: _omitted, ...rest } = data;
      void _omitted;
      const { error: retryError } = await admin.from("profiles").upsert(rest as never);
      return retryError?.message ?? null;
    }
    return error.message;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Invite a new user
// ---------------------------------------------------------------------------

export async function inviteUserAction(input: InviteUserInput): Promise<
  { success: true; userId: string } | { error: string }
> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();

    // Check if user already exists
    const { data: existingProfiles } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("email", input.email);

    if (existingProfiles && existingProfiles.length > 0) {
      return {
        error: `A user with email ${input.email} already exists.`,
      };
    }

    // Determine profile role and allowed_roles based on input
    const profileRole = input.role;
    const allowedRoles: ("super_admin" | "admin" | "borrower" | "investor")[] =
      input.role === "super_admin"
        ? ["admin", "super_admin"]
        : [input.role];

    // Create the auth user with invite (sends email)
    const { data: newUser, error: createError } =
      await admin.auth.admin.inviteUserByEmail(input.email, {
        data: {
          full_name: input.full_name,
          role: input.role,
        },
      });

    if (createError) {
      // If auth user exists but no profile (orphaned), try to fix
      if (
        createError.message.includes("already been registered") ||
        createError.message.includes("already exists")
      ) {
        const { data: listData } = await admin.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(
          (u) => u.email === input.email
        );
        if (existingAuthUser) {
          // Create the profile for the orphaned user
          const upsertError = await upsertProfileRow(admin, {
            id: existingAuthUser.id,
            email: input.email,
            full_name: input.full_name,
            role: profileRole,
            allowed_roles: allowedRoles,
            activation_status: "link_sent",
          });

          if (upsertError) return { error: upsertError };

          // Grant roles via database function
          if (input.role === "super_admin") {
            await grantRoleForUser(admin, existingAuthUser.id, "admin");
            await grantRoleForUser(admin, existingAuthUser.id, "super_admin");
          } else {
            await grantRoleForUser(
              admin,
              existingAuthUser.id,
              input.role,
              input.investor_id,
              input.borrower_id
            );
          }

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
      role: profileRole,
      allowed_roles: allowedRoles,
      activation_status: "link_sent",
    });

    if (upsertError) {
      console.error("Profile upsert error:", upsertError);
    }

    // Grant roles via database function
    if (input.role === "super_admin") {
      await grantRoleForUser(admin, newUser.user.id, "admin");
      await grantRoleForUser(admin, newUser.user.id, "super_admin");
    } else {
      await grantRoleForUser(
        admin,
        newUser.user.id,
        input.role,
        input.investor_id,
        input.borrower_id
      );
    }

    return { success: true, userId: newUser.user.id };
  } catch (err: unknown) {
    console.error("inviteUserAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Grant role helper — calls the existing grant_role() DB function
// ---------------------------------------------------------------------------

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
    // Non-fatal — the role may still be tracked in profiles.allowed_roles
  }
}

// ---------------------------------------------------------------------------
// Add role to existing user
// ---------------------------------------------------------------------------

export async function addRoleAction(
  userId: string,
  role: string,
  investorId?: string,
  borrowerId?: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    // Use the authenticated user's client for the RPC call so the DB function
    // can verify the caller is a super_admin via auth.uid()
    const userClient = await createClient();
    const admin = createAdminClient();

    const { error: rpcError } = await userClient.rpc("grant_role" as never, {
      _user_id: userId,
      _role: role,
      _investor_id: investorId || null,
      _borrower_id: borrowerId || null,
    } as never);

    if (rpcError) return { error: rpcError.message };

    // Also update profiles.allowed_roles
    const { data: profile } = await admin
      .from("profiles")
      .select("allowed_roles")
      .eq("id", userId)
      .single();

    if (profile) {
      const currentRoles = profile.allowed_roles ?? [];
      if (!currentRoles.includes(role as "admin" | "borrower" | "investor")) {
        const newRoles = [...currentRoles, role as "admin" | "borrower" | "investor"];
        await admin
          .from("profiles")
          .update({ allowed_roles: newRoles })
          .eq("id", userId);
      }
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("addRoleAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Remove role from user
// ---------------------------------------------------------------------------

export async function removeRoleAction(
  userId: string,
  role: string,
  investorId?: string,
  borrowerId?: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    // Use the authenticated user's client for the RPC call so the DB function
    // can verify the caller is a super_admin via auth.uid()
    const userClient = await createClient();
    const admin = createAdminClient();

    const { error: rpcError } = await userClient.rpc("revoke_role" as never, {
      _user_id: userId,
      _role: role,
      _investor_id: investorId || null,
      _borrower_id: borrowerId || null,
    } as never);

    if (rpcError) return { error: rpcError.message };

    // Also update profiles.allowed_roles
    const { data: profile } = await admin
      .from("profiles")
      .select("allowed_roles, role")
      .eq("id", userId)
      .single();

    if (profile) {
      const currentRoles = profile.allowed_roles ?? [];
      const newRoles = currentRoles.filter((r) => r !== role);

      const update: Record<string, unknown> = { allowed_roles: newRoles };

      // If we removed the primary role, switch to the first remaining role
      if (profile.role === role && newRoles.length > 0) {
        update.role = newRoles[0];
      }

      await admin.from("profiles").update(update).eq("id", userId);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("removeRoleAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Update user activation status
// ---------------------------------------------------------------------------

export async function updateActivationStatusAction(
  userId: string,
  status: "pending" | "link_sent" | "activated"
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();

    const { error } = await admin
      .from("profiles")
      .update({ activation_status: status })
      .eq("id", userId);

    if (error) return { error: error.message };

    return { success: true };
  } catch (err: unknown) {
    console.error("updateActivationStatusAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Resend invite email
// ---------------------------------------------------------------------------

export async function resendInviteAction(
  userId: string
): Promise<{ success: true } | { error: string }> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();

    // Get user email
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!profile || !profile.email) return { error: "User not found or has no email" };

    // Generate a new magic link
    const { error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: profile.email,
    });

    if (linkError) return { error: linkError.message };

    // Update status
    await admin
      .from("profiles")
      .update({ activation_status: "link_sent" })
      .eq("id", userId);

    return { success: true };
  } catch (err: unknown) {
    console.error("resendInviteAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Fetch investors and borrowers for linking in invite flow
// ---------------------------------------------------------------------------

export async function fetchInvestorsAction(): Promise<
  { success: true; investors: { id: string; first_name: string; last_name: string; email: string | null }[] } | { error: string }
> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await (admin as any)
      .from("investors")
      .select("id, first_name, last_name, email")
      .order("last_name");

    if (error) return { error: error.message };

    return { success: true, investors: (data ?? []) as any[] };
  } catch (err: unknown) {
    console.error("fetchInvestorsAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}

export async function fetchBorrowersAction(): Promise<
  { success: true; borrowers: { id: string; first_name: string; last_name: string; email: string | null }[] } | { error: string }
> {
  try {
    const auth = await requireAdmin();
    if (auth.error) return { error: auth.error };

    const admin = createAdminClient();
    const { data, error } = await (admin as any)
      .from("borrowers")
      .select("id, first_name, last_name, email")
      .order("last_name");

    if (error) return { error: error.message };

    return { success: true, borrowers: (data ?? []) as any[] };
  } catch (err: unknown) {
    console.error("fetchBorrowersAction error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return { error: message };
  }
}
