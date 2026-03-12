"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/constants";
import { useToast } from "@/components/ui/use-toast";
import { EmailComposerShell } from "@/components/email/email-composer-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, X, File, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";
import { TemplatePicker } from "@/components/email/TemplatePicker";
import { TemplateAppliedBanner } from "@/components/email/TemplateAppliedBanner";
import type { UserEmailTemplate } from "@/lib/types/user-email-templates";
import { ContactEmailCombobox } from "@/components/crm/contact-email-combobox";

interface Attachment {
  file: File;
  id: string;
}

interface EmailComposeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled recipient email */
  toEmail?: string;
  /** Pre-filled recipient name */
  toName?: string;
  /** Link email to a CRM contact */
  linkedContactId?: string;
  /** Link email to a loan */
  linkedLoanId?: string;
  /** Link email to a borrower */
  linkedBorrowerId?: string;
  /** Link email to an investor */
  linkedInvestorId?: string;
  /** Current user ID */
  currentUserId: string;
  /** Current user display name */
  currentUserName?: string;
  /** Pre-filled subject line (e.g. from document send flow) */
  initialSubject?: string;
  /** Pre-filled body HTML (e.g. from document send flow) */
  initialBody?: string;
  /** Pre-loaded file attachments (e.g. PDF from document export) */
  initialAttachments?: File[];
  /** Called after a successful email send with the crm_emails record ID */
  onSendSuccess?: (emailId: string) => void;
}

