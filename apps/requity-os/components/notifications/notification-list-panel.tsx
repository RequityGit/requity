"use client";

import { useMemo } from "react";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Notification } from "@/lib/notifications";
import {
  NotificationFilterTabs,
  FILTER_SLUG_MAP,
  type NotificationFilter,
} from "./notification-filter-tabs";
import { NotificationRow } from "./notification-row";

interface NotificationListPanelProps {
  notifications: Notification[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
}

function matchesFilter(
  notification: Notification,
  filter: NotificationFilter
): boolean {
  if (filter === "all") return true;
  const slugs = FILTER_SLUG_MAP[filter];
  return slugs.some(
    (s) =>
      notification.notification_slug === s ||
      notification.notification_slug.startsWith(s)
  );
}

function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const noteDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (noteDate.getTime() === today.getTime()) return "Today";
  if (noteDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function NotificationListPanel({
  notifications,
  loading,
  selectedId,
  onSelect,
  activeFilter,
  onFilterChange,
}: NotificationListPanelProps) {
  // Compute filter counts
  const counts = useMemo(() => {
    const result: Record<NotificationFilter, number> = {
      all: 0,
      mentions: 0,
      threads: 0,
      reactions: 0,
      assigned: 0,
    };
    for (const n of notifications) {
      // Only count unread for badges
      if (n.read_at !== null) continue;
      result.all++;
      for (const filter of Object.keys(FILTER_SLUG_MAP) as NotificationFilter[]) {
        if (filter !== "all" && matchesFilter(n, filter)) {
          result[filter]++;
        }
      }
    }
    return result;
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(
    () => notifications.filter((n) => matchesFilter(n, activeFilter)),
    [notifications, activeFilter]
  );

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: { label: string; items: Notification[] }[] = [];
    let currentLabel = "";
    for (const n of filteredNotifications) {
      const label = getDateGroup(n.created_at);
      if (label !== currentLabel) {
        groups.push({ label, items: [n] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].items.push(n);
      }
    }
    return groups;
  }, [filteredNotifications]);

  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col border-r border-border overflow-hidden">
      <NotificationFilterTabs
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        counts={counts}
      />

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-2.5 px-1">
                <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                  <Skeleton className="h-2 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              activeFilter === "all"
                ? "You're all caught up!"
                : `No ${activeFilter} notifications`
            }
            compact
          />
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 z-[1] bg-card px-3.5 pt-2 pb-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground/50">
                  {group.label}
                </span>
              </div>
              {group.items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedId === notification.id}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
