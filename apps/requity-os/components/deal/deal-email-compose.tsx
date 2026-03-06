"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Paperclip,
  X,
  File,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
} from "lucide-react";
import type { DealEmail } from "./deal-email-tab";

interface Attachment {
  file: File;
  id: string;
}

interface EmailTemplate {
  id: string;
  display_name: string;
  slug: string;
  subject_template: string;
  html_body_template: string;
  text_body_template: string | null;
}

interface DealEmailComposeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  currentUserId: string;
  currentUserName?: string;
  defaultToEmail?: string;
  defaultToName?: string;
  defaultContactId?: string;
  replyTo?: DealEmail | null;
  subjectSuggestion?: string;
}

export function DealEmailCompose({
  open,
  onOpenChange,
  loanId,
  currentUserId,
  currentUserName,
  defaultToEmail = "",
  defaultToName = "",
  defaultContactId,
  replyTo,
  subjectSuggestion,
}: DealEmailComposeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Form state
  const [form, setForm] = useState({
    to_email: replyTo?.from_email ?? defaultToEmail,
    to_name: replyTo?.from_name ?? defaultToName,
    cc: "",
    bcc: "",
    subject: replyTo
      ? `RE: ${replyTo.subject}`
      : subjectSuggestion
        ? subjectSuggestion
        : "",
    body: "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Check Gmail OAuth and load templates
  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Check Gmail connection
      const { data: gmailToken } = await supabase
        .from("gmail_tokens")
        .select("email")
        .eq("user_id", currentUserId)
        .eq("is_active", true)
        .maybeSingle();
      if (gmailToken?.email) setGmailEmail(gmailToken.email);

      // Load active email templates
      const { data: templateData } = await supabase
        .from("email_templates")
        .select("id, display_name, slug, subject_template, html_body_template, text_body_template")
        .eq("is_active", true)
        .order("display_name");
      if (templateData) setTemplates(templateData as EmailTemplate[]);
    }
    init();
  }, [currentUserId]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    // Apply template with basic merge field resolution
    let subject = template.subject_template;
    let body = template.text_body_template ?? "";

    // Simple merge field resolution
    const mergeData: Record<string, string> = {
      "{{borrower_name}}": form.to_name || defaultToName || "",
      "{{borrower_first_name}}": (form.to_name || defaultToName || "").split(" ")[0],
      "{{originator_name}}": currentUserName || "",
      "{{originator_email}}": gmailEmail || "info@requitylending.com",
    };

    for (const [field, value] of Object.entries(mergeData)) {
      subject = subject.replaceAll(field, value);
      body = body.replaceAll(field, value);
    }

    setForm((prev) => ({
      ...prev,
      subject,
      body,
    }));

    toast({
      title: "Template applied",
      description: `"${template.display_name}" template loaded.`,
    });
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function parseEmailList(raw: string): { email: string; name?: string }[] {
    return raw
      .split(/[,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)
      .map((email) => ({ email }));
  }

  async function handleSend(asDraft = false) {
    if (!form.to_email.trim() && !asDraft) {
      toast({
        title: "Recipient required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    if (!form.subject.trim() && !asDraft) {
      toast({
        title: "Subject required",
        description: "Please enter an email subject.",
        variant: "destructive",
      });
      return;
    }

    asDraft ? setSavingDraft(true) : setSending(true);

    try {
      const supabase = createClient();

      // Upload attachments to storage
      const attachmentMeta: {
        name: string;
        size: number;
        type: string;
        storage_path: string;
      }[] = [];
      for (const att of attachments) {
        const path = `emails/${loanId}/${crypto.randomUUID()}/${att.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("loan-documents")
          .upload(path, att.file);
        if (uploadError) throw uploadError;
        attachmentMeta.push({
          name: att.file.name,
          size: att.file.size,
          type: att.file.type,
          storage_path: path,
        });
      }

      const ccEmails = parseEmailList(form.cc);
      const bccEmails = parseEmailList(form.bcc);
      const fromEmail = gmailEmail ?? "info@requitylending.com";
      const bodyHtml = form.body
        ? `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(form.body)}</pre>`
        : "";

      const insertData = {
        loan_id: loanId,
        contact_id: defaultContactId ?? null,
        sent_by: currentUserId,
        from_email: fromEmail,
        from_name: currentUserName || "Requity Lending",
        to_emails: [
          {
            email: form.to_email.trim(),
            name: form.to_name.trim() || undefined,
          },
        ],
        cc_emails: ccEmails,
        bcc_emails: bccEmails,
        subject: form.subject.trim(),
        body_html: bodyHtml,
        body_text: form.body || null,
        thread_id: replyTo?.thread_id ?? undefined,
        in_reply_to: replyTo?.id ?? null,
        delivery_status: asDraft ? "draft" : "queued",
        attachments: attachmentMeta,
        direction: "outbound",
      };

      const { data: insertedEmail, error } = await (supabase as any)
        .from("deal_emails")
        .insert(insertData)
        .select("id")
        .single();
      if (error) throw error;

      // Create contact_email_links for recipients
      if (defaultContactId && insertedEmail?.id) {
        await (supabase as any).from("contact_email_links").insert({
          email_id: insertedEmail.id,
          contact_id: defaultContactId,
          role: "to",
        });
      }

      // Also create a crm_emails record for backward compatibility
      if (!asDraft) {
        await supabase.from("crm_emails").insert({
          to_email: form.to_email.trim(),
          to_name: form.to_name.trim() || null,
          subject: form.subject.trim(),
          body_text: form.body,
          body_html: bodyHtml || null,
          cc_emails: ccEmails.map((c) => c.email),
          bcc_emails: bccEmails.map((c) => c.email),
          sent_by: currentUserId,
          sent_by_name: currentUserName || null,
          linked_loan_id: loanId,
          linked_contact_id: defaultContactId || null,
          attachments: attachmentMeta,
          postmark_status: "queued",
          from_email: fromEmail,
        });
      }

      // Send via Gmail if connected
      if (!asDraft && gmailEmail && insertedEmail?.id) {
        try {
          const sendRes = await fetch("/api/gmail/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailId: insertedEmail.id }),
          });

          if (sendRes.ok) {
            // Update deal_emails delivery status
            await (supabase as any)
              .from("deal_emails")
              .update({ delivery_status: "sent" })
              .eq("id", insertedEmail.id);

            toast({
              title: "Email sent",
              description: "Your email has been sent via Gmail.",
            });
          } else {
            toast({
              title: "Email queued",
              description: "Email saved and queued for sending.",
            });
          }
        } catch {
          toast({
            title: "Email queued",
            description: "Email saved and queued for sending.",
          });
        }
      } else if (asDraft) {
        toast({
          title: "Draft saved",
          description: "Your draft has been saved.",
        });
      } else {
        toast({
          title: "Email queued",
          description: "Your email has been saved and queued for sending.",
        });
      }

      onOpenChange(false);
      setForm({
        to_email: defaultToEmail,
        to_name: defaultToName,
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });
      setAttachments([]);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: asDraft ? "Failed to save draft" : "Failed to send email",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setSavingDraft(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {replyTo ? "Reply to Email" : "Compose Deal Email"}
          </SheetTitle>
          <SheetDescription>
            Send from {gmailEmail ?? "info@requitylending.com"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 gap-4 mt-4 overflow-y-auto">
          {/* Template selector */}
          {templates.length > 0 && !replyTo && (
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {t.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* To */}
          <div className="space-y-1.5">
            <Label htmlFor="to_email">To</Label>
            <div className="flex gap-2">
              <Input
                id="to_email"
                type="email"
                placeholder="recipient@example.com"
                value={form.to_email}
                onChange={(e) => updateField("to_email", e.target.value)}
                className="flex-1"
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
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5 flex-1">
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
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach Files
            </Button>

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
          </div>

          {/* Reply context */}
          {replyTo && (
            <div className="rounded-md bg-muted p-3 text-xs border-l-2 border-muted-foreground/20">
              <p className="font-medium text-muted-foreground mb-1">
                Replying to: {replyTo.subject}
              </p>
              <p className="text-muted-foreground truncate">
                {replyTo.body_text?.slice(0, 200)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending || savingDraft}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={sending || savingDraft}
              className="gap-1.5"
              onClick={() => handleSend(true)}
            >
              <Save className="h-3.5 w-3.5" />
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              disabled={sending || savingDraft}
              className="gap-1.5"
              onClick={() => handleSend(false)}
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
