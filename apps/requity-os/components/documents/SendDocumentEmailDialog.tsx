"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { generatePdfBlob } from "@/lib/export-pdf";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { resolveRecipientForRecord, fetchLinkedEmailTemplateId } from "./actions";
import type { RecipientInfo } from "./actions";
import type { UserEmailTemplate } from "@/lib/types/user-email-templates";

interface SendDocumentEmailDialogProps {
  /** The generated document's ID */
  documentId: string;
  /** The document template ID (to look up linked email template) */
  templateId: string;
  /** Current document HTML content from the editor */
  getHtmlContent: () => string;
  /** File name for the PDF attachment */
  fileName: string;
  /** Record type the document was generated for */
  recordType: string;
  /** Record ID the document was generated for */
  recordId: string;
  /** Current authenticated user ID */
  currentUserId: string;
  /** Current user display name */
  currentUserName?: string;
  /** Linked loan ID (if record is a loan or deal with a loan) */
  linkedLoanId?: string;
}

export function SendDocumentEmailDialog({
  documentId,
  templateId,
  getHtmlContent,
  fileName,
  recordType,
  recordId,
  currentUserId,
  currentUserName,
  linkedLoanId,
}: SendDocumentEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);

  // Pre-resolved data for the email composer
  const [composerReady, setComposerReady] = useState(false);
  const [recipient, setRecipient] = useState<RecipientInfo>({ email: null, name: null, contactId: null });
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setComposerReady(false);
      setPdfFile(null);
      setEmailSubject("");
      setEmailBody("");
    }
  }, [open]);

  const handleSendViaEmail = useCallback(async () => {
    setPreparing(true);
    const toastId = toast.loading("Preparing email...");

    try {
      // 1. Resolve recipient from the record
      const recipientInfo = await resolveRecipientForRecord(recordType, recordId);
      setRecipient(recipientInfo);

      // 2. Try to load & resolve the linked email template
      const linkedTemplateId = await fetchLinkedEmailTemplateId(templateId);

      if (linkedTemplateId) {
        // Fetch the email template and resolve it via the edge function
        const supabase = createClient();
        const { data: emailTemplate } = await supabase
          .from("user_email_templates" as never)
          .select("*" as never)
          .eq("id" as never, linkedTemplateId as never)
          .single();

        if (emailTemplate) {
          const tmpl = emailTemplate as unknown as UserEmailTemplate;

          // Resolve merge fields via the edge function
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const response = await fetch(
              `${supabaseUrl}/functions/v1/resolve-user-template`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  template_slug: tmpl.slug,
                  loan_id: linkedLoanId || (recordType === "loan" ? recordId : undefined),
                  contact_id: recipientInfo.contactId || (recordType === "contact" ? recordId : undefined),
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              setEmailSubject(data.subject);
              setEmailBody(data.body_html);
            } else {
              // Fallback: use raw template without merge resolution
              setEmailSubject(tmpl.subject_template);
              setEmailBody(tmpl.body_template);
            }
          }
        }
      }
      // If no linked template, subject/body stay empty and user can pick via TemplatePicker in the composer

      // 3. Generate PDF blob from current document content
      const html = getHtmlContent();
      const blob = await generatePdfBlob(html);
      const safeName = fileName.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9_\- ]/g, "_");
      const file = new File([blob], `${safeName}.pdf`, { type: "application/pdf" });
      setPdfFile(file);

      // 4. Open the email composer
      setComposerReady(true);
      toast.success("Email ready to send", { id: toastId });
    } catch (err) {
      console.error("Failed to prepare email:", err);
      toast.error("Failed to prepare email", { id: toastId });
    } finally {
      setPreparing(false);
    }
  }, [templateId, getHtmlContent, fileName, recordType, recordId, linkedLoanId]);

  // Track when the email is successfully sent
  const handleSendSuccess = useCallback(async (emailId: string) => {
    try {
      const supabase = createClient();
      await supabase
        .from("generated_documents")
        .update({
          sent_via_email_id: emailId,
          sent_at: new Date().toISOString(),
          status: "sent",
        } as never)
        .eq("id", documentId);
    } catch (err) {
      console.error("Failed to update document send status:", err);
    }
    setOpen(false);
  }, [documentId]);

  return {
    /** Whether the email is being prepared (loading state for the button) */
    preparing,
    /** Trigger the send via email flow */
    trigger: () => {
      setOpen(true);
      handleSendViaEmail();
    },
    /** The email composer element to render */
    composer: composerReady ? (
      <EmailComposeSheet
        open={composerReady}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setComposerReady(false);
            setOpen(false);
          }
        }}
        toEmail={recipient.email ?? ""}
        toName={recipient.name ?? ""}
        linkedContactId={recipient.contactId ?? undefined}
        linkedLoanId={linkedLoanId || (recordType === "loan" ? recordId : undefined)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        initialSubject={emailSubject}
        initialBody={emailBody}
        initialAttachments={pdfFile ? [pdfFile] : undefined}
        onSendSuccess={handleSendSuccess}
      />
    ) : null,
  };
}
