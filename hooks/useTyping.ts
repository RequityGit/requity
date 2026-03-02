"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TypingUser } from "@/lib/chat-types";

const TYPING_TIMEOUT = 5000; // 5 seconds

export function useTyping(channelId: string | null, userId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const supabaseRef = useRef(createClient());
  const lastTypingRef = useRef<number>(0);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Send typing indicator (debounced)
  const sendTyping = useCallback(async () => {
    if (!channelId || !userId) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return; // Don't spam
    lastTypingRef.current = now;

    const supabase = supabaseRef.current;
    await supabase.from("chat_typing_indicators" as never).upsert(
      {
        channel_id: channelId,
        user_id: userId,
        started_at: new Date().toISOString(),
      } as never,
      { onConflict: "channel_id,user_id" }
    );

    // Auto-clear after timeout
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => stopTyping(), TYPING_TIMEOUT);
  }, [channelId, userId]);

  // Stop typing indicator
  const stopTyping = useCallback(async () => {
    if (!channelId || !userId) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_typing_indicators" as never)
      .delete()
      .eq("channel_id", channelId)
      .eq("user_id", userId);
    lastTypingRef.current = 0;
  }, [channelId, userId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channelId) {
      setTypingUsers([]);
      return;
    }
    const supabase = supabaseRef.current;

    const fetchTyping = async () => {
      const { data } = await supabase
        .from("chat_typing_indicators" as never)
        .select("channel_id, user_id, started_at")
        .eq("channel_id", channelId);

      const rows = data as unknown as Array<{ channel_id: string; user_id: string; started_at: string }> | null;
      if (!rows || rows.length === 0) {
        setTypingUsers([]);
        return;
      }

      // Fetch names
      const userIds = rows
        .filter((t) => t.user_id !== userId)
        .map((t) => t.user_id);
      if (userIds.length === 0) {
        setTypingUsers([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const nameMap = new Map<string, string>();
      if (profiles) {
        for (const p of profiles) {
          nameMap.set(p.id, p.full_name || "Someone");
        }
      }

      setTypingUsers(
        rows
          .filter((t) => t.user_id !== userId)
          .map((t) => ({
            user_id: t.user_id,
            full_name: nameMap.get(t.user_id) || "Someone",
            started_at: t.started_at,
          }))
      );
    };

    fetchTyping();

    const sub = supabase
      .channel(`typing-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_typing_indicators",
          filter: `channel_id=eq.${channelId}`,
        },
        () => fetchTyping()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [channelId, userId]);

  return { typingUsers, sendTyping, stopTyping };
}
