import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import type { EmailOtpType } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/constants";
import { getRequestOrigin } from "@/lib/get-request-origin";

/**
 * Redirect the verified user to their role-based dashboard,
 * or back to login with an appropriate error.
 */
async function redirectForUser(
  supabase: ReturnType<typeof createServerClient<Database>>,
  origin: string
) {
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
      if (
        profile.activation_status &&
        profile.activation_status !== "activated"
      ) {
        await supabase
          .from("profiles")
          .update({ activation_status: "activated" })
          .eq("id", user.id);
      }

      return NextResponse.redirect(
        `${origin}/${profile.role}/dashboard`
      );
    }
  }

  // No user or no profile role
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?error=no_access`);
}

function buildSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);

  // Handle errors forwarded from Supabase (e.g. expired OTP)
  const errorParam = searchParams.get("error");
  if (errorParam) {
    const errorCode = searchParams.get("error_code") || "";
    const isExpired = errorCode === "otp_expired";
    const loginError = isExpired ? "link_expired" : "verification_failed";
    return NextResponse.redirect(`${origin}/login?error=${loginError}`);
  }

  // --- PKCE flow: Supabase redirects with a `code` parameter ---
  const code = searchParams.get("code");
  if (code) {
    const supabase = buildSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirectForUser(supabase, origin);
    }

    // Code exchange failed
    return NextResponse.redirect(
      `${origin}/login?error=verification_failed`
    );
  }

  // --- Legacy (non-PKCE) flow: token_hash + type ---
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = buildSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return redirectForUser(supabase, origin);
    }
  }

  // Verification error - redirect to login
  return NextResponse.redirect(
    `${origin}/login?error=verification_failed`
  );
}
