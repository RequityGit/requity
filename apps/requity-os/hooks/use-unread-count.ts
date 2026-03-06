"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { nq } from "@/lib/notifications";

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const supabaseRef = useRef(createClient());
  const fetchCountRef = useRef<() => Promise<void>>();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await nq(supabaseRef.current).rpc(
      "get_active_notification_count"
    );
    if (!error && data !== null) {
      setCount(data as number);
    }
  }, [userId]);

  // Keep ref in sync so the realtime handler always calls the latest version
  fetchCountRef.current = fetchCount;

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
