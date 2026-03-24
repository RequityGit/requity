"use client";

import { ExternalLink, UserCheck } from "lucide-react";
import type { Notification } from "@/lib/notifications";
import { stripMentionMarkup } from "@/lib/comment-utils";

interface ApprovalPreviewCardProps {
  notification: Notification;
  onNavigate: () => void;
}

export function ApprovalPreviewCard({
  notification,
  onNavigate,
}: ApprovalPreviewCardProps) {
  // Extract requester from title (e.g., "Person Name requested approval...")
  const title = notification.title;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <UserCheck className="h-4.5 w-4.5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {notification.entity_label && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {notification.entity_label}
            </p>
          )}
        </div>
      </div>

      {notification.body && (
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          {stripMentionMarkup(notification.body)}
        </p>
      )}

      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground/[0.06] text-[11px] font-medium text-foreground hover:bg-foreground/10 rq-transition"
      >
        Go to Approval
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
