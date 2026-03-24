"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import React from "react";
import { createClient } from "@/lib/supabase/client";
import { nq } from "@/lib/notifications";

interface NotificationCenterState {
  isOpen: boolean;
  selectedNotificationId: string | null;
  open: (notificationId?: string) => void;
  close: () => void;
  selectNotification: (id: string | null) => void;
  /** Shared unread count — single source of truth for bell + center */
  unreadCount: number;
  /** Force refetch from DB. Call after archive/read actions. */
  refetchCount: () => Promise<void>;
  /** Optimistically set count to a specific value (e.g., 0 after archive all). */
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
}

const NotificationCenterContext = createContext<NotificationCenterState | null>(
  null
);

export function NotificationCenterProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabaseRef = useRef(createClient());
  const fetchCountRef = useRef<() => Promise<void>>();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Unread count fetcher ──
  const fetchCount = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await nq(supabaseRef.current).rpc(
      "get_unread_notification_count"
    );
    if (!error && data !== null) {
      setUnreadCount(data as number);
    }
  }, [userId]);

  fetchCountRef.current = fetchCount;

  // Sync badge count to PWA app badge
  useEffect(() => {
    if ("setAppBadge" in navigator) {
      if (unreadCount > 0) {
        (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> }).setAppBadge(unreadCount).catch(() => {});
      } else {
        (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {});
      }
    }
  }, [unreadCount]);

  // Initial fetch
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Realtime subscription for count updates
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
          setUnreadCount((prev) => prev + 1);
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

  // ── Open/close logic ──
  const open = useCallback((notificationId?: string) => {
    setIsOpen(true);
    if (notificationId) {
      setSelectedNotificationId(notificationId);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedNotificationId(null);
  }, []);

  const selectNotification = useCallback((id: string | null) => {
    setSelectedNotificationId(id);
  }, []);

  // Global keyboard shortcut: Cmd+J / Ctrl+J to toggle, Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (prev) {
            setSelectedNotificationId(null);
            return false;
          }
          return true;
        });
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const value: NotificationCenterState = {
    isOpen,
    selectedNotificationId,
    open,
    close,
    selectNotification,
    unreadCount,
    refetchCount: fetchCount,
    setUnreadCount,
  };

  return React.createElement(
    NotificationCenterContext.Provider,
    { value },
    children
  );
}

export function useNotificationCenter() {
  const context = useContext(NotificationCenterContext);
  if (!context) {
    throw new Error(
      "useNotificationCenter must be used within a NotificationCenterProvider"
    );
  }
  return context;
}
