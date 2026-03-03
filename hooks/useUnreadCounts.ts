"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadCounts(userId: string | undefined) {
  const [totalUnread, setTotalUnread] = useState(0);
  const supabaseRef = useRef(createClient());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!userId) return;
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("chat_channel_members")
      .select("unread_count, is_muted")
      .eq("user_id", userId)
      .is("left_at", null);

    if (data) {
      const rows = data as unknown as Array<{ unread_count: number; is_muted: boolean }>;
      const total = rows.reduce(
        (sum, m) => sum + (m.is_muted ? 0 : (m.unread_count || 0)),
        0
      );
      setTotalUnread(total);
    }
  }, [userId]);

  const debouncedFetchUnread = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchUnread();
    }, 300);
  }, [fetchUnread]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Realtime updates
  useEffect(() => {
    if (!userId) return;
    const supabase = supabaseRef.current;

    const sub = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_channel_members",
          filter: `user_id=eq.${userId}`,
        },
        () => debouncedFetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [userId, debouncedFetchUnread]);

  return { totalUnread, refetch: fetchUnread };
}
