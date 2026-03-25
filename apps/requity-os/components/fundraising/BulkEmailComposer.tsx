"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { showSuccess, showError, showWarning } from "@/lib/toast";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { EmailComposerShell } from "@/components/email/email-composer-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Paperclip,
  X,
  File,
  Loader2,
  Eye,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Braces,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { SoftCommitment } from "@/lib/fundraising/types";
import type { Database } from "@/lib/supabase/types";

// ─── Merge Token Definitions ───

const MERGE_TOKENS = [
  { token: "{{investor_name}}", label: "Full Name", example: "John Smith" },
  { token: "{{first_name}}", label: "First Name", example: "John" },
  { token: "{{investor_email}}", label: "Email", example: "john@example.com" },
  { token: "{{commitment_amount}}", label: "Amount", example: "$100,000" },
  { token: "{{deal_name}}", label: "Deal Name", example: "Acme Fund I" },
] as const;

function resolveTokens(
  template: string,
  recipient: SoftCommitment
): string {
  return template
    .replace(/\{\{investor_name\}\}/g, recipient.name)
    .replace(/\{\{first_name\}\}/g, recipient.name.split(" ")[0])
    .replace(/\{\{investor_email\}\}/g, recipient.email)
    .replace(
      /\{\{commitment_amount\}\}/g,
      formatCurrency(recipient.commitment_amount)
    )
    .replace(/\{\{deal_name\}\}/g, recipient.deal?.name ?? "");
}

// ─── Component ───

interface Attachment {
  file: File;
  id: string;
}

interface BulkEmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: SoftCommitment[];
  currentUserId: string;
  currentUserName: string;
  onSendComplete: () => void;
}

