"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { NotificationDropdown } from "./notification-dropdown";

interface NotificationBellProps {
  userId: string;
  activeRole: string;
}

export function NotificationBell({ userId, activeRole }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { count, refetch } = useUnreadCount(userId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center justify-center h-9 w-9 rounded-md transition-colors",
          open
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />

        {/* Unread badge */}
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F0719B] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-card">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <NotificationDropdown
            userId={userId}
            activeRole={activeRole}
            onClose={() => setOpen(false)}
            onCountChange={refetch}
          />
        </div>
      )}
    </div>
  );
}
