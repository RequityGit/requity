"use client";

import { useState } from "react";
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
} from "lucide-react";
import { EmailComposeSheet } from "./email-compose-sheet";

export interface EmailRecord {
  id: string;
  created_at: string;
  from_email: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  sent_by_name: string | null;
  postmark_status: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  attachments: unknown;
}

interface EmailActivityFeedProps {
  emails: EmailRecord[];
  /** Pre-fill the compose recipient */
  defaultToEmail?: string;
  defaultToName?: string;
  /** Link context for new emails */
  linkedContactId?: string;
  linkedLoanId?: string;
  linkedBorrowerId?: string;
  linkedInvestorId?: string;
  currentUserId: string;
  currentUserName?: string;
}

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  queued: { icon: Clock, label: "Queued", className: "bg-slate-100 text-slate-600" },
  sent: { icon: Send, label: "Sent", className: "bg-blue-100 text-blue-600" },
  delivered: { icon: CheckCircle2, label: "Delivered", className: "bg-green-100 text-green-600" },
  opened: { icon: Eye, label: "Opened", className: "bg-purple-100 text-purple-600" },
  failed: { icon: AlertCircle, label: "Failed", className: "bg-red-100 text-red-600" },
  bounced: { icon: AlertCircle, label: "Bounced", className: "bg-red-100 text-red-600" },
};

export function EmailActivityFeed({
  emails,
  defaultToEmail,
  defaultToName,
  linkedContactId,
  linkedLoanId,
  linkedBorrowerId,
  linkedInvestorId,
  currentUserId,
  currentUserName,
}: EmailActivityFeedProps) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setComposeOpen(true)}
          >
            <Send className="h-3.5 w-3.5" />
            Compose
          </Button>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No emails sent yet.
            </p>
          ) : (
            <div className="space-y-3">
              {emails.map((email) => {
                const status = statusConfig[email.postmark_status ?? "queued"] ?? statusConfig.queued;
                const StatusIcon = status.icon;
                const isExpanded = expandedId === email.id;
                const attachmentList = parseAttachments(email.attachments);

                return (
                  <div
                    key={email.id}
                    className="rounded-md border"
                  >
                    {/* Header row */}
                    <button
                      type="button"
                      className="w-full flex items-start gap-3 p-3 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => toggleExpanded(email.id)}
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
                          {attachmentList.length > 0 && (
                            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>To: {email.to_name || email.to_email}</span>
                          <span>&middot;</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${status.className} border-transparent`}
                          >
                            {status.label}
                          </Badge>
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
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">From: </span>
                              <span>{email.from_email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">To: </span>
                              <span>{email.to_email}</span>
                            </div>
                            {email.cc_emails && email.cc_emails.length > 0 && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">CC: </span>
                                <span>{email.cc_emails.join(", ")}</span>
                              </div>
                            )}
                            {email.sent_by_name && (
                              <div>
                                <span className="text-muted-foreground">Sent by: </span>
                                <span>{email.sent_by_name}</span>
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
                                <span className="text-muted-foreground">Opened: </span>
                                <span>{formatDate(email.opened_at)}</span>
                              </div>
                            )}
                          </div>

                          {/* Body */}
                          {email.body_text && (
                            <div className="mt-2 p-3 rounded-md bg-slate-50 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {email.body_text}
                            </div>
                          )}

                          {/* Attachments */}
                          {attachmentList.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Attachments</p>
                              <div className="flex flex-wrap gap-1.5">
                                {attachmentList.map((att, i) => (
                                  <Badge key={i} variant="outline" className="gap-1 text-xs">
                                    <Paperclip className="h-3 w-3" />
                                    {att.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EmailComposeSheet
        open={composeOpen}
        onOpenChange={setComposeOpen}
        toEmail={defaultToEmail}
        toName={defaultToName}
        linkedContactId={linkedContactId}
        linkedLoanId={linkedLoanId}
        linkedBorrowerId={linkedBorrowerId}
        linkedInvestorId={linkedInvestorId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </>
  );
}

function parseAttachments(raw: unknown): { name: string; path: string; size: number; type: string }[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw as { name: string; path: string; size: number; type: string }[];
}
