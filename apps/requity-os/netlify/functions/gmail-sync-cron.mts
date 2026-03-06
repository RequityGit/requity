import type { Config } from "@netlify/functions";

/**
 * Netlify Scheduled Function: Gmail Sync Cron
 *
 * Runs every 5 minutes to trigger inbound email sync for all connected
 * team members' Gmail inboxes.
 *
 * Calls the /api/gmail/sync endpoint with CRON_SECRET for authentication.
 */
export default async function handler() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!appUrl) {
    console.error("[Gmail Sync Cron] NEXT_PUBLIC_APP_URL or URL not configured");
    return new Response("Missing app URL", { status: 500 });
  }

  if (!cronSecret) {
    console.error("[Gmail Sync Cron] CRON_SECRET not configured");
    return new Response("Missing CRON_SECRET", { status: 500 });
  }

  try {
    console.log("[Gmail Sync Cron] Triggering sync...");

    const res = await fetch(`${appUrl}/api/gmail/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ all: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Gmail Sync Cron] Sync failed:", data);
      return new Response(JSON.stringify(data), { status: res.status });
    }

    console.log(
      `[Gmail Sync Cron] Sync complete: ${data.usersProcessed} users, ${data.totalMessagesProcessed} messages`
    );

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("[Gmail Sync Cron] Error:", err);
    return new Response(`Cron error: ${err}`, { status: 500 });
  }
}

export const config: Config = {
  schedule: "*/5 * * * *",
};
