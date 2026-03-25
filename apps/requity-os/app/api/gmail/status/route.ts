import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getValidGmailToken, GmailTokenRevokedError } from "@/lib/gmail";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/status
 * Checks the health of the current user's Gmail connection by attempting a
 * token refresh. Returns { connected, healthy, email, error? }.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email } = await getValidGmailToken(user.id);
    return NextResponse.json({ connected: true, healthy: true, email });
  } catch (err) {
    if (err instanceof GmailTokenRevokedError) {
      return NextResponse.json({
        connected: false,
        healthy: false,
        error: "expired",
        message:
          "Your Gmail connection has expired. Please re-authorize to continue sending and syncing emails.",
      });
    }

    const message =
      err instanceof Error ? err.message : "Unknown error";

    // "No active Gmail connection found" means not connected at all
    if (message.includes("No active Gmail connection")) {
      return NextResponse.json({ connected: false, healthy: false });
    }

    return NextResponse.json({
      connected: true,
      healthy: false,
      error: "refresh_failed",
      message: "Could not verify Gmail connection. Please try again later.",
    });
  }
}
