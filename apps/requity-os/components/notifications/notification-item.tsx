"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, X } from "lucide-react";
import type { Notification } from "@/lib/notifications";
import {
  formatRelativeTime,
  getPriorityColor,
  getNotificationRoute,
  getEntityTypeLabel,
} from "@/lib/notifications";
import { stripMentionMarkup } from "@/lib/comment-utils";
import { NotificationPriorityBadge } from "./notification-priority-badge";

interface NotificationItemProps {
  notification: Notification;
  activeRole: string;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  onClose?: () => void;
  variant?: "compact" | "full";
}

export function NotificationItem({
  notification,
  activeRole,
  onArchive,
  onUnarchive,
  onMarkAsRead,
  onClose,
  variant = "compact",
}: NotificationItemProps) {
  const router = useRouter();
  const priorityColors = getPriorityColor(notification.priority);
  const resolvedRoute = getNotificationRoute(notification, activeRole);
  const isArchived = notification.archived_at !== null;
  const isUnread = notification.read_at === null;
  const entityTypeLabel = getEntityTypeLabel(notification.entity_type);

  function handleClick() {
    // Mark as read (optimistic)
    if (isUnread) {
      onMarkAsRead?.(notification.id);
    }
    // Close dropdown
    onClose?.();
    // Navigate
    router.push(resolvedRoute);
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    // Mark as read without navigating
    if (isUnread) {
      onMarkAsRead?.(notification.id);
    }
  }

  if (variant === "full") {
    return (
      <div
        className={cn(
          "group relative flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors border-l-4",
          priorityColors.border,
          isArchived && "opacity-75",
          !isArchived && !isUnread && "opacity-80",
          "cursor-pointer hover:bg-muted"
        )}
        onClick={handleClick}
      >
        {/* Priority dot */}
        <div className="mt-1 flex-shrink-0">
          <div className={cn("h-2.5 w-2.5 rounded-full", priorityColors.dot)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {notification.title}
              </p>
              {notification.body && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {notification.body ? stripMentionMarkup(notification.body) : null}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                {entityTypeLabel && (
                  <span className="text-xs text-muted-foreground">
                    {entityTypeLabel}
                  </span>
                )}
                {entityTypeLabel && notification.entity_label && (
                  <span className="text-xs text-muted-foreground">·</span>
                )}
                {notification.entity_label && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                    {notification.entity_label}
                  </span>
                )}
                <NotificationPriorityBadge
                  priority={notification.priority}
                  showLabel
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap num">
                {formatRelativeTime(notification.created_at)}
              </span>

              {/* Hover actions */}
              <div className="hidden group-hover:flex items-center gap-1">
                {!isArchived && onArchive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(notification.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                {isArchived && onUnarchive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnarchive(notification.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Unarchive"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant (for dropdown)
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative w-full text-left flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted cursor-pointer",
        !isUnread && "opacity-70"
      )}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0 w-2">
        {isUnread && (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            isUnread
              ? "font-medium text-foreground"
              : "font-normal text-muted-foreground"
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {stripMentionMarkup(notification.body)}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          {entityTypeLabel && (
            <span className="text-xs text-muted-foreground font-medium">
              {entityTypeLabel}
            </span>
          )}
          {entityTypeLabel && (
            <span className="text-xs text-muted-foreground">·</span>
          )}
          <span className="text-xs text-muted-foreground num">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>

      {/* Dismiss X on hover */}
      {isUnread && (
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 hidden group-hover:flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
