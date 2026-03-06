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

  // Store latest channelId/userId in refs so timer callbacks always use
  // the current values without creating stale closures.
  const channelIdRef = useRef(channelId);
  const userIdRef = useRef(userId);
  useEffect(() => { channelIdRef.current = channelId; }, [channelId]);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Stop typing indicator — reads from refs so it's always fresh
  const stopTyping = useCallback(async () => {
    const cid = channelIdRef.current;
    const uid = userIdRef.current;
    if (!cid || !uid) return;
    const supabase = supabaseRef.current;
    await supabase
      .from("chat_typing_indicators")
      .delete()
      .eq("channel_id", cid)
      .eq("user_id", uid);
    lastTypingRef.current = 0;
  }, []); // no deps — intentionally stable via refs

  // Send typing indicator (debounced)
  const sendTyping = useCallback(async () => {
    if (!channelId || !userId) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;

    const supabase = supabaseRef.current;
    await supabase.from("chat_typing_indicators").upsert(
      {
        channel_id: channelId,
        user_id: userId,
        started_at: new Date().toISOString(),
      },
      { onConflict: "channel_id,user_id" }
    );

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => { stopTyping(); }, TYPING_TIMEOUT);
  }, [channelId, userId, stopTyping]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!channelId) {
      setTypingUsers([]);
      return;
    }
    const supabase = supabaseRef.current;

    const fetchTyping = async () => {
      const { data } = await supabase
        .from("chat_typing_indicators")
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
