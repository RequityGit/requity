"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotificationCenter } from "@/hooks/use-notification-center";

interface NotificationBellProps {
  userId: string;
  activeRole: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const { unreadCount: count, open, isOpen } = useNotificationCenter();

  return (
    <button
      onClick={() => open()}
      className={cn(
        "relative flex items-center justify-center h-9 w-9 rounded-md transition-colors",
        isOpen
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-label={`Notifications${count > 0 ? ` (${count} active)` : ""}`}
    >
      <Bell className="h-5 w-5" />

      {/* Unread badge */}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F0719B] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-card">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
