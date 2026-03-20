import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getValidGmailToken,
  buildMimeMessage,
  sendViaGmailApi,
  type MimeAttachment,
} from "@/lib/gmail";

export async function POST(request: NextRequest) {
  // Authenticate the user
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let emailId: string;
  try {
    const body = await request.json();
    emailId = body.emailId;
    if (!emailId) throw new Error("Missing emailId");
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Provide { emailId: string }." },
      { status: 400 }
    );
  }

  // Fetch the email record (including attachments metadata)
  const admin = createAdminClient();
  const { data: email, error: fetchError } = await admin
    .from("crm_emails")
    .select(
      "id, to_email, to_name, subject, body_text, body_html, cc_emails, bcc_emails, from_email, sent_by, postmark_status, attachments"
    )
    .eq("id", emailId)
    .single();

  if (fetchError || !email) {
    return NextResponse.json(
      { error: "Email record not found." },
      { status: 404 }
    );
  }

  // Verify the requesting user is the sender
  if (email.sent_by !== user.id) {
    return NextResponse.json(
      { error: "You can only send your own emails." },
      { status: 403 }
    );
  }

  // Don't re-send emails that are already sent or delivered
  if (
    email.postmark_status === "sent" ||
    email.postmark_status === "delivered"
  ) {
    return NextResponse.json(
      { error: "This email has already been sent." },
      { status: 409 }
    );
  }

  // Validate required fields
  if (!email.to_email || !email.subject) {
    return NextResponse.json(
      { error: "Recipient email address is missing." },
      { status: 400 }
    );
  }

  try {
    // Get a valid Gmail access token (refreshes if needed)
    const { accessToken, email: gmailEmail } = await getValidGmailToken(
      user.id
    );

    // Download attachments from storage if present
    const mimeAttachments: MimeAttachment[] = [];
    const attachmentsMeta = email.attachments as Array<{
      name: string;
      path: string;
      size: number;
      type: string;
    }> | null;

    if (attachmentsMeta && attachmentsMeta.length > 0) {
      for (const att of attachmentsMeta) {
        const { data: fileData, error: dlError } = await admin.storage
          .from("crm-attachments")
          .download(att.path);

        if (dlError || !fileData) {
          console.error(`Failed to download attachment ${att.name}:`, dlError);
          continue;
        }

        const arrayBuffer = await fileData.arrayBuffer();
        mimeAttachments.push({
          filename: att.name,
          mimeType: att.type || "application/octet-stream",
          content: Buffer.from(arrayBuffer),
        });
      }
    }

    // Build the MIME message (with attachments if any)
    const rawMessage = buildMimeMessage({
      from: gmailEmail,
      to: email.to_email,
      subject: email.subject,
      bodyText: email.body_text,
      bodyHtml: email.body_html,
      cc: email.cc_emails,
      bcc: email.bcc_emails,
      attachments: mimeAttachments.length > 0 ? mimeAttachments : undefined,
    });

    // Send via Gmail API
    const gmailMessageId = await sendViaGmailApi(accessToken, rawMessage);

    // Update the email record to reflect successful send
    await admin
      .from("crm_emails")
      .update({
        postmark_status: "sent",
        postmark_message_id: gmailMessageId,
        delivered_at: new Date().toISOString(),
        from_email: gmailEmail,
      })
      .eq("id", emailId);

    return NextResponse.json({ success: true, messageId: gmailMessageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Gmail send error:", err);

    // Update the email record to reflect failure
    await admin
      .from("crm_emails")
      .update({
        postmark_status: "failed",
        postmark_error: message,
      })
      .eq("id", emailId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