export function EmailComposeSheet({
  open,
  onOpenChange,
  toEmail = "",
  toName = "",
  linkedContactId,
  linkedLoanId,
  linkedBorrowerId,
  linkedInvestorId,
  currentUserId,
  currentUserName,
  initialSubject,
  initialBody,
  initialAttachments,
  onSendSuccess,
}: EmailComposeSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sending, setSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<{
    id: string;
    name: string;
    version: number;
    slug: string;
    mergeData: Record<string, string> | null;
  } | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [internalLinkedContactId, setInternalLinkedContactId] = useState<string | null>(
    linkedContactId ?? null
  );

  // Check if the current user has an active Gmail OAuth connection
  useEffect(() => {
    async function checkGmail() {
      const supabase = createClient();
      const { data } = await supabase
        .from("gmail_tokens")
        .select("email")
        .eq("user_id", currentUserId)
        .eq("is_active", true)
        .maybeSingle();
      if (data?.email) setGmailEmail(data.email);
    }
    checkGmail();
  }, [currentUserId]);
  const [form, setForm] = useState({
    to_email: toEmail,
    to_name: toName,
    cc: "",
    bcc: "",
    subject: initialSubject ?? "",
    body: initialBody ?? "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>(
    () => (initialAttachments ?? []).map((f) => ({ file: f, id: crypto.randomUUID() }))
  );

  const isDirty =
    form.subject.trim() !== "" ||
    form.body.trim() !== "" ||
    attachments.length > 0;

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit`,
          variant: "destructive",
        });
        continue;
      }
      newAttachments.push({ file, id: crypto.randomUUID() });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleTemplateSelect(template: UserEmailTemplate) {
    setTemplateLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/resolve-user-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            template_slug: template.slug,
            loan_id: linkedLoanId || undefined,
            contact_id: linkedContactId || undefined,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        updateField("subject", data.subject);
        updateField("body", data.body_html);
        setAppliedTemplate({
          id: template.id,
          name: template.name,
          version: template.version,
          slug: template.slug,
          mergeData: data.merge_data,
        });
      } else {
        // Fall back to client-side preview with sample data
        const sampleData: Record<string, string> = {};
        for (const v of template.available_variables) {
          sampleData[v.key] = v.sample;
        }
        const resolvedSubject = template.subject_template.replace(
          /\{\{(\w+)\}\}/g,
          (_, key: string) => sampleData[key] ?? ""
        );
        const resolvedBody = template.body_template.replace(
          /\{\{(\w+)\}\}/g,
          (_, key: string) => sampleData[key] ?? ""
        );
        updateField("subject", resolvedSubject);
        updateField("body", resolvedBody);
        setAppliedTemplate({
          id: template.id,
          name: template.name,
          version: template.version,
          slug: template.slug,
          mergeData: sampleData,
        });
        toast({
          title: "Template applied with sample data",
          description:
            "Could not resolve merge fields from the server. Using sample values.",
        });
      }
    } catch {
      toast({
        title: "Failed to apply template",
        variant: "destructive",
      });
    } finally {
      setTemplateLoading(false);
    }
  }

  function clearTemplate() {
    setAppliedTemplate(null);
    setForm((prev) => ({ ...prev, subject: "", body: "" }));
  }

  function parseEmailList(raw: string): string[] {
    return raw
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  }

  function handleDiscard() {
    setForm({
      to_email: toEmail,
      to_name: toName,
      cc: "",
      bcc: "",
      subject: "",
      body: "",
    });
    setAttachments([]);
    setAppliedTemplate(null);
    setInternalLinkedContactId(linkedContactId ?? null);
    onOpenChange(false);
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!form.to_email.trim()) {
      toast({
        title: "Recipient required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    if (!form.subject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter an email subject.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const supabase = createClient();

      // Upload attachments to storage
      const attachmentMeta: { name: string; path: string; size: number; type: string }[] = [];
      for (const att of attachments) {
        const path = `${crypto.randomUUID()}/${att.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("crm-attachments")
          .upload(path, att.file);
        if (uploadError) throw uploadError;

        attachmentMeta.push({
          name: att.file.name,
          path,
          size: att.file.size,
          type: att.file.type,
        });
      }

      const ccEmails = parseEmailList(form.cc);
      const bccEmails = parseEmailList(form.bcc);

      // Use autocomplete-selected contact, falling back to prop
      const resolvedContactId = internalLinkedContactId ?? linkedContactId ?? null;

      const insertData: Database["public"]["Tables"]["crm_emails"]["Insert"] = {
        to_email: form.to_email.trim(),
        to_name: form.to_name.trim() || null,
        subject: form.subject.trim(),
        body_text: form.body,
        body_html: appliedTemplate
          ? form.body
          : form.body ? `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(form.body)}</pre>` : null,
        cc_emails: ccEmails.length > 0 ? ccEmails : null,
        bcc_emails: bccEmails.length > 0 ? bccEmails : null,
        sent_by: currentUserId,
        sent_by_name: currentUserName || null,
        linked_contact_id: resolvedContactId,
        linked_loan_id: linkedLoanId || null,
        linked_borrower_id: linkedBorrowerId || null,
        linked_investor_id: linkedInvestorId || null,
        attachments: attachmentMeta.length > 0 ? attachmentMeta : null,
        postmark_status: "queued",
        // Use Gmail address when OAuth is connected, otherwise omit to use DB default
        ...(gmailEmail ? { from_email: gmailEmail } : {}),
      };

      const { data: insertedEmail, error } = await supabase
        .from("crm_emails")
        .insert(insertData)
        .select("id")
        .single();
      if (error) throw error;

      // Log template usage if a template was applied
      if (appliedTemplate && insertedEmail?.id) {
        await supabase
          .from("user_email_sends" as never)
          .insert({
            template_id: appliedTemplate.id,
            sent_by: currentUserId,
            crm_email_id: insertedEmail.id,
            linked_loan_id: linkedLoanId || null,
            linked_contact_id: resolvedContactId,
            merge_data_snapshot: appliedTemplate.mergeData,
            template_version: appliedTemplate.version,
          } as never);
      }

      // Also log as CRM activity if linked to a contact
      if (resolvedContactId) {
        await supabase.from("crm_activities").insert({
          contact_id: resolvedContactId,
          activity_type: "email",
          subject: form.subject.trim(),
          description: form.body.slice(0, 500) || null,
          performed_by: currentUserId,
        });

        await supabase
          .from("crm_contacts")
          .update({ last_contacted_at: new Date().toISOString() })
          .eq("id", resolvedContactId);
      }

      // Send the email via Gmail API if the user has an active Gmail connection
      if (gmailEmail && insertedEmail?.id) {
        try {
          const sendRes = await fetch("/api/gmail/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailId: insertedEmail.id }),
          });
          const sendData = await sendRes.json();

          if (sendRes.ok) {
            toast({ title: "Email sent", description: "Your email has been sent via Gmail." });
          } else {
            toast({
              title: "Email saved",
              description: sendData?.error || "Email was saved but could not be sent immediately. It will be retried.",
              variant: "destructive",
            });
          }
        } catch {
          toast({
            title: "Email saved",
            description: "Email was saved but could not be sent immediately. It will be retried.",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "Email queued", description: "Your email has been saved and queued for sending." });
      }
      // Notify caller of successful send (e.g. for document tracking)
      if (insertedEmail?.id && onSendSuccess) {
        onSendSuccess(insertedEmail.id);
      }

      onOpenChange(false);

      // Reset form
      setForm({
        to_email: toEmail,
        to_name: toName,
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });
      setAttachments([]);
      setAppliedTemplate(null);
      setInternalLinkedContactId(linkedContactId ?? null);

      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Failed to send email",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  const senderEmail = gmailEmail ?? "info@requitylending.com";

  return (
    <EmailComposerShell
      open={open}
      onClose={() => onOpenChange(false)}
      title="New Email"
      subtitle={`from ${senderEmail}`}
      isDirty={isDirty}
      footer={
        <>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach
            </Button>
            <TemplatePicker
              context={linkedLoanId ? "deal" : linkedContactId ? "contact" : "any"}
              onSelect={handleTemplateSelect}
            />
            {templateLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDiscard}
              disabled={sending}
            >
              Discard
            </Button>
            <Button
              size="sm"
              disabled={sending}
              className="gap-1.5"
              onClick={() => handleSend()}
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </>
      }
    >
      {/* Template banner */}
      {appliedTemplate && (
        <TemplateAppliedBanner
          templateName={appliedTemplate.name}
          templateVersion={appliedTemplate.version}
          onClear={clearTemplate}
        />
      )}

      {/* To */}
      <div className="space-y-1.5">
        <Label htmlFor="to_email">To</Label>
        <div className="flex gap-2">
          <ContactEmailCombobox
            id="to_email"
            value={form.to_email}
            onChange={(email) => {
              updateField("to_email", email);
              // Clear linked contact when user manually edits
              setInternalLinkedContactId(null);
            }}
            onContactSelect={(contact) => {
              updateField("to_email", contact.email);
              updateField("to_name", contact.name);
              setInternalLinkedContactId(contact.id);
            }}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs shrink-0"
            onClick={() => setShowCcBcc(!showCcBcc)}
          >
            CC/BCC
            {showCcBcc ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* CC / BCC */}
      {showCcBcc && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="cc">CC</Label>
            <Input
              id="cc"
              type="text"
              placeholder="cc1@example.com, cc2@example.com"
              value={form.cc}
              onChange={(e) => updateField("cc", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bcc">BCC</Label>
            <Input
              id="bcc"
              type="text"
              placeholder="bcc@example.com"
              value={form.bcc}
              onChange={(e) => updateField("bcc", e.target.value)}
            />
          </div>
        </>
      )}

      {/* Subject */}
      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="Email subject"
          value={form.subject}
          onChange={(e) => updateField("subject", e.target.value)}
          required
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          placeholder="Write your message..."
          value={form.body}
          onChange={(e) => updateField("body", e.target.value)}
          className="min-h-[200px] resize-none"
        />
      </div>

      {/* Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm bg-muted"
            >
              <File className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="truncate flex-1">{att.file.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {(att.file.size / 1024).toFixed(0)} KB
              </Badge>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </EmailComposerShell>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
