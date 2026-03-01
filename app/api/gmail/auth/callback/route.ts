import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["admin", "borrower", "investor"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Determine redirect base using active_role cookie
  const cookieRole = request.cookies.get("active_role")?.value;
  const role =
    cookieRole && VALID_ROLES.includes(cookieRole) ? cookieRole : "admin";
  const fallbackRedirect = `${origin}/${role}/account`;

  if (error) {
    const message = encodeURIComponent(
      error === "access_denied"
        ? "You declined the Gmail authorization request."
        : `Google returned an error: ${error}`
    );
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${message}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Missing authorization code or state.")}`
    );
  }

  // Decode state to get the user ID
  let stateUserId: string;
  try {
    const decoded = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
    stateUserId = decoded.userId;
  } catch {
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Invalid state parameter.")}`
    );
  }

  // Verify the authenticated user matches the state
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== stateUserId) {
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Session mismatch. Please try again.")}`
    );
  }

  // Exchange authorization code for tokens
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Google OAuth is not configured on the server.")}`
    );
  }

  const redirectUri = `${appUrl}/api/gmail/auth/callback`;

  let tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
  };

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      return NextResponse.redirect(
        `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Failed to exchange authorization code.")}`
      );
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("Google token exchange error:", err);
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Failed to connect to Google.")}`
    );
  }

  // Fetch the user's Gmail email address
  let gmailEmail: string;
  try {
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    if (!profileRes.ok) {
      throw new Error("Failed to fetch Google profile");
    }

    const profileData = await profileRes.json();
    gmailEmail = profileData.email;
  } catch (err) {
    console.error("Failed to fetch Gmail profile:", err);
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Could not retrieve your Gmail address.")}`
    );
  }

  // Store tokens in gmail_tokens table using admin client (bypasses RLS)
  const adminSupabase = createAdminClient();

  // Deactivate any existing active tokens for this user
  await adminSupabase
    .from("gmail_tokens")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Parse granted scopes from token response
  const grantedScopes = tokenData.scope
    ? tokenData.scope.split(" ")
    : [];

  // Insert the new token
  const { error: insertError } = await adminSupabase
    .from("gmail_tokens")
    .insert({
      user_id: user.id,
      email: gmailEmail,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || "",
      token_expires_at: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),
      is_active: true,
      scopes: grantedScopes,
    });

  if (insertError) {
    console.error("Failed to store Gmail token:", insertError);
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Failed to save Gmail connection.")}`
    );
  }

  // Determine the user's active role for redirect
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profileRole = profile?.role || "admin";
  const effectiveRole =
    cookieRole && VALID_ROLES.includes(cookieRole) ? cookieRole : profileRole;
  const redirectPath = `${origin}/${effectiveRole}/account`;

  return NextResponse.redirect(`${redirectPath}?gmail=connected`);
}
