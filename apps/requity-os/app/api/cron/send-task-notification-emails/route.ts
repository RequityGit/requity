import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendTaskNotificationEmail,
  type TaskEmailParams,
} from "@/lib/emails/task-notifications";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TASK_SLUGS = [
  "task_comment",
  "task_status_changed",
  "task_assigned",
  "task-assigned",
  "task_due_soon",
  "task_overdue",
];

/**
 * POST /api/cron/send-task-notification-emails
 *
 * Picks up task-related notifications where email_sent = false,
 * resolves recipient email, sends the email, and marks email_sent = true.
 *
 * Designed to run every 2-5 minutes via cron.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch unsent task notifications (limit batch to 50)
    const { data: rows, error: fetchErr } = await supabase
      .from("notifications" as never)
      .select("id, user_id, notification_slug, title, body, entity_id, entity_label" as never)
      .eq("email_sent" as never, false as never)
      .in("notification_slug" as never, TASK_SLUGS as never)
      .order("created_at" as never, { ascending: true } as never)
      .limit(50);

    if (fetchErr) {
      console.error("[send-task-emails] Fetch error:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const notifications = (rows as unknown as {
      id: string;
      user_id: string;
      notification_slug: string;
      title: string;
      body: string | null;
      entity_id: string | null;
      entity_label: string | null;
    }[]) ?? [];

    if (notifications.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    // Batch-fetch recipient profiles
    const userIds = Array.from(new Set(notifications.map((n) => n.user_id)));
    const { data: profileRows } = await supabase
      .from("profiles" as never)
      .select("id, full_name, email" as never)
      .in("id" as never, userIds as never);

    const profiles = new Map<string, { full_name: string; email: string }>();
    ((profileRows ?? []) as unknown as { id: string; full_name: string; email: string }[]).forEach((p) => {
      profiles.set(p.id, p);
    });

    // Also fetch auth.users emails for any profiles missing email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authEmailMap = new Map<string, string>();
    if (authUsers?.users) {
      authUsers.users.forEach((u) => {
        if (u.email) authEmailMap.set(u.id, u.email);
      });
    }

    let sent = 0;
    const failed: string[] = [];

    for (const notif of notifications) {
      const profile = profiles.get(notif.user_id);
      const recipientEmail = profile?.email || authEmailMap.get(notif.user_id);
      if (!recipientEmail) {
        console.warn(`[send-task-emails] No email for user ${notif.user_id}, skipping`);
        // Mark as sent to avoid retrying forever
        await supabase
          .from("notifications" as never)
          .update({ email_sent: true, email_sent_at: new Date().toISOString() } as never)
          .eq("id" as never, notif.id as never);
        continue;
      }

      // Normalize slug
      const normalizedSlug = notif.notification_slug === "task-assigned"
        ? "task_assigned"
        : notif.notification_slug;

      // Extract actor name from title (format: "ActorName did something on ...")
      const actorName = notif.title.split(" ")[0] || "Someone";

      const params: TaskEmailParams = {
        notificationId: notif.id,
        recipientEmail,
        recipientName: profile?.full_name || "Team Member",
        taskId: notif.entity_id || "",
        taskTitle: notif.entity_label || "Task",
        type: normalizedSlug as TaskEmailParams["type"],
        actorName,
        body: notif.body || notif.title,
      };

      const result = await sendTaskNotificationEmail(params);

      if (result.success) {
        // Update notification row
        await supabase
          .from("notifications" as never)
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_message_id: `task-${notif.entity_id}-${notif.id}@requitygroup.com`,
          } as never)
          .eq("id" as never, notif.id as never);
        sent++;
      } else {
        console.error(`[send-task-emails] Failed for ${notif.id}:`, result.error);
        failed.push(notif.id);
      }
    }

    return NextResponse.json({ success: true, sent, failed: failed.length });
  } catch (err) {
    console.error("[send-task-emails] Unexpected error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
