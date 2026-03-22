"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import React from "react";

interface NotificationCenterState {
  isOpen: boolean;
  selectedNotificationId: string | null;
  open: (notificationId?: string) => void;
  close: () => void;
  selectNotification: (id: string | null) => void;
}

const NotificationCenterContext = createContext<NotificationCenterState | null>(
  null
);

export function NotificationCenterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null);

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
