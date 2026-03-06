"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import type { Notification } from "@/lib/notifications";
import { formatRelativeTime, getPriorityColor, getNotificationRoute } from "@/lib/notifications";
import { NotificationPriorityBadge } from "./notification-priority-badge";

interface NotificationItemProps {
  notification: Notification;
  activeRole: string;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  variant?: "compact" | "full";
}

export function NotificationItem({
  notification,
  activeRole,
  onArchive,
  onUnarchive,
  variant = "compact",
}: NotificationItemProps) {
  const router = useRouter();
  const priorityColors = getPriorityColor(notification.priority);
  const resolvedRoute = getNotificationRoute(notification, activeRole);
  const isArchived = notification.archived_at !== null;

  function handleClick() {
    router.push(resolvedRoute);
  }

  if (variant === "full") {
    return (
      <div
        className={cn(
          "group relative flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors border-l-4",
          priorityColors.border,
          isArchived && "opacity-75",
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
                  {notification.body}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
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
    <button
      onClick={handleClick}
      className="w-full text-left flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted"
    >
      {/* Priority dot */}
      {(notification.priority === "urgent" ||
        notification.priority === "high") && (
        <div className="mt-1.5 flex-shrink-0">
          <div className={cn("h-2 w-2 rounded-full", priorityColors.dot)} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug font-medium text-foreground">
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {notification.body}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {notification.entity_label && (
            <span className="text-xs text-blue-600 font-medium">
              {notification.entity_label}
            </span>
          )}
          <span className="text-xs text-muted-foreground num">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
}
