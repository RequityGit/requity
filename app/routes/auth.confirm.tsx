import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/utils/supabase.server";

/**
 * Magic Link confirmation handler.
 * When the user clicks the magic link in their email, Supabase redirects here
 * with a token_hash and type parameter. We verify the OTP and establish a session.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const errorParam = url.searchParams.get("error_description");

  if (errorParam) {
    return redirect(`/login?error=${encodeURIComponent(errorParam)}`);
  }

  // Magic links come with token_hash and type=magiclink
  if (token_hash && type) {
    const { supabase, headers } = createSupabaseServerClient(request);

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "magiclink" | "email",
    });

    if (error) {
      return redirect(
        `/login?error=${encodeURIComponent(error.message)}`,
        { headers }
      );
    }

    // Session is set. Determine role and redirect.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login?error=Authentication+failed", { headers });
    }

    // Check admin
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .single();

    if (admin) {
      return redirect("/admin", { headers });
    }

    // Default: investor dashboard
    return redirect("/dashboard", { headers });
  }

  // Also handle code-based flow (some magic link configurations use code)
  const code = url.searchParams.get("code");
  if (code) {
    const { supabase, headers } = createSupabaseServerClient(request);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirect(
        `/login?error=${encodeURIComponent(error.message)}`,
        { headers }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/login?error=Authentication+failed", { headers });
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .single();

    if (admin) {
      return redirect("/admin", { headers });
    }

    return redirect("/dashboard", { headers });
  }

  // No valid parameters
  return redirect("/login?error=Invalid+or+expired+sign-in+link");
}
