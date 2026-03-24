"use client";

import { useMemo } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import { Archive, Bell } from "lucide-react";
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
    archiveNotification,
    archiveAll,
  } = useNotifications(userId, { limit: 15 });

  const { unread, read } = useMemo(() => {
    const unreadItems = notifications.filter((n) => n.read_at === null);
    const readItems = notifications.filter((n) => n.read_at !== null);
    return { unread: unreadItems, read: readItems };
  }, [notifications]);

  async function handleMarkAsRead(id: string) {
    await markAsRead(id);
    onCountChange?.();
  }

  async function handleArchive(id: string) {
    await archiveNotification(id);
    onCountChange?.();
  }

  async function handleArchiveAll() {
    await archiveAll();
    onCountChange?.();
  }

  const hasNotifications = notifications.length > 0;
  const unreadCount = unread.length;

  return (
    <div className="w-[380px] rounded-lg border border-border bg-card shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 num">
              {unreadCount}
            </span>
          )}
        </div>
        {hasNotifications && (
          <button
            onClick={handleArchiveAll}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive all
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
        ) : !hasNotifications ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              You&apos;re all caught up!
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No active notifications.
            </p>
          </div>
        ) : (
          <div className="p-1.5">
            {/* New (unread) section */}
            {unread.length > 0 && (
              <div>
                <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  New
                </p>
                <div className="space-y-0.5">
                  {unread.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      activeRole={activeRole}
                      onArchive={handleArchive}
                      onMarkAsRead={handleMarkAsRead}
                      onClose={onClose}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Earlier (read) section */}
            {read.length > 0 && (
              <div>
                {unread.length > 0 && (
                  <div className="mx-3 my-1.5 border-t border-border" />
                )}
                <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Earlier
                </p>
                <div className="space-y-0.5">
                  {read.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      activeRole={activeRole}
                      onArchive={handleArchive}
                      onMarkAsRead={handleMarkAsRead}
                      onClose={onClose}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={onClose}
          className="block w-full text-center text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
