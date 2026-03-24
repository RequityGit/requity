import nodemailer from "nodemailer";
import { stripMentionMarkup } from "@/lib/comment-utils";
import { SUPABASE_STORAGE_URL } from "@/lib/supabase/constants";

/* ------------------------------------------------------------------ */
/*  Transporter (reusable)                                             */
/* ------------------------------------------------------------------ */

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error("[task-notifications] Missing SMTP env vars");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const LOGO_URL =
  `${SUPABASE_STORAGE_URL}/brand-assets/Requity%20Logo%20Color.svg`;

function emailShell(innerContent: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px">
    <div style="text-align:center;margin-bottom:32px">
      <img src="${LOGO_URL}" alt="Requity Group" style="height:36px" />
    </div>
    <div style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:32px">
      ${innerContent}
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TaskEmailParams {
  /** The notification row ID — used to update email_sent after sending */
  notificationId: string;
  /** Recipient email */
  recipientEmail: string;
  /** Recipient display name */
  recipientName: string;
  /** The task ID (used for reply-to threading) */
  taskId: string;
  /** The task title */
  taskTitle: string;
  /** The notification type slug */
  type: "task_comment" | "task_status_changed" | "task_assigned" | "task_due_soon" | "task_overdue";
  /** Who performed the action */
  actorName: string;
  /** Body content — comment text or change description */
  body: string;
}

/* ------------------------------------------------------------------ */
/*  Build email content by type                                        */
/* ------------------------------------------------------------------ */

function buildSubject(params: TaskEmailParams): string {
  switch (params.type) {
    case "task_comment":
      return `[Requity] ${params.actorName} commented on "${params.taskTitle}"`;
    case "task_status_changed":
      return `[Requity] Status changed on "${params.taskTitle}"`;
    case "task_assigned":
      return `[Requity] You were assigned: "${params.taskTitle}"`;
    case "task_due_soon":
      return `[Requity] "${params.taskTitle}" is due tomorrow`;
    case "task_overdue":
      return `[Requity] "${params.taskTitle}" is overdue`;
  }
}

function buildBody(params: TaskEmailParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.requitygroup.com";
  const taskUrl = `${baseUrl}/tasks?task=${params.taskId}`;

  const heading = (() => {
    switch (params.type) {
      case "task_comment":
        return `${params.actorName} commented on a task`;
      case "task_status_changed":
        return "Task status changed";
      case "task_assigned":
        return `${params.actorName} assigned you a task`;
      case "task_due_soon":
        return "Task due tomorrow";
      case "task_overdue":
        return "Task overdue";
    }
  })();

  return emailShell(`
    <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#0f172a">
      ${heading}
    </h2>
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#334155">
      ${escapeHtml(params.taskTitle)}
    </p>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;border-left:3px solid #cbd5e1">
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;white-space:pre-wrap">${formatBodyForEmail(params.body)}</p>
    </div>
    <div style="text-align:center;margin:24px 0 8px">
      <a href="${taskUrl}" style="display:inline-block;padding:12px 28px;background-color:#0f172a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
        View Task
      </a>
    </div>
  `);
}

/** Strip @[Name](uuid) markup and render @Name as bold in email HTML */
function formatBodyForEmail(body: string): string {
  // First strip mention markup to plain text, then escape HTML,
  // then bold the @mentions
  const stripped = stripMentionMarkup(body);
  const escaped = escapeHtml(stripped);
  return escaped.replace(/@(\w[\w\s]*?)(?=\s|$|,|\.)/g, '<strong>@$1</strong>');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/*  Generate a deterministic Message-ID for email threading            */
/* ------------------------------------------------------------------ */

function makeMessageId(taskId: string, notificationId: string): string {
  return `<task-${taskId}-${notificationId}@requitygroup.com>`;
}

function makeThreadId(taskId: string): string {
  return `<task-thread-${taskId}@requitygroup.com>`;
}

/** Build the Reply-To address that encodes the task ID for inbound parsing */
function makeReplyTo(taskId: string): string {
  const inboundDomain = process.env.INBOUND_EMAIL_DOMAIN || "inbound.requitygroup.com";
  return `task+${taskId}@${inboundDomain}`;
}

/* ------------------------------------------------------------------ */
/*  Send                                                               */
/* ------------------------------------------------------------------ */

export async function sendTaskNotificationEmail(
  params: TaskEmailParams
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured" };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "notifications@requitygroup.com";
  const messageId = makeMessageId(params.taskId, params.notificationId);
  const threadId = makeThreadId(params.taskId);
  const replyTo = makeReplyTo(params.taskId);

  try {
    await transporter.sendMail({
      from: `"Requity Group" <${fromAddress}>`,
      to: params.recipientEmail,
      replyTo,
      subject: buildSubject(params),
      html: buildBody(params),
      headers: {
        "Message-ID": messageId,
        "In-Reply-To": threadId,
        References: threadId,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("[task-notifications] Failed to send email:", err);
    return { success: false, error: (err as Error).message };
  }
}
