"use client";

import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/chat-types";

const statusColors: Record<PresenceStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-slate-300",
};

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PresenceIndicator({
  status,
  size = "sm",
  className,
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-white",
        sizeClasses[size],
        statusColors[status],
        className
      )}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}
