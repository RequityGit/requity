import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import {
  AUTH_SNAPSHOT_COOKIE,
  AUTH_SNAPSHOT_HEADER,
  decodeAuthSnapshot,
  isSnapshotFresh,
  type AuthSnapshotPayload,
} from "@/lib/auth/auth-snapshot";

export interface SessionData {
  user: { id: string; email?: string };
  profile: Record<string, unknown>;
  isSuperAdmin: boolean;
  effectiveRole: string;
  accessibleModules: string[];
  allowedRoles: string[];
}

async function resolveSnapshotForUser(
  userId: string
): Promise<AuthSnapshotPayload | null> {
  const h = await headers();
  const inline = h.get(AUTH_SNAPSHOT_HEADER);
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(AUTH_SNAPSHOT_COOKIE)?.value;
  const raw = inline ?? fromCookie;
  if (!raw) return null;
  const snap = decodeAuthSnapshot(raw);
  if (!snap || snap.uid !== userId || !isSnapshotFresh(snap)) return null;
  return snap;
}

/**
 * Request-scoped session cache using React cache().
 * Deduplicates auth queries within a single server request so that both
 * the layout and any page component can call getSessionData() without
 * triggering redundant DB round-trips.
 *
 * When middleware has refreshed the auth snapshot (httpOnly cookie + optional
 * request header on the same round-trip), user_roles and user_module_access
 * are skipped and only profiles is loaded.
 */
export const getSessionData = cache(
  async (): Promise<SessionData | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const cookieStore = await cookies();
    const snap = await resolveSnapshotForUser(user.id);

    const profileResult = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const profile = profileResult.data;
    if (!profile) return null;

    if (snap) {
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

      return {
        user: { id: user.id, email: user.email },
        profile: profile as Record<string, unknown>,
        isSuperAdmin: snap.isSuperAdmin,
        effectiveRole,
        accessibleModules: snap.accessibleModules,
        allowedRoles,
      };
    }

    const [superAdminResult, moduleResult] = await Promise.all([
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

    const isSuperAdmin = !!superAdminResult.data;

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
      ? []
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