export function BulkEmailComposer({
  open,
  onOpenChange,
  recipients,
  currentUserId,
  currentUserName,
  onSendComplete,
}: BulkEmailComposerProps) {
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Preview state
  const [mode, setMode] = useState<"compose" | "preview">("compose");
  const [previewIndex, setPreviewIndex] = useState(0);

  // Check Gmail connection
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

  // Reset form when opening
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (justOpened) {
      setSubject("");
      setBody("");
      setAttachments([]);
      setMode("compose");
      setPreviewIndex(0);
      setSendProgress(null);
    }
  }, [open]);

  const isDirty = subject.trim() !== "" || body.trim() !== "";

  // Insert merge token at cursor position
  const insertToken = useCallback(
    (token: string, target: "subject" | "body") => {
      const ref = target === "subject" ? subjectRef.current : bodyRef.current;
      if (!ref) return;

      const start = ref.selectionStart ?? ref.value.length;
      const end = ref.selectionEnd ?? ref.value.length;
      const currentValue = target === "subject" ? subject : body;
      const newValue =
        currentValue.slice(0, start) + token + currentValue.slice(end);

      if (target === "subject") {
        setSubject(newValue);
      } else {
        setBody(newValue);
      }

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        ref.focus();
        const newPos = start + token.length;
        ref.setSelectionRange(newPos, newPos);
      });
    },
    [subject, body]
  );

  // Preview data
  const previewRecipient = recipients[previewIndex] ?? recipients[0];
  const resolvedSubject = previewRecipient
    ? resolveTokens(subject, previewRecipient)
    : subject;
  const resolvedBody = previewRecipient
    ? resolveTokens(body, previewRecipient)
    : body;

  // File handling
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        showError("File too large", `${file.name} exceeds the 10MB limit`);
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

  // Discard
  function handleDiscard() {
    setSubject("");
    setBody("");
    setAttachments([]);
    setMode("compose");
    onOpenChange(false);
  }

  // ─── Send Flow ───

  async function handleSend() {
    if (!subject.trim()) {
      showWarning("Subject is required");
      return;
    }
    if (!body.trim()) {
      showWarning("Message is required");
      return;
    }
    if (recipients.length === 0) {
      showWarning("No recipients selected");
      return;
    }

    const ok = await confirm({
      title: `Send ${recipients.length} individual email${recipients.length > 1 ? "s" : ""}?`,
      description: `Each investor will receive a personalized email. This cannot be undone.`,
      confirmLabel: `Send ${recipients.length} email${recipients.length > 1 ? "s" : ""}`,
    });
    if (!ok) return;

    setSending(true);
    setSendProgress({ current: 0, total: recipients.length });

    try {
      const supabase = createClient();

      // Upload attachments once (shared across all emails)
      const attachmentMeta: {
        name: string;
        path: string;
        size: number;
        type: string;
      }[] = [];
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

      // Create individual crm_emails records for each recipient
      const emailIds: string[] = [];
      for (const recipient of recipients) {
        const resolvedSub = resolveTokens(subject, recipient);
        const resolvedBod = resolveTokens(body, recipient);
        const bodyHtml = `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(resolvedBod)}</pre>`;

        const insertData: Database["public"]["Tables"]["crm_emails"]["Insert"] =
          {
            to_email: recipient.email,
            to_name: recipient.name,
            subject: resolvedSub,
            body_text: resolvedBod,
            body_html: bodyHtml,
            sent_by: currentUserId,
            sent_by_name: currentUserName,
            linked_contact_id: recipient.contact_id ?? null,
            attachments:
              attachmentMeta.length > 0 ? attachmentMeta : null,
            postmark_status: "queued",
            ...(gmailEmail ? { from_email: gmailEmail } : {}),
          };

        const { data: inserted, error } = await supabase
          .from("crm_emails")
          .insert(insertData)
          .select("id")
          .single();

        if (error) {
          console.error(`Failed to create email for ${recipient.email}:`, error);
          continue;
        }

        if (inserted?.id) {
          emailIds.push(inserted.id);

          // Log CRM activity if contact is linked
          if (recipient.contact_id) {
            await supabase.from("crm_activities").insert({
              contact_id: recipient.contact_id,
              activity_type: "email",
              subject: resolvedSub,
              description: resolvedBod.slice(0, 500) || null,
              performed_by: currentUserId,
            });
            await supabase
              .from("crm_contacts")
              .update({ last_contacted_at: new Date().toISOString() })
              .eq("id", recipient.contact_id);
          }
        }
      }

      // Send all emails via the bulk send endpoint
      if (gmailEmail && emailIds.length > 0) {
        try {
          const res = await fetch("/api/gmail/send-bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailIds }),
          });
          const data = await res.json();

          if (res.ok) {
            const sent = data.sent?.length ?? 0;
            const failed = data.failed?.length ?? 0;
            if (failed > 0) {
              showWarning(`${sent} sent, ${failed} failed`);
            } else {
              showSuccess(`${sent} email${sent > 1 ? "s" : ""} sent`);
            }
          } else {
            showError(
              "Emails queued but some could not be sent",
              data?.error || "They will be retried."
            );
          }
        } catch {
          showError(
            "Emails queued but could not be sent",
            "They will be retried."
          );
        }
      } else {
        showSuccess(
          `${emailIds.length} email${emailIds.length > 1 ? "s" : ""} queued`
        );
      }

      onSendComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      showError("Could not send emails", message);
    } finally {
      setSending(false);
      setSendProgress(null);
    }
  }

  const senderEmail = gmailEmail ?? "info@requitylending.com";

  // ─── Token Insert Buttons (shared between subject and body) ───

  const lastFocusedField = useRef<"subject" | "body">("body");

  const TokenBar = useMemo(
    () => (
      <div className="flex items-center gap-1 flex-wrap">
        <Braces className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-0.5" />
        {MERGE_TOKENS.map((t) => (
          <Tooltip key={t.token}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-[11px] px-1.5 py-0.5 rounded border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted rq-transition whitespace-nowrap"
                onClick={() =>
                  insertToken(t.token, lastFocusedField.current)
                }
              >
                {t.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {t.token} (e.g. {t.example})
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    ),
    [insertToken]
  );

  return (
    <EmailComposerShell
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Email ${recipients.length} investor${recipients.length !== 1 ? "s" : ""}`}
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
              disabled={sending}
            >
              <Paperclip className="h-3.5 w-3.5" />
              Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setMode(mode === "compose" ? "preview" : "compose")
              }
              disabled={sending}
            >
              {mode === "compose" ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </>
              )}
            </Button>
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
              disabled={sending || recipients.length === 0}
              className="gap-1.5"
              onClick={handleSend}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {sending && sendProgress
                ? `Sending...`
                : `Send to ${recipients.length}`}
            </Button>
          </div>
        </>
      }
    >
      {/* Recipients bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground shrink-0">To:</span>
        {recipients.slice(0, 8).map((r) => (
          <Badge
            key={r.id}
            variant="secondary"
            className="text-xs font-normal"
          >
            {r.name}
          </Badge>
        ))}
        {recipients.length > 8 && (
          <Badge variant="outline" className="text-xs font-normal">
            +{recipients.length - 8} more
          </Badge>
        )}
      </div>

      {mode === "compose" ? (
        <>
          {/* Merge token bar */}
          {TokenBar}

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              ref={subjectRef}
              id="bulk-subject"
              placeholder="Email subject (use merge tokens for personalization)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onFocus={() => (lastFocusedField.current = "subject")}
              disabled={sending}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-body">Message</Label>
            <Textarea
              ref={bodyRef}
              id="bulk-body"
              placeholder="Hi {{first_name}},&#10;&#10;Write your personalized message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => (lastFocusedField.current = "body")}
              className="min-h-[200px] resize-none"
              disabled={sending}
            />
          </div>
        </>
      ) : (
        <>
          {/* Preview mode */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Preview for{" "}
              <span className="font-medium text-foreground">
                {previewRecipient?.name}
              </span>{" "}
              ({previewRecipient?.email})
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  setPreviewIndex(
                    (i) => (i - 1 + recipients.length) % recipients.length
                  )
                }
                disabled={recipients.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {previewIndex + 1} / {recipients.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  setPreviewIndex((i) => (i + 1) % recipients.length)
                }
                disabled={recipients.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Subject</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {resolvedSubject || (
                <span className="text-muted-foreground">No subject</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Message</Label>
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap min-h-[200px]">
              {resolvedBody || (
                <span className="text-muted-foreground">No message</span>
              )}
            </div>
          </div>
        </>
      )}

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
              <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
