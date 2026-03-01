"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import { CheckCheck, Bell } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationDropdownProps {
  userId: string;
  activeRole: string;
  onClose: () => void;
  onCountChange?: () => void;
}

export function NotificationDropdown({
  userId,
  activeRole,
  onClose,
  onCountChange,
}: NotificationDropdownProps) {
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(userId, { limit: 15 });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkAsRead(id: string) {
    await markAsRead([id]);
    onCountChange?.();
  }

  async function handleMarkAllAsRead() {
    await markAllAsRead();
    onCountChange?.();
  }

  return (
    <div className="w-[380px] rounded-lg border border-gray-200 bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md px-3 py-2.5">
                <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Bell className="h-6 w-6 text-green-600" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-900">
              You&apos;re all caught up!
            </p>
            <p className="mt-1 text-xs text-gray-500">
              No new notifications to show.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1.5">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                activeRole={activeRole}
                onMarkAsRead={handleMarkAsRead}
                variant="compact"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
