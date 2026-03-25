import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getValidGmailToken,
  buildMimeMessage,
  sendViaGmailApi,
  type MimeAttachment,
} from "@/lib/gmail";

const DELAY_BETWEEN_SENDS_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let emailIds: string[];
  try {
    const body = await request.json();
    emailIds = body.emailIds;
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      throw new Error("Missing emailIds");
    }
    if (emailIds.length > 100) {
      return NextResponse.json(
        { error: "Maximum 100 emails per batch." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Provide { emailIds: string[] }." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Fetch all email records
  const { data: emails, error: fetchError } = await admin
    .from("crm_emails")
    .select(
      "id, to_email, to_name, subject, body_text, body_html, cc_emails, bcc_emails, from_email, sent_by, postmark_status, attachments"
    )
    .in("id", emailIds);

  if (fetchError || !emails) {
    return NextResponse.json(
      { error: "Could not fetch email records." },
      { status: 500 }
    );
  }

  // Verify all emails belong to the requesting user
  const unauthorized = emails.find((e) => e.sent_by !== user.id);
  if (unauthorized) {
    return NextResponse.json(
      { error: "You can only send your own emails." },
      { status: 403 }
    );
  }

  // Filter to only queued emails
  const toSend = emails.filter(
    (e) =>
      e.postmark_status !== "sent" &&
      e.postmark_status !== "delivered" &&
      e.to_email &&
      e.subject
  );

  if (toSend.length === 0) {
    return NextResponse.json({
      sent: [],
      failed: [],
      message: "No emails to send.",
    });
  }

  // Get a valid Gmail token once for all sends
  let accessToken: string;
  let gmailEmail: string;
  try {
    const tokenResult = await getValidGmailToken(user.id);
    accessToken = tokenResult.accessToken;
    gmailEmail = tokenResult.email;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gmail not connected";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Pre-download attachments from first email (all emails share the same attachments in bulk sends)
  const sharedAttachments: MimeAttachment[] = [];
  const firstWithAttachments = toSend.find((e) => e.attachments);
  if (firstWithAttachments?.attachments) {
    const attachmentsMeta = firstWithAttachments.attachments as Array<{
      name: string;
      path: string;
      size: number;
      type: string;
    }>;
    for (const att of attachmentsMeta) {
      const { data: fileData, error: dlError } = await admin.storage
        .from("crm-attachments")
        .download(att.path);
      if (dlError || !fileData) {
        console.error(`Failed to download attachment ${att.name}:`, dlError);
        continue;
      }
      const arrayBuffer = await fileData.arrayBuffer();
      sharedAttachments.push({
        filename: att.name,
        mimeType: att.type || "application/octet-stream",
        content: Buffer.from(arrayBuffer),
      });
    }
  }

  // Send each email sequentially with a small delay
  const sent: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (let i = 0; i < toSend.length; i++) {
    const email = toSend[i];

    try {
      const rawMessage = buildMimeMessage({
        from: gmailEmail,
        to: email.to_email!,
        subject: email.subject!,
        bodyText: email.body_text,
        bodyHtml: email.body_html,
        cc: email.cc_emails,
        bcc: email.bcc_emails,
        attachments:
          sharedAttachments.length > 0 ? sharedAttachments : undefined,
      });

      const gmailMessageId = await sendViaGmailApi(accessToken, rawMessage);

      await admin
        .from("crm_emails")
        .update({
          postmark_status: "sent",
          postmark_message_id: gmailMessageId,
          delivered_at: new Date().toISOString(),
          from_email: gmailEmail,
        })
        .eq("id", email.id);

      sent.push(email.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to send email ${email.id}:`, err);

      await admin
        .from("crm_emails")
        .update({
          postmark_status: "failed",
          postmark_error: message,
        })
        .eq("id", email.id);

      failed.push({ id: email.id, error: message });
    }

    // Rate limit delay between sends (skip after last)
    if (i < toSend.length - 1) {
      await sleep(DELAY_BETWEEN_SENDS_MS);
    }
  }

  return NextResponse.json({ sent, failed });
}
