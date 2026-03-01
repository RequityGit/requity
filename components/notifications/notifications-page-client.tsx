"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./notification-item";
import { NotificationPriorityBadge } from "./notification-priority-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CheckCheck,
  Archive,
  Bell,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationCategory, NotificationPriority } from "@/lib/notifications";
import { categoryDisplayNames } from "@/lib/notifications";

interface NotificationsPageClientProps {
  userId: string;
  activeRole: string;
}

const categories: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  ...Object.entries(categoryDisplayNames).map(([value, label]) => ({
    value,
    label,
  })),
];

const priorities: { value: string; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const statusFilters: { value: "all" | "unread" | "read"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const dateRanges: { value: "today" | "week" | "month" | "all"; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export function NotificationsPageClient({
  userId,
  activeRole,
}: NotificationsPageClientProps) {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
  } = useNotifications(userId, {
    limit: 20,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    status: statusFilter,
    dateRange,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Sidebar filters (desktop) */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 space-y-6">
          {/* Category filter */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Category
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                    categoryFilter === cat.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority filter */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Priority
            </h3>
            <div className="space-y-1">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriorityFilter(p.value)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                    priorityFilter === p.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {p.value !== "all" && (
                    <NotificationPriorityBadge
                      priority={p.value as NotificationPriority}
                    />
                  )}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </h3>
            <div className="space-y-1">
              {statusFilters.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                    statusFilter === s.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Date Range
            </h3>
            <div className="space-y-1">
              {dateRanges.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDateRange(d.value)}
                  className={cn(
                    "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                    dateRange === d.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar with actions */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "No unread notifications"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden gap-1.5"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  showFilters && "rotate-180"
                )}
              />
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={archiveAllRead}
            >
              <Archive className="h-4 w-4" />
              Archive read
            </Button>
          </div>
        </div>

        {/* Mobile filters (collapsible) */}
        {showFilters && (
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 lg:hidden">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "unread" | "read"
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {statusFilters.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(
                      e.target.value as "today" | "week" | "month" | "all"
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {dateRanges.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notification list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start gap-4">
                  <Skeleton className="h-2.5 w-2.5 rounded-full mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-24 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Bell className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-4 text-lg font-medium text-gray-900">
              You&apos;re all caught up!
            </p>
            <p className="mt-1 text-sm text-gray-500">
              No notifications match your current filters.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  activeRole={activeRole}
                  onMarkAsRead={(id) => markAsRead([id])}
                  onArchive={archiveNotification}
                  variant="full"
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={loadMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
