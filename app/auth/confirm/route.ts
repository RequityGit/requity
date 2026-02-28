import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const cookieStore = cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              // Ignore cookie errors in edge cases
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
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          return NextResponse.redirect(`${origin}/${profile.role}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}/investor/dashboard`);
    }
  }

  // Verification error - redirect to login
  return NextResponse.redirect(`${origin}/login?error=verification_failed`);
}
