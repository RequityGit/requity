"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/notifications";
import { nq } from "@/lib/notifications";

interface UseNotificationsOptions {
  limit?: number;
  category?: string;
  priority?: string;
  status?: "all" | "unread" | "read";
  dateRange?: "today" | "week" | "month" | "all";
}

export function useNotifications(
  userId: string | undefined,
  options: UseNotificationsOptions = {}
) {
  const { limit = 15, category, priority, status = "all", dateRange = "all" } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const supabase = createClient();
  const q = nq(supabase);

  const fetchNotifications = useCallback(
    async (pageNum = 0, append = false) => {
      if (!userId) return;
      setLoading(true);

      let query = q
        .notifications()
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

      if (category && category !== "all") {
        query = query.eq("notification_slug", category);
      }

      if (priority && priority !== "all") {
        query = query.eq("priority", priority);
      }

      if (status === "unread") {
        query = query.eq("is_read", false);
      } else if (status === "read") {
        query = query.eq("is_read", true);
      }

      if (dateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte("created_at", today.toISOString());
      } else if (dateRange === "week") {
        const week = new Date();
        week.setDate(week.getDate() - 7);
        query = query.gte("created_at", week.toISOString());
      } else if (dateRange === "month") {
        const month = new Date();
        month.setMonth(month.getMonth() - 1);
        query = query.gte("created_at", month.toISOString());
      }

      const { data, error } = await query;

      if (!error && data) {
        const typed = data as Notification[];
        if (append) {
          setNotifications((prev) => [...prev, ...typed]);
        } else {
          setNotifications(typed);
        }
        setHasMore(typed.length === limit);
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, limit, category, priority, status, dateRange]
  );

  useEffect(() => {
    setPage(0);
    fetchNotifications(0);
  }, [fetchNotifications]);

  // Subscribe to realtime new notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-list-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  }, [page, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      const { error } = await q.rpc("mark_notifications_read", {
        p_notification_ids: notificationIds,
      });
      if (!error) {
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id)
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const markAllAsRead = useCallback(async () => {
    const { error } = await q.rpc("mark_all_notifications_read");
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const archiveNotification = useCallback(
    async (notificationId: string) => {
      const { error } = await q
        .notifications()
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq("id", notificationId);
      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const archiveAllRead = useCallback(async () => {
    const { error } = await q
      .notifications()
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", true)
      .eq("is_archived", false);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => !n.is_read));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    notifications,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    archiveAllRead,
    refetch: () => fetchNotifications(0),
  };
}
