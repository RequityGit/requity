"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Send,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/format";
import type { EmailData } from "../types";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";

interface RecentEmailsSidebarProps {
  emails: EmailData[];
  contactEmail: string | null;
  contactName: string;
  contactId: string;
  currentUserId: string;
  currentUserName: string;
}

export function RecentEmailsSidebar({
  emails,
  contactEmail,
  contactName,
  contactId,
  currentUserId,
  currentUserName,
}: RecentEmailsSidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Mail className="h-4 w-4" strokeWidth={1.5} />
            Recent Emails
          </CardTitle>
          {contactEmail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs h-7 rounded-lg border-border"
              onClick={() => setComposeOpen(true)}
            >
              <Send className="h-3 w-3" strokeWidth={1.5} />
              Compose
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No emails yet"
            action={contactEmail ? { label: "Send First Email", onClick: () => setComposeOpen(true), icon: Send } : undefined}
            compact
          />
        ) : (
          <div className="space-y-2">
            {emails.map((email) => {
              const isExpanded = expandedId === email.id;
              return (
                <button
                  key={email.id}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : email.id)
                  }
                  className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-medium text-foreground truncate flex-1">
                      {email.subject}
                    </p>
                    {isExpanded ? (
                      <ChevronUp
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <ChevronDown
                        className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="font-mono num">
                      {formatDate(email.created_at)}
                    </span>
                    {email.delivered_at && (
                      <CheckCircle2
                        className="h-3 w-3 text-[#22A861]"
                        strokeWidth={1.5}
                      />
                    )}
                    {email.opened_at && (
                      <Eye
                        className="h-3 w-3 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                  {isExpanded && email.body_text && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-4 whitespace-pre-wrap">
                      {email.body_text}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Compose Sheet */}
      {contactEmail && (
        <EmailComposeSheet
          open={composeOpen}
          onOpenChange={setComposeOpen}
          toEmail={contactEmail}
          toName={contactName}
          linkedContactId={contactId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      )}
    </Card>
  );
}
