import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(`${origin}/login`);
    }

    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
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

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

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

  // Verification error - redirect to login
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
