import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Shared auth guard types
// ---------------------------------------------------------------------------

export type AuthSuccess = {
  user: { id: string; email?: string };
  error?: never;
};

export type AuthError = {
  error: string;
  user?: never;
};

export type AuthResult = AuthSuccess | AuthError;

// ---------------------------------------------------------------------------
// requireAdmin — checks that the caller has admin or super_admin role
// Uses user_roles table with is_active flag for accurate role checking.
// ---------------------------------------------------------------------------

export async function requireAdmin(): Promise<AuthResult> {
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
    .limit(1)
    .single();

  if (!adminRole) return { error: "Not authorized" };

  return { user: { id: user.id, email: user.email ?? undefined } };
}

// ---------------------------------------------------------------------------
// requireSuperAdmin — checks that the caller has super_admin role specifically
// ---------------------------------------------------------------------------

export async function requireSuperAdmin(): Promise<AuthResult> {
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

  return { user: { id: user.id, email: user.email ?? undefined } };
}
