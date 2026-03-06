"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/notifications";
import { nq } from "@/lib/notifications";

interface UseNotificationsOptions {
  limit?: number;
  category?: string;
  priority?: string;
  view?: "active" | "archived";
  dateRange?: "today" | "week" | "month" | "all";
}

export function useNotifications(
  userId: string | undefined,
  options: UseNotificationsOptions = {}
) {
  const { limit = 15, category, priority, view = "active", dateRange = "all" } = options;
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
        .order("created_at", { ascending: false })
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

      // Active = archived_at IS NULL, Archived = archived_at IS NOT NULL
      if (view === "active") {
        query = query.is("archived_at", null);
      } else {
        query = query.not("archived_at", "is", null);
      }

      if (category && category !== "all") {
        query = query.eq("notification_slug", category);
      }

      if (priority && priority !== "all") {
        query = query.eq("priority", priority);
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
    [userId, limit, category, priority, view, dateRange]
  );

  useEffect(() => {
    setPage(0);
    fetchNotifications(0);
  }, [fetchNotifications]);

  // Subscribe to realtime new notifications (only for active view)
  useEffect(() => {
    if (!userId || view !== "active") return;

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
  }, [userId, view]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  }, [page, fetchNotifications]);

  const archiveNotification = useCallback(
    async (notificationId: string) => {
      const { error } = await q.rpc("archive_notification", {
        p_notification_id: notificationId,
      });
      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const archiveAll = useCallback(async () => {
    const { error } = await q.rpc("archive_all_notifications");
    if (!error) {
      setNotifications([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unarchiveNotification = useCallback(
    async (notificationId: string) => {
      const { error } = await q.rpc("unarchive_notification", {
        p_notification_id: notificationId,
      });
      if (!error) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    notifications,
    loading,
    hasMore,
    loadMore,
    archiveNotification,
    archiveAll,
    unarchiveNotification,
    refetch: () => fetchNotifications(0),
  };
}
