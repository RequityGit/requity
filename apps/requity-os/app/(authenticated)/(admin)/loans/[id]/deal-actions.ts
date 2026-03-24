"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-admin";

/**
 * Send a deal email — creates a deal_emails record and optionally sends via Gmail/Postmark
 */
export async function sendDealEmail(data: {
  loanId: string;
  contactId?: string;
  companyId?: string;
  toEmails: { email: string; name?: string; contact_id?: string }[];
  ccEmails?: { email: string; name?: string }[];
  bccEmails?: { email: string; name?: string }[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  threadId?: string;
  inReplyTo?: string;
  templateId?: string;
  attachments?: { name: string; size: number; type: string; storage_path: string }[];
  asDraft?: boolean;
}) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return { error: auth.error };

    const admin = createAdminClient();
    const supabase = await createClient();

    // Get user profile for from_name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", auth.user.id)
      .single();

    // Check for Gmail connection
    const { data: gmailToken } = await supabase
      .from("gmail_tokens")
      .select("email")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .maybeSingle();

    const fromEmail = gmailToken?.email ?? "info@requitylending.com";
    const fromName = profile?.full_name ?? "Requity Lending";

    const { data: email, error } = await (admin as any)
      .from("deal_emails")
      .insert({
        loan_id: data.loanId,
        contact_id: data.contactId ?? null,
        company_id: data.companyId ?? null,
        sent_by: auth.user.id,
        from_email: fromEmail,
        from_name: fromName,
        to_emails: data.toEmails,
        cc_emails: data.ccEmails ?? [],
        bcc_emails: data.bccEmails ?? [],
        subject: data.subject,
        body_html: data.bodyHtml,
        body_text: data.bodyText ?? null,
        thread_id: data.threadId ?? undefined,
        in_reply_to: data.inReplyTo ?? null,
        template_id: data.templateId ?? null,
        attachments: data.attachments ?? [],
        delivery_status: data.asDraft ? "draft" : "queued",
        direction: "outbound",
      })
      .select("id")
      .single();

    if (error) {
      console.error("sendDealEmail error:", error);
      return { error: error.message };
    }

    // Create contact_email_links for each recipient
    if (email?.id) {
      const links = [];
      for (const to of data.toEmails) {
        if (to.contact_id) {
          links.push({
            email_id: email.id,
            contact_id: to.contact_id,
            role: "to",
          });
        }
      }
      if (data.contactId) {
        links.push({
          email_id: email.id,
          contact_id: data.contactId,
          role: "to",
        });
      }

      if (links.length > 0) {
        await (admin as any)
          .from("contact_email_links")
          .insert(links)
          .select();
      }
    }

    return { success: true, emailId: email?.id };
  } catch (err: unknown) {
    console.error("sendDealEmail exception:", err);
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

