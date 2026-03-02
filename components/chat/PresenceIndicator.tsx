"use client";

import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/lib/chat-types";

const statusColors: Record<PresenceStatus, string> = {
  online: "bg-[#2D8A56]",
  away: "bg-[#D4952B]",
  busy: "bg-[#C0392B]",
  offline: "bg-[#8A8680]",
};

interface PresenceIndicatorProps {
  status: PresenceStatus;
  size?: "sm" | "md" | "lg";
  borderColor?: string;
  className?: string;
}

export function PresenceIndicator({
  status,
  size = "sm",
  borderColor,
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
        "inline-block rounded-full border-2",
        borderColor || "border-card",
        sizeClasses[size],
        statusColors[status],
        className
      )}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
}
