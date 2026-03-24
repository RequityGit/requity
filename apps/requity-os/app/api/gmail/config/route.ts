import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/config
 * Returns Gmail OAuth configuration diagnostics.
 * Authenticated admins get full diagnostics; anonymous users get basic status only.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const origin = new URL(request.url).origin;

  const configured = Boolean(clientId && clientSecret);

  // Basic response for anonymous/non-admin users
  const basic = { configured };

  // Check if user is authenticated admin for detailed diagnostics
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json(basic);

  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || !["super_admin", "admin"].includes(role.role)) {
    return NextResponse.json(basic);
  }

  // Admin diagnostics
  const effectiveAppUrl = appUrl || origin;
  const redirectUri = `${effectiveAppUrl}/api/gmail/auth/callback`;

  return NextResponse.json({
    configured,
    diagnostics: {
      has_client_id: Boolean(clientId),
      client_id_prefix: clientId ? clientId.slice(0, 20) + "..." : null,
      has_client_secret: Boolean(clientSecret),
      secret_length: clientSecret ? clientSecret.length : 0,
      app_url_env: appUrl || "(NOT SET - falling back to request origin)",
      effective_redirect_uri: redirectUri,
      request_origin: origin,
      redirect_uri_matches_origin: redirectUri.startsWith(origin),
    },
  });
}
