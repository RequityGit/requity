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
  const supabase = await createClient();
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set - Gmail OAuth redirect_uri will be unreliable");
  }
  const effectiveAppUrl = appUrl || origin;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${fallbackRedirect}?gmail=error&message=${encodeURIComponent("Google OAuth is not configured on the server.")}`
    );
  }

  const redirectUri = `${effectiveAppUrl}/api/gmail/auth/callback`;

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
      const errBody = await tokenRes.text();
      console.error("Google token exchange failed:", tokenRes.status, errBody);

      let detail = "Unknown error";
      try {
        const parsed = JSON.parse(errBody);
        detail = parsed.error_description || parsed.error || errBody.slice(0, 200);
      } catch {
        detail = errBody.slice(0, 200);
      }

      return NextResponse.redirect(
        `${fallbackRedirect}?gmail=error&message=${encodeURIComponent(`Token exchange failed: ${detail}`)}`
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

  // Parse granted scopes from token response
  const grantedScopes = tokenData.scope
    ? tokenData.scope.split(" ")
    : [];

  // Store tokens: Google only returns refresh_token on first authorization.
  // On re-auth we must preserve the existing stored refresh_token.
  const expiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString();
  const now = new Date().toISOString();

  let insertError: { message: string } | null = null;

  if (tokenData.refresh_token) {
    // First auth or re-auth with refresh_token: full upsert
    const result = await adminSupabase
      .from("gmail_tokens")
      .upsert(
        {
          user_id: user.id,
          email: gmailEmail,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          is_active: true,
          scopes: grantedScopes,
          connected_at: now,
        },
        { onConflict: "user_id" }
      );
    insertError = result.error;
  } else {
    // Re-auth without refresh_token: update everything except refresh_token
    const result = await adminSupabase
      .from("gmail_tokens")
      .update({
        email: gmailEmail,
        access_token: tokenData.access_token,
        token_expires_at: expiresAt,
        is_active: true,
        scopes: grantedScopes,
        connected_at: now,
      })
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    // If no row existed to update, insert with empty refresh_token
    if (!result.error && !result.data) {
      const upsertResult = await adminSupabase
        .from("gmail_tokens")
        .upsert(
          {
            user_id: user.id,
            email: gmailEmail,
            access_token: tokenData.access_token,
            refresh_token: "",
            token_expires_at: expiresAt,
            is_active: true,
            scopes: grantedScopes,
            connected_at: now,
          },
          { onConflict: "user_id" }
        );
      insertError = upsertResult.error;
    } else {
      insertError = result.error;
    }
  }

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
