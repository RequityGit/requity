import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/webhooks/inbound-email
 *
 * Receives inbound emails (Postmark, SendGrid, or generic SMTP webhook format).
 * Parses the task ID from the To/Reply-To address pattern: task+{taskId}@inbound.requitygroup.com
 * Identifies the sender by matching From email to a user profile.
 * Creates a note (comment) on the task.
 *
 * Postmark Inbound webhook format:
 * - FromFull.Email: sender email
 * - StrippedTextReply: cleaned reply text (no quoted content)
 * - TextBody: full text body (fallback)
 * - To: array of { Email, Name }
 * - OriginalRecipient: the full To address
 *
 * Auth: Webhook secret in query param or Authorization header.
 */
export async function POST(req: NextRequest) {
  // Auth: accept either Bearer token or query param
  const secret = process.env.INBOUND_WEBHOOK_SECRET || process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const querySecret = req.nextUrl.searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && querySecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();

    // Extract task ID from the recipient address
    // Pattern: task+{uuid}@inbound.requitygroup.com
    const taskId = extractTaskId(body);
    if (!taskId) {
      console.warn("[inbound-email] Could not extract task ID from recipient");
      return NextResponse.json({ error: "No task ID found in recipient address" }, { status: 400 });
    }

    // Validate task exists
    const { data: task, error: taskErr } = await supabase
      .from("ops_tasks" as never)
      .select("id, title" as never)
      .eq("id" as never, taskId as never)
      .single();

    if (taskErr || !task) {
      console.warn("[inbound-email] Task not found:", taskId);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Identify sender by email
    const senderEmail = extractSenderEmail(body);
    if (!senderEmail) {
      console.warn("[inbound-email] No sender email found");
      return NextResponse.json({ error: "No sender email" }, { status: 400 });
    }

    // Look up user by email in auth.users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const matchedUser = authData?.users?.find(
      (u) => u.email?.toLowerCase() === senderEmail.toLowerCase()
    );

    if (!matchedUser) {
      console.warn("[inbound-email] Unknown sender:", senderEmail);
      // Silently ignore replies from unknown senders
      return NextResponse.json({ success: true, ignored: true, reason: "unknown_sender" });
    }

    // Extract reply text
    const replyText = extractReplyText(body);
    if (!replyText || replyText.trim().length === 0) {
      console.warn("[inbound-email] Empty reply body");
      return NextResponse.json({ success: true, ignored: true, reason: "empty_body" });
    }

    // Get sender's display name
    const { data: profile } = await supabase
      .from("profiles" as never)
      .select("full_name" as never)
      .eq("id" as never, matchedUser.id as never)
      .single();

    const authorName = (profile as { full_name: string } | null)?.full_name || senderEmail;

    // Insert note (comment) on the task
    const { error: noteErr } = await supabase
      .from("notes" as never)
      .insert({
        task_id: taskId,
        author_id: matchedUser.id,
        author_name: authorName,
        body: replyText.trim(),
        is_internal: true,
        mentions: [],
      } as never);

    if (noteErr) {
      console.error("[inbound-email] Failed to insert note:", noteErr);
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taskId,
      authorId: matchedUser.id,
    });
  } catch (err) {
    console.error("[inbound-email] Unexpected error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  Parsing helpers                                                    */
/* ------------------------------------------------------------------ */

const TASK_PATTERN = /task\+([0-9a-f-]{36})@/i;

function extractTaskId(body: Record<string, unknown>): string | null {
  // Try OriginalRecipient (Postmark)
  if (typeof body.OriginalRecipient === "string") {
    const m = body.OriginalRecipient.match(TASK_PATTERN);
    if (m) return m[1];
  }

  // Try To array (Postmark)
  if (Array.isArray(body.To)) {
    for (const to of body.To as { Email?: string }[]) {
      if (to.Email) {
        const m = to.Email.match(TASK_PATTERN);
        if (m) return m[1];
      }
    }
  }

  // Try ToFull array (Postmark)
  if (Array.isArray(body.ToFull)) {
    for (const to of body.ToFull as { Email?: string }[]) {
      if (to.Email) {
        const m = to.Email.match(TASK_PATTERN);
        if (m) return m[1];
      }
    }
  }

  // Try generic "to" string
  if (typeof body.to === "string") {
    const m = body.to.match(TASK_PATTERN);
    if (m) return m[1];
  }

  // Try envelope/recipient fields (SendGrid, generic)
  for (const key of ["envelope", "recipient", "recipients"]) {
    const val = body[key];
    if (typeof val === "string") {
      const m = val.match(TASK_PATTERN);
      if (m) return m[1];
    }
  }

  return null;
}

function extractSenderEmail(body: Record<string, unknown>): string | null {
  // Postmark: FromFull.Email
  if (body.FromFull && typeof (body.FromFull as Record<string, unknown>).Email === "string") {
    return (body.FromFull as Record<string, unknown>).Email as string;
  }
  // Postmark: From
  if (typeof body.From === "string") {
    // Could be "Name <email>" or just "email"
    const match = (body.From as string).match(/<([^>]+)>/) || [(body.From as string), body.From as string];
    return match[1] || null;
  }
  // Generic: from
  if (typeof body.from === "string") {
    const match = (body.from as string).match(/<([^>]+)>/) || [(body.from as string), body.from as string];
    return match[1] || null;
  }
  return null;
}

function extractReplyText(body: Record<string, unknown>): string | null {
  // Postmark: StrippedTextReply (best — removes quoted content)
  if (typeof body.StrippedTextReply === "string" && body.StrippedTextReply.trim()) {
    return body.StrippedTextReply as string;
  }
  // Postmark: TextBody (full text, may include quoted content)
  if (typeof body.TextBody === "string" && body.TextBody.trim()) {
    return stripQuotedContent(body.TextBody as string);
  }
  // Generic: text
  if (typeof body.text === "string" && body.text.trim()) {
    return stripQuotedContent(body.text as string);
  }
  return null;
}

/**
 * Basic quoted content stripping — removes lines starting with > and
 * everything after common reply separators.
 */
function stripQuotedContent(text: string): string {
  const separators = [
    /^-{2,}\s*Original Message/im,
    /^On .+ wrote:$/im,
    /^From:/im,
    /^>{2,}/m,
  ];

  let result = text;
  for (const sep of separators) {
    const idx = result.search(sep);
    if (idx > 0) {
      result = result.slice(0, idx);
    }
  }

  // Remove individual quoted lines
  result = result
    .split("\n")
    .filter((line) => !line.startsWith(">"))
    .join("\n")
    .trim();

  return result;
}
