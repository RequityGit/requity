"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import {
  Mail,
  Send,
  CheckCircle2,
  Eye,
  AlertCircle,
  Clock,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Reply,
  Forward,
  FileEdit,
  Trash2,
} from "lucide-react";
import { DealEmailCompose } from "./deal-email-compose";

export interface DealEmail {
  id: string;
  loan_id: string;
  contact_id: string | null;
  company_id: string | null;
  sent_by: string;
  from_email: string;
  from_name: string;
  to_emails: { email: string; name?: string; contact_id?: string }[];
  cc_emails: { email: string; name?: string }[];
  bcc_emails: { email: string; name?: string }[];
  subject: string;
  body_html: string;
  body_text: string | null;
  thread_id: string | null;
  in_reply_to: string | null;
  delivery_status: string;
  delivered_at: string | null;
  opened_at: string | null;
  open_count: number;
  attachments: { name: string; size: number; type: string; storage_path: string }[];
  direction: string;
  created_at: string;
}

interface DealEmailTabProps {
  loanId: string;
  currentUserId: string;
  currentUserName?: string;
  /** Default recipient email (e.g. borrower) */
  defaultToEmail?: string;
  /** Default recipient name */
  defaultToName?: string;
  /** Default recipient contact ID */
  defaultContactId?: string;
  /** Property address for subject suggestion */
  propertyAddress?: string;
  /** Loan type for subject suggestion */
  loanType?: string;
}

const statusConfig: Record<
  string,
  { icon: React.ElementType; label: string; className: string }
