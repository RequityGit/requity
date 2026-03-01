"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { nq } from "@/lib/notifications";

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await nq(supabase).rpc("get_unread_notification_count");
    if (!error && data !== null) {
      setCount(data as number);
    }
  }, [userId, supabase]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Subscribe to realtime changes for this user's notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-count-${userId}`)
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
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, fetchCount]);

  return { count, refetch: fetchCount };
}
