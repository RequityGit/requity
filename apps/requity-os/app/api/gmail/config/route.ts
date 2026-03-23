import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/gmail/config
 * Returns whether Gmail OAuth is configured on the server.
 * No auth required — this only checks if env vars are set, no user data exposed.
 */
export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  return NextResponse.json({
    configured: Boolean(clientId && clientSecret),
  });
}
