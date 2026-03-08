"use client";

import { Send, Mail, Eye, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { relTime } from "../contact-detail-shared";
import type { EmailData } from "../types";

function resolveEmailStatus(e: EmailData): { label: string; color: string } {
  if (e.opened_at) return { label: "Opened", color: "#3B82F6" };
  if (e.delivered_at) return { label: "Delivered", color: "#22A861" };

  const status = e.postmark_status?.toLowerCase();
  if (status === "sent") return { label: "Sent", color: "#22A861" };
  if (status === "bounced" || status === "bounce")
    return { label: "Bounced", color: "#E5453D" };
  if (status === "failed" || status === "error")
    return { label: "Failed", color: "#E5453D" };
  if (status === "spam" || status === "spamcomplaint")
    return { label: "Spam", color: "#E5453D" };
  if (status === "queued") return { label: "Queued", color: "#E5930E" };

  return { label: "Pending", color: "#E5930E" };
}

function EmailStatusBadge({ email }: { email: EmailData }) {
  const { label, color } = resolveEmailStatus(email);
  return (
    <Badge
      variant="outline"
      className="text-[10px] gap-1 px-1.5 py-0 h-5"
      style={{
        color,
        borderColor: `${color}30`,
        backgroundColor: `${color}08`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </Badge>
  );
}

interface DetailEmailsTabProps {
  emails: EmailData[];
  onCompose?: () => void;
}

export function DetailEmailsTab({ emails, onCompose }: DetailEmailsTabProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
          <Mail className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          No emails
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          No email history for this contact.
        </p>
        {onCompose && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-border text-xs"
            onClick={onCompose}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Compose Email
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {emails.map((e) => {
        const isOutbound = e.from_email !== e.to_email && e.sent_by_name;
        return (
          <Card
            key={e.id}
            className="rounded-xl border-border cursor-pointer transition-all duration-150 hover:border-border"
          >
            <CardContent className="p-[18px]">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-2">
                  {isOutbound ? (
                    <Send
                      size={13}
                      className="text-[#3B82F6]"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <Mail
                      size={13}
                      className="text-[#22A861]"
                      strokeWidth={1.5}
                    />
                  )}
                  <span className="text-sm font-semibold text-foreground">
                    {e.subject}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {e.opened_at && (
                    <Eye
                      size={12}
                      className="text-[#22A861]"
                      strokeWidth={1.5}
                    />
                  )}
                  <EmailStatusBadge email={e} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {isOutbound
                    ? `From: ${e.sent_by_name || e.from_email}`
                    : `From: ${e.from_email}`}
                </span>
                <span className="text-muted-foreground/50">&rarr;</span>
                <span>{e.to_email}</span>
                <span className="text-muted-foreground/50">&middot;</span>
                <span>{relTime(e.created_at)}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
