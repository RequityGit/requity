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
import { Send, Paperclip, X, File, ChevronDown, ChevronUp } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

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
}: EmailComposeSheetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sending, setSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

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
    subject: "",
    body: "",
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

  function parseEmailList(raw: string): string[] {
    return raw
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

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

      const insertData: Database["public"]["Tables"]["crm_emails"]["Insert"] = {
        to_email: form.to_email.trim(),
        to_name: form.to_name.trim() || null,
        subject: form.subject.trim(),
        body_text: form.body,
        body_html: form.body ? `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(form.body)}</pre>` : null,
        cc_emails: ccEmails.length > 0 ? ccEmails : null,
        bcc_emails: bccEmails.length > 0 ? bccEmails : null,
        sent_by: currentUserId,
        sent_by_name: currentUserName || null,
        linked_contact_id: linkedContactId || null,
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

      // Also log as CRM activity if linked to a contact
      if (linkedContactId) {
        await supabase.from("crm_activities").insert({
          contact_id: linkedContactId,
          activity_type: "email",
          subject: form.subject.trim(),
          description: form.body.slice(0, 500) || null,
          performed_by: currentUserId,
        });

        await supabase
          .from("crm_contacts")
          .update({ last_contacted_at: new Date().toISOString() })
          .eq("id", linkedContactId);
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>Compose Email</SheetTitle>
          <SheetDescription>
            Send an email from {gmailEmail ?? "info@requitylending.com"}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSend}
          className="flex flex-col flex-1 gap-4 mt-4 overflow-y-auto"
        >
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
                required
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
              required
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {sending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
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
