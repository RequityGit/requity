"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUnreadCounts(userId: string | undefined) {
  const [totalUnread, setTotalUnread] = useState(0);
  const supabaseRef = useRef(createClient());

  const fetchUnread = useCallback(async () => {
    if (!userId) return;
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("chat_channel_members" as never)
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

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

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
        () => fetchUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [userId, fetchUnread]);

  return { totalUnread, refetch: fetchUnread };
}
