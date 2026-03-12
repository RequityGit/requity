"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_URL } from "@/lib/supabase/constants";

interface ActivityEvent {
  action_type: string;
  page_path: string;
  component?: string;
  metadata?: Record<string, unknown>;
  session_id: string;
  role?: string;
  department?: string;
  duration_ms?: number;
}

const BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 30_000;
const EDGE_FUNCTION_URL =
  SUPABASE_URL + "/functions/v1/track-activity";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("activity_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("activity_session_id", sid);
  }
  return sid;
}

export function useActivityTracker(role?: string, department?: string) {
  const pathname = usePathname();
  const queueRef = useRef<ActivityEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageEnteredRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const flushingRef = useRef(false);

  // Initialise session id on mount (client only)
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  // ---- flush logic ----
  const flush = useCallback(async () => {
    if (queueRef.current.length === 0 || flushingRef.current) return;
    flushingRef.current = true;
    const batch = queueRef.current.splice(0);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // put events back — can't send without auth
        queueRef.current.unshift(...batch);
        return;
      }
      await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(batch),
      });
    } catch {
      // silently fail — tracking should never block UI
    } finally {
      flushingRef.current = false;
    }
  }, []);

  // ---- enqueue helper ----
  const enqueue = useCallback(
    (event: Omit<ActivityEvent, "session_id" | "role" | "department">) => {
      queueRef.current.push({
        ...event,
        session_id: sessionIdRef.current,
        role: role ?? undefined,
        department: department ?? undefined,
      });
      if (queueRef.current.length >= BATCH_SIZE) {
        flush();
      }
    },
    [role, department, flush]
  );

  // ---- periodic flush ----
  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // flush remaining on unmount
      flush();
    };
  }, [flush]);

  // ---- page view tracking on route change ----
  useEffect(() => {
    const now = Date.now();

    // Record duration of previous page
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      const duration = now - pageEnteredRef.current;
      enqueue({
        action_type: "time_on_page",
        page_path: prevPathRef.current,
        duration_ms: duration,
      });
    }

    // Record page_view for new page
    enqueue({
      action_type: "page_view",
      page_path: pathname,
    });

    prevPathRef.current = pathname;
    pageEnteredRef.current = now;
  }, [pathname, enqueue]);

  // ---- visibility change (tab blur) — record time on page ----
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden" && prevPathRef.current) {
        const duration = Date.now() - pageEnteredRef.current;
        enqueue({
          action_type: "time_on_page",
          page_path: prevPathRef.current,
          duration_ms: duration,
        });
        flush();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [enqueue, flush]);

  // ---- public API for manual tracking ----
  const trackEvent = useCallback(
    (
      actionType: string,
      opts?: {
        component?: string;
        metadata?: Record<string, unknown>;
        durationMs?: number;
      }
    ) => {
      enqueue({
        action_type: actionType,
        page_path: pathname,
        component: opts?.component,
        metadata: opts?.metadata,
        duration_ms: opts?.durationMs,
      });
    },
    [enqueue, pathname]
  );

  return { trackEvent };
}
