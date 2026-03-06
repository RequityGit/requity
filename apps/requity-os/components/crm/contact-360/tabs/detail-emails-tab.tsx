"use client";

import { Send, Mail, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { relTime } from "../contact-detail-shared";
import type { EmailData } from "../types";

interface DetailEmailsTabProps {
  emails: EmailData[];
}

export function DetailEmailsTab({ emails }: DetailEmailsTabProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
          <Mail className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          No emails
        </h3>
        <p className="text-sm text-muted-foreground">
          No email history for this contact.
        </p>
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
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 px-1.5 py-0 h-5"
                    style={{
                      color: e.delivered_at ? "#22A861" : "#E5930E",
                      borderColor: e.delivered_at
                        ? "#22A86130"
                        : "#E5930E30",
                      backgroundColor: e.delivered_at
                        ? "#22A86108"
                        : "#E5930E08",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: e.delivered_at
                          ? "#22A861"
                          : "#E5930E",
                      }}
                    />
                    {e.delivered_at ? "Delivered" : "Pending"}
                  </Badge>
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
