import { redirect } from "@remix-run/node";
import type { Investor, Admin, UserRole } from "~/types/database";
import { createSupabaseServerClient } from "~/utils/supabase.server";

export interface AuthResult {
  userId: string;
  role: UserRole;
  investor: Investor | null;
  admin: Admin | null;
  headers: Headers;
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 * Determines user role (investor or admin) by checking both tables.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const { supabase, headers } = createSupabaseServerClient(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw redirect("/login", { headers });
  }

  // Check if user is an admin
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  if (admin) {
    return {
      userId: user.id,
      role: "admin",
      investor: null,
      admin: admin as Admin,
      headers,
    };
  }

  // Check if user is an investor
  const { data: investor } = await supabase
    .from("investors")
    .select("*")
    .eq("id", user.id)
    .single();

  if (investor) {
    return {
      userId: user.id,
      role: "investor",
      investor: investor as Investor,
      admin: null,
      headers,
    };
  }

  // User exists in auth but has no profile — redirect to login
  throw redirect("/login", { headers });
}

/**
 * Requires a specific role. Redirects to the appropriate dashboard if role doesn't match.
 */
export async function requireRole(
  request: Request,
  role: UserRole
): Promise<AuthResult> {
  const auth = await requireAuth(request);

  if (auth.role !== role) {
    if (auth.role === "admin") {
      throw redirect("/admin", { headers: auth.headers });
    }
    throw redirect("/dashboard", { headers: auth.headers });
  }

  return auth;
}

/**
 * Requires admin role.
 */
export async function requireAdmin(request: Request): Promise<AuthResult> {
  return requireRole(request, "admin");
}

/**
 * Requires investor role.
 */
export async function requireInvestor(request: Request): Promise<AuthResult> {
  return requireRole(request, "investor");
}

/**
 * Gets optional auth — returns auth data or null without redirecting.
 */
export async function getOptionalAuth(
  request: Request
): Promise<AuthResult | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * Determines user role by checking admin and investor tables.
 * Returns the role or null if no profile found.
 */
export async function getUserRole(
  request: Request
): Promise<{ role: UserRole | null; headers: Headers }> {
  const { supabase, headers } = createSupabaseServerClient(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { role: null, headers };
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  if (admin) {
    return { role: "admin", headers };
  }

  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("id", user.id)
    .single();

  if (investor) {
    return { role: "investor", headers };
  }

  return { role: null, headers };
}
