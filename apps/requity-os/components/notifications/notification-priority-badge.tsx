"use client";

import { cn } from "@/lib/utils";
import type { NotificationPriority } from "@/lib/notifications";
import { getPriorityColor } from "@/lib/notifications";

interface NotificationPriorityBadgeProps {
  priority: NotificationPriority;
  showLabel?: boolean;
}

export function NotificationPriorityBadge({
  priority,
  showLabel = false,
}: NotificationPriorityBadgeProps) {
  const colors = getPriorityColor(priority);

  if (priority === "normal" || priority === "low") {
    if (!showLabel) return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colors.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {showLabel && <span className="capitalize">{priority}</span>}
    </span>
  );
}
