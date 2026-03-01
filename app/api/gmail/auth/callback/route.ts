import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Determine redirect base — we'll append query params later
  const fallbackRedirect = `${origin}/admin/account`;

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
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any)
    .from("gmail_tokens")
    .update({ is_active: false })
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Insert the new token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (adminSupabase as any)
    .from("gmail_tokens")
    .insert({
      user_id: user.id,
      email: gmailEmail,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: new Date(
        Date.now() + tokenData.expires_in * 1000
      ).toISOString(),
      is_active: true,
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

  const activeRole = profile?.role || "admin";
  const redirectPath = `${origin}/${activeRole}/account`;

  return NextResponse.redirect(`${redirectPath}?gmail=connected`);
}