> = {
  draft: {
    icon: FileEdit,
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  queued: {
    icon: Clock,
    label: "Queued",
    className: "bg-muted text-muted-foreground",
  },
  sent: {
    icon: Send,
    label: "Sent",
    className: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  delivered: {
    icon: CheckCircle2,
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  },
  bounced: {
    icon: AlertCircle,
    label: "Bounced",
    className: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
  failed: {
    icon: AlertCircle,
    label: "Failed",
    className: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
};

export function DealEmailTab({
  loanId,
  currentUserId,
  currentUserName,
  defaultToEmail,
  defaultToName,
  defaultContactId,
  propertyAddress,
  loanType,
}: DealEmailTabProps) {
  const router = useRouter();
  const [emails, setEmails] = useState<DealEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<DealEmail | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadEmails = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("deal_emails" as any)
      .select("*")
      .eq("loan_id", loanId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading deal emails:", error);
    } else {
      setEmails((data ?? []) as unknown as DealEmail[]);
    }
    setLoading(false);
  }, [loanId]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`deal-emails-${loanId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deal_emails",
          filter: `loan_id=eq.${loanId}`,
        },
        () => {
          loadEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loanId, loadEmails]);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleReply(email: DealEmail) {
    setReplyTo(email);
    setComposeOpen(true);
  }

  function handleCompose() {
    setReplyTo(null);
    setComposeOpen(true);
  }

  function handleComposeDone() {
    setComposeOpen(false);
    setReplyTo(null);
    loadEmails();
  }

  // Group emails by thread
  const threads = groupByThread(emails);
  const drafts = emails.filter((e) => e.delivery_status === "draft");
  const sentEmails = emails.filter((e) => e.delivery_status !== "draft");

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Deal Emails
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCompose}
          >
            <Send className="h-3.5 w-3.5" />
            Compose
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Loading emails...
            </div>
          ) : sentEmails.length === 0 && drafts.length === 0 ? (
            <div className="text-center py-10">
              <Mail className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No emails sent yet. Click Compose to send the first email from this deal.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Drafts section */}
              {drafts.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {drafts.length} Draft{drafts.length > 1 ? "s" : ""}
                  </p>
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="rounded-md border border-dashed p-3 flex items-center gap-3"
                    >
                      <FileEdit className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {draft.subject || "(No subject)"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Last edited {formatDate(draft.created_at)}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent emails grouped by thread */}
              {threads.map((thread) => (
                <EmailThread
                  key={thread[0].thread_id ?? thread[0].id}
                  emails={thread}
                  expandedId={expandedId}
                  onToggle={toggleExpanded}
                  onReply={handleReply}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {composeOpen && (
        <DealEmailCompose
          open={composeOpen}
          onOpenChange={(open) => {
            if (!open) handleComposeDone();
          }}
          loanId={loanId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          defaultToEmail={replyTo ? replyTo.to_emails[0]?.email : defaultToEmail}
          defaultToName={replyTo ? replyTo.to_emails[0]?.name : defaultToName}
          defaultContactId={defaultContactId}
          replyTo={replyTo}
          subjectSuggestion={
            propertyAddress
              ? `${propertyAddress} — ${loanType ?? "Loan"}`
              : undefined
          }
        />
      )}
    </>
  );
}

function EmailThread({
  emails,
  expandedId,
  onToggle,
  onReply,
}: {
  emails: DealEmail[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onReply: (email: DealEmail) => void;
}) {
  const latestEmail = emails[0];
  const hasThread = emails.length > 1;

  return (
    <div className="rounded-md border">
      {hasThread && (
        <div className="px-3 py-1.5 bg-muted/50 border-b">
          <span className="text-xs text-muted-foreground">
            Thread: {latestEmail.subject} ({emails.length} messages)
          </span>
        </div>
      )}
      {emails.map((email) => (
        <EmailRow
          key={email.id}
          email={email}
          isExpanded={expandedId === email.id}
          onToggle={onToggle}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

function EmailRow({
  email,
  isExpanded,
  onToggle,
  onReply,
}: {
  email: DealEmail;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onReply: (email: DealEmail) => void;
}) {
  const status =
    statusConfig[email.delivery_status] ?? statusConfig.queued;
  const StatusIcon = status.icon;
  const attachments = Array.isArray(email.attachments) ? email.attachments : [];
  const toNames = email.to_emails
    .map((r) => r.name || r.email)
    .join(", ");

  return (
    <div className="border-b last:border-b-0">
      {/* Header row */}
      <button
        type="button"
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => onToggle(email.id)}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${status.className}`}
        >
          <StatusIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium truncate">
              {email.subject}
            </span>
            {attachments.length > 0 && (
              <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">
              {email.direction === "inbound" ? "From" : "To"}: {toNames}
            </span>
            <span>&middot;</span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 border-transparent ${status.className}`}
            >
              {status.label}
            </Badge>
            {email.open_count > 0 && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {email.open_count}x
                </span>
              </>
            )}
            <span>&middot;</span>
            <span>{formatDate(email.created_at)}</span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t">
          <div className="space-y-2 pt-3">
            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">From: </span>
                <span>
                  {email.from_name} &lt;{email.from_email}&gt;
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">To: </span>
                <span>{toNames}</span>
              </div>
              {email.cc_emails && email.cc_emails.length > 0 && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">CC: </span>
                  <span>
                    {email.cc_emails
                      .map((c) => c.name || c.email)
                      .join(", ")}
                  </span>
                </div>
              )}
              {email.delivered_at && (
                <div>
                  <span className="text-muted-foreground">Delivered: </span>
                  <span>{formatDate(email.delivered_at)}</span>
                </div>
              )}
              {email.opened_at && (
                <div>
                  <span className="text-muted-foreground">
                    Opened: {email.open_count}x
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            {email.body_html ? (
              <div
                className="mt-2 p-3 rounded-md bg-muted text-sm max-h-60 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
              />
            ) : email.body_text ? (
              <div className="mt-2 p-3 rounded-md bg-muted text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {email.body_text}
              </div>
            ) : null}

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Attachments
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {attachments.map((att, i) => (
                    <Badge key={i} variant="outline" className="gap-1 text-xs">
                      <Paperclip className="h-3 w-3" />
                      {att.name}
                      <span className="text-muted-foreground">
                        ({Math.round(att.size / 1024)}KB)
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7"
                onClick={() => onReply(email)}
              >
                <Reply className="h-3 w-3" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs h-7"
              >
                <Forward className="h-3 w-3" />
                Forward
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Group emails by thread_id, ordered by most recent first */
function groupByThread(emails: DealEmail[]): DealEmail[][] {
  const threadMap = new Map<string, DealEmail[]>();

  for (const email of emails) {
    if (email.delivery_status === "draft") continue;
    const key = email.thread_id ?? email.id;
    if (!threadMap.has(key)) {
      threadMap.set(key, []);
    }
    threadMap.get(key)!.push(email);
  }

  // Sort threads by most recent message
  const threads = Array.from(threadMap.values());
  threads.sort((a, b) => {
    const aLatest = new Date(a[0].created_at).getTime();
    const bLatest = new Date(b[0].created_at).getTime();
    return bLatest - aLatest;
  });

  return threads;
}
