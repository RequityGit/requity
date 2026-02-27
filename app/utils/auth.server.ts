import { redirect } from "@remix-run/node";
import type { Profile, UserRole } from "~/types/database";
import { getSession } from "~/session.server";
import { getSupabaseClient } from "~/utils/getSupabaseClient";

export async function requireAuth(request: Request): Promise<{
  token: string;
  userId: string;
  profile: Profile;
}> {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("__session");

  if (!token) {
    throw redirect("/login");
  }

  const supabase = getSupabaseClient(token);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw redirect("/login");
  }

  return { token, userId: user.id, profile: profile as Profile };
}

export async function requireRole(
  request: Request,
  role: UserRole
): Promise<{ token: string; userId: string; profile: Profile }> {
  const auth = await requireAuth(request);

  if (auth.profile.role !== role) {
    if (auth.profile.role === 'admin') {
      throw redirect("/admin");
    }
    throw redirect("/dashboard");
  }

  return auth;
}

export async function requireAdmin(request: Request) {
  return requireRole(request, "admin");
}

export async function requireBorrower(request: Request) {
  return requireRole(request, "borrower");
}

export async function getOptionalAuth(request: Request) {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}
