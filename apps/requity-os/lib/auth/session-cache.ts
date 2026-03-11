import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface SessionData {
  user: { id: string; email?: string };
  profile: Record<string, unknown>;
  isSuperAdmin: boolean;
  effectiveRole: string;
  accessibleModules: string[];
  allowedRoles: string[];
}

/**
 * Request-scoped session cache using React cache().
 * Deduplicates auth queries within a single server request so that both
 * the layout and any page component can call getSessionData() without
 * triggering redundant DB round-trips.
 *
 * After getUser(), the three follow-up queries (profiles, user_roles,
 * user_module_access) run in parallel via Promise.all.
 */
export const getSessionData = cache(
  async (): Promise<SessionData | null> => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Run all three queries in parallel (they only depend on user.id)
    const [profileResult, superAdminResult, moduleResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("user_module_access")
        .select("module_id, modules(name)")
        .eq("user_id", user.id),
    ]);

    const profile = profileResult.data;
    if (!profile) return null;

    const isSuperAdmin = !!superAdminResult.data;

    // Determine effective role from cookie, falling back to profile default
    const cookieStore = cookies();
    const activeRoleCookie = cookieStore.get("active_role")?.value;
    const allowedRoles: string[] = (profile as Record<string, unknown>)
      .allowed_roles
      ? ((
          (profile as Record<string, unknown>).allowed_roles as unknown[]
        ).filter(Boolean) as string[])
      : [(profile as Record<string, unknown>).role].filter(
          Boolean
        ) as string[];

    const effectiveRole =
      activeRoleCookie && allowedRoles.includes(activeRoleCookie)
        ? activeRoleCookie
        : ((profile as Record<string, unknown>).role as string) ?? "borrower";

    const accessibleModules: string[] = isSuperAdmin
      ? [] // empty means "all" for super admins
      : (moduleResult.data ?? [])
          .map((ma) => {
            const mod = ma.modules as unknown as { name: string } | null;
            return mod?.name ?? "";
          })
          .filter(Boolean);

    return {
      user: { id: user.id, email: user.email },
      profile: profile as Record<string, unknown>,
      isSuperAdmin,
      effectiveRole,
      accessibleModules,
      allowedRoles,
    };
  }
);
