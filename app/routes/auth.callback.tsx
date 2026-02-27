import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "~/utils/supabase.server";

/**
 * OAuth callback handler.
 * After Google OAuth consent, Supabase redirects here with a code.
 * We exchange the code for a session, then redirect based on role.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error_description");

  if (errorParam) {
    return redirect(`/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (!code) {
    return redirect("/login?error=No+authorization+code+received");
  }

  const { supabase, headers } = createSupabaseServerClient(request);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirect(
      `/login?error=${encodeURIComponent(error.message)}`,
      { headers }
    );
  }

  // Session is now set in cookies by the Supabase SSR client.
  // Determine role and redirect.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login?error=Authentication+failed", { headers });
  }

  // Check admin first
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  if (admin) {
    return redirect("/admin", { headers });
  }

  // Check investor
  const { data: investor } = await supabase
    .from("investors")
    .select("id")
    .eq("id", user.id)
    .single();

  if (investor) {
    return redirect("/dashboard", { headers });
  }

  // User authenticated but has no investor/admin profile
  // This can happen on first login — redirect to dashboard (investor default)
  return redirect("/dashboard", { headers });
}
