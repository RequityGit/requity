"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Archive, Check } from "lucide-react";
import type { Notification } from "@/lib/notifications";
import { formatRelativeTime, getPriorityColor, getNotificationRoute } from "@/lib/notifications";
import { NotificationPriorityBadge } from "./notification-priority-badge";

interface NotificationItemProps {
  notification: Notification;
  activeRole: string;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  variant?: "compact" | "full";
}

export function NotificationItem({
  notification,
  activeRole,
  onMarkAsRead,
  onArchive,
  variant = "compact",
}: NotificationItemProps) {
  const router = useRouter();
  const priorityColors = getPriorityColor(notification.priority);
  const resolvedRoute = getNotificationRoute(notification, activeRole);

  function handleClick() {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    router.push(resolvedRoute);
  }

  if (variant === "full") {
    return (
      <div
        className={cn(
          "group relative flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors",
          !notification.is_read && "border-l-4",
          !notification.is_read && priorityColors.border,
          notification.is_read && "border-gray-200",
          "cursor-pointer hover:bg-gray-50"
        )}
        onClick={handleClick}
      >
        {/* Priority dot for unread */}
        {!notification.is_read && (
          <div className="mt-1 flex-shrink-0">
            <div className={cn("h-2.5 w-2.5 rounded-full", priorityColors.dot)} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm",
                  notification.is_read
                    ? "text-gray-700"
                    : "font-semibold text-gray-900"
                )}
              >
                {notification.title}
              </p>
              {notification.body && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
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
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatRelativeTime(notification.created_at)}
              </span>

              {/* Hover actions */}
              <div className="hidden group-hover:flex items-center gap-1">
                {!notification.is_read && onMarkAsRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {onArchive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(notification.id);
                    }}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
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
      className={cn(
        "w-full text-left flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-gray-50",
        !notification.is_read && "bg-blue-50/50"
      )}
    >
      {/* Priority dot */}
      {(notification.priority === "urgent" ||
        notification.priority === "high") && (
        <div className="mt-1.5 flex-shrink-0">
          <div className={cn("h-2 w-2 rounded-full", priorityColors.dot)} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm leading-snug",
            notification.is_read
              ? "text-gray-600"
              : "font-medium text-gray-900"
          )}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
            {notification.body}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          {notification.entity_label && (
            <span className="text-xs text-blue-600 font-medium">
              {notification.entity_label}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>
      </div>
    </button>
  );
}
