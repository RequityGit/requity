import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/constants";
import { getRequestOrigin } from "@/lib/get-request-origin";

/** Same role->path mapping as middleware; avoids redirecting to /admin/dashboard (which becomes /dashboard and 404s). */
const ROLE_DASHBOARDS: Record<string, string> = {
  admin: "/pipeline",
  super_admin: "/pipeline",
  borrower: "/b/dashboard",
  investor: "/i/dashboard",
};

/**
 * Max number of automatic retries for PKCE exchange failures before showing
 * the error to the user. Each retry re-initiates the full Google OAuth flow.
 */
const MAX_AUTH_RETRIES = 2;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const retryCount = parseInt(searchParams.get("_retry") || "0", 10);

  // Handle OAuth errors returned by Google (e.g., org_internal, access_denied)
  if (errorParam) {
    console.error("[auth/callback] Google OAuth error:", {
      error: errorParam,
      description: errorDescription,
    });
    const isOrgBlocked =
      errorDescription?.includes("org_internal") ||
      errorDescription?.includes("restricted to users within");
    const loginError = isOrgBlocked ? "google_blocked" : "auth_callback_failed";
    return NextResponse.redirect(`${origin}/login?error=${loginError}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Log cookie state for debugging PKCE failures
    const hasCodeVerifier = allCookies.some((c) =>
      c.name.includes("code-verifier")
    );
    if (!hasCodeVerifier) {
      console.error("[auth/callback] PKCE code verifier cookie MISSING. Cookies present:",
        allCookies.map((c) => c.name).join(", ") || "(none)"
      );
    }

    const supabase = createServerClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return allCookies;
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore cookie setting errors in route handlers
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession failed:", {
        message: error.message,
        status: error.status,
        name: error.name,
        hasCodeVerifier,
        retryCount,
        cookieNames: allCookies.map((c) => c.name),
      });

      // Auto-retry: redirect to login with a flag that triggers an automatic
      // Google OAuth re-initiation. This handles transient PKCE cookie loss
      // (e.g. browser extensions, edge caching, race conditions).
      if (retryCount < MAX_AUTH_RETRIES) {
        console.info("[auth/callback] Auto-retrying Google OAuth (attempt %d)", retryCount + 1);
        return NextResponse.redirect(
          `${origin}/login?_auth_retry=${retryCount + 1}`
        );
      }

      // Exhausted retries, show error to user
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // Get user role and redirect to their dashboard
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, activation_status")
        .eq("id", user.id)
        .single();

      // Block unauthorized or missing profiles
      if (!profile || profile.activation_status === "unauthorized") {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=no_access`);
      }

      if (profile.role) {
        // Mark portal as activated on first sign-in
        if (profile.activation_status && profile.activation_status !== "activated") {
          await supabase
            .from("profiles")
            .update({ activation_status: "activated" })
            .eq("id", user.id);
        }

        const path = ROLE_DASHBOARDS[profile.role] ?? "/b/dashboard";
        return NextResponse.redirect(`${origin}${path}`);
      }
    }

    // No user or no profile role -- block access
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_access`);
  }

  // No code and no error param -- something unexpected
  console.error("[auth/callback] No code or error param in callback URL");
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
