import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/constants";
import { getRequestOrigin } from "@/lib/get-request-origin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors returned by Google (e.g., org_internal, access_denied)
  if (errorParam) {
    const isOrgBlocked =
      errorDescription?.includes("org_internal") ||
      errorDescription?.includes("restricted to users within");
    const loginError = isOrgBlocked ? "google_blocked" : "auth_callback_failed";
    return NextResponse.redirect(`${origin}/login?error=${loginError}`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
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

    if (!error) {
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

          return NextResponse.redirect(`${origin}/${profile.role}/dashboard`);
        }
      }

      // No user or no profile role — block access
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=no_access`);
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
