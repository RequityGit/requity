import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAllConnectedUsers, syncUserGmail } from "@/lib/gmail-sync";

/**
 * POST /api/gmail/sync
 *
 * Triggers Gmail inbound email sync. Two modes:
 *
 * 1. Cron/scheduled: No body or { all: true } — syncs all connected users.
 *    Protected by CRON_SECRET header for automated calls.
 *
 * 2. Manual: { userId: "..." } — syncs a specific user's mailbox.
 *    Requires the requesting user to be an admin or the user themselves.
 */
export async function POST(request: NextRequest) {
  // Check for cron secret (for scheduled/automated calls)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCronCall =
    cronSecret && authHeader === `Bearer ${cronSecret}`;

  let body: { all?: boolean; userId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — defaults to sync all
  }

  // Cron call: sync all users
  if (isCronCall) {
    console.log("[Gmail Sync] Cron-triggered sync for all connected users");
    const results = await syncAllConnectedUsers();
    const totalProcessed = results.reduce((sum, r) => sum + r.messagesProcessed, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return NextResponse.json({
      success: true,
      usersProcessed: results.length,
      totalMessagesProcessed: totalProcessed,
      totalErrors,
      results: results.map((r) => ({
        email: r.email,
        messagesProcessed: r.messagesProcessed,
        messagesSkipped: r.messagesSkipped,
        errors: r.errors,
      })),
    });
  }

  // Manual call: verify authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If syncing all, require admin role
  if (body.all || !body.userId) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(
      (r) => r.role === "admin" || r.role === "super_admin"
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required to sync all users" },
        { status: 403 }
      );
    }

    console.log("[Gmail Sync] Admin-triggered sync for all connected users");
    const results = await syncAllConnectedUsers();
    return NextResponse.json({
      success: true,
      usersProcessed: results.length,
      results: results.map((r) => ({
        email: r.email,
        messagesProcessed: r.messagesProcessed,
        messagesSkipped: r.messagesSkipped,
        errors: r.errors,
      })),
    });
  }

  // Syncing a specific user — must be the user themselves or an admin
  if (body.userId !== user.id) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(
      (r) => r.role === "admin" || r.role === "super_admin"
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "You can only sync your own mailbox" },
        { status: 403 }
      );
    }
  }

  console.log(`[Gmail Sync] Manual sync for user ${body.userId}`);
  const result = await syncUserGmail(body.userId);

  return NextResponse.json({
    success: true,
    email: result.email,
    messagesProcessed: result.messagesProcessed,
    messagesSkipped: result.messagesSkipped,
    errors: result.errors,
  });
}
