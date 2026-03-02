import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface ImpersonationState {
  isImpersonating: boolean;
  targetUserId: string | null;
  targetRole: string | null;
  targetUserName: string | null;
  targetUserEmail: string | null;
}

export interface EffectiveAuth {
  supabase: SupabaseClient<Database>;
  userId: string;
  isImpersonating: boolean;
  realUserId: string;
}

/**
 * Read impersonation state from cookies (server-side).
 */
export function getImpersonationState(): ImpersonationState {
  const cookieStore = cookies();
  const targetUserId = cookieStore.get("impersonate_user_id")?.value ?? null;
  const targetRole = cookieStore.get("impersonate_role")?.value ?? null;
  const targetUserName = cookieStore.get("impersonate_user_name")?.value ?? null;
  const targetUserEmail = cookieStore.get("impersonate_user_email")?.value ?? null;

  return {
    isImpersonating: !!targetUserId,
    targetUserId,
    targetRole,
    targetUserName,
    targetUserEmail,
  };
}

/**
 * Get the effective auth context for data-fetching pages.
 * When impersonating, returns the admin client + impersonated user's ID.
 * When not impersonating, returns the normal server client + real user's ID.
 *
 * Always validates the real user is super_admin before allowing impersonation.
 */
export async function getEffectiveAuth(): Promise<EffectiveAuth> {
  const serverSupabase = createClient();

  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const impersonation = getImpersonationState();

  if (impersonation.isImpersonating && impersonation.targetUserId) {
    // Verify the real user is a super_admin
    const { data: superAdminRole } = await serverSupabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .maybeSingle();

    if (superAdminRole) {
      // Use admin client (bypasses RLS) with impersonated user's ID
      const adminSupabase = createAdminClient();
      return {
        supabase: adminSupabase,
        userId: impersonation.targetUserId,
        isImpersonating: true,
        realUserId: user.id,
      };
    }
    // If not super_admin, fall through to normal auth
  }

  return {
    supabase: serverSupabase,
    userId: user.id,
    isImpersonating: false,
    realUserId: user.id,
  };
}

/**
 * Resolve the auth user's ID to the corresponding investors.id.
 * The investor_commitments, capital_calls (contributions), and distributions tables
 * reference investors.id — NOT auth.users.id — so this lookup is
 * required before querying those tables.
 */
export async function getInvestorId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("investors")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}
