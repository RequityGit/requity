"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { nq } from "@/lib/notifications";

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const supabaseRef = useRef(createClient());
  const fetchCountRef = useRef<() => Promise<void>>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await nq(supabaseRef.current).rpc(
      "get_unread_notification_count"
    );
    if (!error && data !== null) {
      setCount(data as number);
    }
  }, [userId]);

  // Keep ref in sync so the realtime handler always calls the latest version
  fetchCountRef.current = fetchCount;

  // Sync badge count to PWA app badge (dock icon badge like Monday.com)
  useEffect(() => {
    if ("setAppBadge" in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [count]);

  // Initial fetch
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Stable realtime subscription — only depends on userId
  useEffect(() => {
    if (!userId) return;

    const supabase = supabaseRef.current;

    const debouncedRefetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchCountRef.current?.();
      }, 300);
    };

    const channel = supabase
      .channel(`active-count-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefetch
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        debouncedRefetch
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { count, refetch: fetchCount };
}
