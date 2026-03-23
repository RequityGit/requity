"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Bell, Check, Archive, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationCenter } from "@/hooks/use-notification-center";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationFilter } from "./notification-filter-tabs";
import { NotificationListPanel } from "./notification-list-panel";
import { NotificationDetailPanel } from "./notification-detail-panel";

interface NotificationCenterProps {
  userId: string;
  activeRole: string;
  currentUserName: string;
}

export function NotificationCenter({
  userId,
  activeRole,
  currentUserName,
}: NotificationCenterProps) {
  const {
    isOpen,
    close,
    selectedNotificationId,
    selectNotification,
    unreadCount,
    refetchCount,
    setUnreadCount,
  } = useNotificationCenter();

  const {
    notifications,
    loading,
    markAsRead,
    archiveNotification,
    archiveAll,
  } = useNotifications(userId, { limit: 50 });

  const [filter, setFilter] = useState<NotificationFilter>("all");

  // Auto-select first unread notification when modal opens
  useEffect(() => {
    if (isOpen && notifications.length > 0 && !selectedNotificationId) {
      const firstUnread = notifications.find((n) => n.read_at === null);
      selectNotification((firstUnread ?? notifications[0]).id);
    }
  }, [isOpen, notifications.length > 0, selectedNotificationId]);

  // Mark as read when selecting a notification
  const handleSelect = useCallback(
    (id: string) => {
      selectNotification(id);
      const notif = notifications.find((n) => n.id === id);
      if (notif && notif.read_at === null) {
        markAsRead(id);
        refetchCount();
      }
    },
    [notifications, selectNotification, markAsRead, refetchCount]
  );

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
      await markAsRead(id);
      refetchCount();
    },
    [markAsRead, refetchCount, setUnreadCount]
  );

  const handleArchive = useCallback(
    async (id: string) => {
      const notif = notifications.find((n) => n.id === id);
      if (notif && !notif.read_at) {
        setUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
      if (selectedNotificationId === id) {
        const idx = notifications.findIndex((n) => n.id === id);
        const next = notifications[idx + 1] ?? notifications[idx - 1];
        selectNotification(next?.id ?? null);
      }
      await archiveNotification(id);
      refetchCount();
    },
    [archiveNotification, refetchCount, notifications, selectedNotificationId, selectNotification, setUnreadCount]
  );

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => n.read_at === null);
    setUnreadCount(0);
    await Promise.all(unread.map((n) => markAsRead(n.id)));
    refetchCount();
  }, [notifications, markAsRead, refetchCount, setUnreadCount]);

  const handleArchiveAll = useCallback(async () => {
    setUnreadCount(0);
    await archiveAll();
    selectNotification(null);
    refetchCount();
  }, [archiveAll, refetchCount, selectNotification, setUnreadCount]);

  const selectedNotification = useMemo(
    () => notifications.find((n) => n.id === selectedNotificationId) ?? null,
    [notifications, selectedNotificationId]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[8vh]"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative w-[960px] max-h-[78vh] bg-card border border-border rounded-2xl flex flex-col overflow-hidden",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_25px_50px_-12px_rgba(0,0,0,0.5)]",
          "rq-animate-scale-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-[15px] font-semibold text-foreground">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="text-[11px] font-semibold text-muted-foreground bg-foreground/[0.06] px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {notifications.some((n) => n.read_at === null) && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] rq-transition"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleArchiveAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] rq-transition"
              >
                <Archive className="h-3 w-3" />
                Archive all
              </button>
            )}
            <span className="text-[10px] font-medium text-muted-foreground/40 bg-foreground/[0.03] border border-border px-1.5 py-0.5 rounded">
              esc
            </span>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <NotificationListPanel
            notifications={notifications}
            loading={loading}
            selectedId={selectedNotificationId}
            onSelect={handleSelect}
            activeFilter={filter}
            onFilterChange={setFilter}
            onMarkAsRead={handleMarkAsRead}
            onArchive={handleArchive}
          />
          <NotificationDetailPanel
            notification={selectedNotification}
            activeRole={activeRole}
            onClose={close}
            currentUserId={userId}
            currentUserName={currentUserName}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-border flex-shrink-0">
          <a
            href="/settings/notifications"
            onClick={(e) => {
              e.preventDefault();
              close();
              window.location.href = `/${activeRole}/account?tab=notifications`;
            }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground rq-transition"
          >
            <Settings className="h-3 w-3" />
            Notification Settings
          </a>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/[0.03] text-[10px]">
              Cmd
            </kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-foreground/[0.03] text-[10px]">
              J
            </kbd>
            <span>to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
