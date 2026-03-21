import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const AUTH_SNAPSHOT_COOKIE = "rq_auth_snap";
export const AUTH_SNAPSHOT_HEADER = "x-rq-auth-snapshot";

/** Cached role-adjacent data (not full profile). TTL 5 minutes. */
export interface AuthSnapshotPayload {
  v: 1;
  uid: string;
  exp: number;
  isSuperAdmin: boolean;
  accessibleModules: string[];
}

const TTL_MS = 5 * 60 * 1000;

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeAuthSnapshot(payload: AuthSnapshotPayload): string {
  return utf8ToBase64(JSON.stringify(payload));
}

export function decodeAuthSnapshot(raw: string): AuthSnapshotPayload | null {
  try {
    const json = base64ToUtf8(raw);
    const parsed = JSON.parse(json) as AuthSnapshotPayload;
    if (parsed.v !== 1 || typeof parsed.uid !== "string" || typeof parsed.exp !== "number") {
      return null;
    }
    if (!Array.isArray(parsed.accessibleModules)) return null;
    if (typeof parsed.isSuperAdmin !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isSnapshotFresh(payload: AuthSnapshotPayload): boolean {
  return payload.exp > Date.now();
}

export async function buildAuthSnapshot(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Omit<AuthSnapshotPayload, "v" | "exp"> & { exp: number }> {
  const [superAdminResult, moduleResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("user_module_access")
      .select("module_id, modules(name)")
      .eq("user_id", userId),
  ]);

  const isSuperAdmin = !!superAdminResult.data;
  const accessibleModules: string[] = isSuperAdmin
    ? []
    : (moduleResult.data ?? [])
        .map((ma) => {
          const mod = ma.modules as unknown as { name: string } | null;
          return mod?.name ?? "";
        })
        .filter(Boolean);

  return {
    uid: userId,
    isSuperAdmin,
    accessibleModules,
    exp: Date.now() + TTL_MS,
  };
}

export function toSnapshotPayload(
  partial: Omit<AuthSnapshotPayload, "v" | "exp"> & { exp: number }
): AuthSnapshotPayload {
  return { v: 1, ...partial };
}
