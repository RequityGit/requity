"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatUserPresence, PresenceStatus } from "@/lib/chat-types";

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds
const AWAY_TIMEOUT = 5 * 60_000; // 5 minutes

export function usePresence(userId: string | undefined) {
  const [presenceMap, setPresenceMap] = useState<Map<string, ChatUserPresence>>(new Map());
  const supabaseRef = useRef(createClient());
  const lastActivityRef = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("mousemove", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("click", onActivity, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
    };
  }, []);

  // Heartbeat: update own presence
  useEffect(() => {
    if (!userId) return;
    const supabase = supabaseRef.current;

    const updatePresence = async (status: PresenceStatus) => {
      await supabase.from("chat_user_presence").upsert(
        {
          user_id: userId,
          status,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    };

    // Go online immediately
    updatePresence("online");

    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const status: PresenceStatus = idleMs > AWAY_TIMEOUT ? "away" : "online";
      updatePresence(status);
    }, HEARTBEAT_INTERVAL);

    // Go offline on tab close
    const onBeforeUnload = () => {
      // Use sendBeacon for reliability on unload
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const url = `${supabaseUrl}/rest/v1/chat_user_presence?user_id=eq.${userId}`;
        const body = JSON.stringify({
          status: "offline",
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        navigator.sendBeacon(
          url,
          new Blob([body], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onBeforeUnload);
      updatePresence("offline");
    };
  }, [userId]);

  // Subscribe to all presence changes
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Initial fetch
    const fetchAll = async () => {
      const { data } = await supabase
        .from("chat_user_presence")
        .select("*");
      if (data) {
        const map = new Map<string, ChatUserPresence>();
        for (const row of data as unknown as ChatUserPresence[]) {
          map.set(row.user_id, row);
        }
        setPresenceMap(map);
      }
    };
    fetchAll();

    const sub = supabase
      .channel("presence-all")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_user_presence" },
        (payload) => {
          const row = payload.new as ChatUserPresence;
          setPresenceMap((prev) => {
            const next = new Map(prev);
            next.set(row.user_id, row);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const getStatus = useCallback(
    (uid: string): PresenceStatus => {
      return presenceMap.get(uid)?.status as PresenceStatus || "offline";
    },
    [presenceMap]
  );

  return { presenceMap, getStatus };
}
