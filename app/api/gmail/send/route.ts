import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getValidGmailToken,
  buildMimeMessage,
  sendViaGmailApi,
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

  // Fetch the email record
  const admin = createAdminClient();
  const { data: email, error: fetchError } = await admin
    .from("crm_emails")
    .select(
      "id, to_email, to_name, subject, body_text, body_html, cc_emails, bcc_emails, from_email, sent_by, postmark_status"
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

  try {
    // Get a valid Gmail access token (refreshes if needed)
    const { accessToken, email: gmailEmail } = await getValidGmailToken(
      user.id
    );

    // Build the MIME message
    const rawMessage = buildMimeMessage({
      from: gmailEmail,
      to: email.to_email,
      subject: email.subject,
      bodyText: email.body_text,
      bodyHtml: email.body_html,
      cc: email.cc_emails,
      bcc: email.bcc_emails,
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
