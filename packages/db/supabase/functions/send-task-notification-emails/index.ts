// Supabase Edge Function: send-task-notification-emails
//
// Runs every 3 minutes via pg_cron.
// Queries unsent task notifications, resolves recipients, sends emails
// via Postmark API, and marks them as sent. No SMTP, no roundtrip to the app.
//
// Required secrets (Edge Function Secrets in Supabase Dashboard):
//   SUPABASE_SERVICE_ROLE_KEY
//   POSTMARK_SERVER_TOKEN
//   APP_URL (defaults to https://app.requitygroup.com)
//   INBOUND_EMAIL_DOMAIN (defaults to inbound.requitygroup.com)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TASK_SLUGS = [
  "task_comment",
  "task_status_changed",
  "task_assigned",
  "task-assigned",
  "task_due_soon",
  "task_overdue",
];

const LOGO_URL =
  "https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Requity%20Logo%20Color.svg";

// ── Email builders ─────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSubject(type: string, actorName: string, taskTitle: string): string {
  switch (type) {
    case "task_comment":
      return `[Requity] ${actorName} commented on "${taskTitle}"`;
    case "task_status_changed":
      return `[Requity] Status changed on "${taskTitle}"`;
    case "task_assigned":
      return `[Requity] You were assigned: "${taskTitle}"`;
    case "task_due_soon":
      return `[Requity] "${taskTitle}" is due tomorrow`;
    case "task_overdue":
      return `[Requity] "${taskTitle}" is overdue`;
    default:
      return `[Requity] Update on "${taskTitle}"`;
  }
}

function buildHtmlBody(
  type: string,
  actorName: string,
  taskTitle: string,
  body: string,
  taskUrl: string
): string {
  const heading = (() => {
    switch (type) {
      case "task_comment":
        return `${escapeHtml(actorName)} commented on a task`;
      case "task_status_changed":
        return "Task status changed";
      case "task_assigned":
        return `${escapeHtml(actorName)} assigned you a task`;
      case "task_due_soon":
        return "Task due tomorrow";
      case "task_overdue":
        return "Task overdue";
      default:
        return "Task update";
    }
  })();

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <img src="${LOGO_URL}" alt="Requity Group" style="height:36px" />
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
        ${heading}
      </h2>
      <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#334155">
        ${escapeHtml(taskTitle)}
      </p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;border-left:3px solid #cbd5e1">
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;white-space:pre-wrap">${escapeHtml(body)}</p>
      </div>
      <div style="text-align:center;margin:24px 0 8px">
        <a href="${taskUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
          View Task
        </a>
      </div>
    </div>
    <div style="text-align:center;margin-top:24px">
      <p style="font-size:11px;color:#94a3b8;margin:0">
        Requity Group &middot; Reply to this email to add a comment to the task.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
  const appUrl = Deno.env.get("APP_URL") || "https://app.requitygroup.com";
  const inboundDomain =
    Deno.env.get("INBOUND_EMAIL_DOMAIN") || "inbound.requitygroup.com";

  if (!serviceRoleKey || !postmarkToken) {
    return new Response(
      JSON.stringify({
        error: "Missing SUPABASE_SERVICE_ROLE_KEY or POSTMARK_SERVER_TOKEN",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // 1. Fetch unsent task notifications (batch of 50)
    const { data: rows, error: fetchErr } = await supabase
      .from("notifications")
      .select(
        "id, user_id, notification_slug, title, body, entity_id, entity_label"
      )
      .eq("email_sent", false)
      .in("notification_slug", TASK_SLUGS)
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchErr) {
      console.error("[send-task-emails] Fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications = rows ?? [];
    if (notifications.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Batch-fetch recipient profiles (email + name)
    const userIds = Array.from(
      new Set(notifications.map((n: { user_id: string }) => n.user_id))
    );
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profiles = new Map<
      string,
      { full_name: string; email: string | null }
    >();
    for (const p of (profileRows ?? []) as {
      id: string;
      full_name: string;
      email: string | null;
    }[]) {
      profiles.set(p.id, p);
    }

    // Also try auth.users for emails
    const { data: authData } = await supabase.auth.admin.listUsers();
    const authEmailMap = new Map<string, string>();
    if (authData?.users) {
      for (const u of authData.users) {
        if (u.email) authEmailMap.set(u.id, u.email);
      }
    }

    // 3. Send each notification via Postmark
    let sent = 0;
    const failed: string[] = [];

    for (const notif of notifications as {
      id: string;
      user_id: string;
      notification_slug: string;
      title: string;
      body: string | null;
      entity_id: string | null;
      entity_label: string | null;
    }[]) {
      const profile = profiles.get(notif.user_id);
      const recipientEmail =
        profile?.email || authEmailMap.get(notif.user_id);

      if (!recipientEmail) {
        console.warn(
          `[send-task-emails] No email for user ${notif.user_id}, skipping`
        );
        // Mark as sent to avoid retrying
        await supabase
          .from("notifications")
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
          })
          .eq("id", notif.id);
        continue;
      }

      const slug =
        notif.notification_slug === "task-assigned"
          ? "task_assigned"
          : notif.notification_slug;
      const actorName = notif.title.split(" ")[0] || "Someone";
      const taskTitle = notif.entity_label || "Task";
      const taskId = notif.entity_id || "";
      const taskUrl = `${appUrl}/tasks?task=${taskId}`;
      const replyTo = `task+${taskId}@${inboundDomain}`;
      const messageId = `task-${taskId}-${notif.id}@requitygroup.com`;
      const threadId = `task-thread-${taskId}@requitygroup.com`;

      // Postmark Send API
      const postmarkPayload = {
        From: "Requity Group <notifications@requitygroup.com>",
        To: recipientEmail,
        ReplyTo: replyTo,
        Subject: buildSubject(slug, actorName, taskTitle),
        HtmlBody: buildHtmlBody(
          slug,
          actorName,
          taskTitle,
          notif.body || notif.title,
          taskUrl
        ),
        MessageStream: "outbound",
        Headers: [
          { Name: "Message-ID", Value: `<${messageId}>` },
          { Name: "In-Reply-To", Value: `<${threadId}>` },
          { Name: "References", Value: `<${threadId}>` },
        ],
      };

      try {
        const pmRes = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": postmarkToken,
          },
          body: JSON.stringify(postmarkPayload),
        });

        const pmResult = await pmRes.json();

        if (pmRes.ok && pmResult.ErrorCode === 0) {
          // Mark as sent
          await supabase
            .from("notifications")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_message_id: pmResult.MessageID || messageId,
            })
            .eq("id", notif.id);
          sent++;
        } else {
          console.error(
            `[send-task-emails] Postmark error for ${notif.id}:`,
            pmResult
          );
          failed.push(notif.id);
        }
      } catch (emailErr) {
        console.error(
          `[send-task-emails] Failed for ${notif.id}:`,
          emailErr
        );
        failed.push(notif.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed: failed.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[send-task-emails] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
