"use client";

import { cn } from "@/lib/utils";
import { PRIORITY_COLORS } from "@/lib/tasks";

interface PriorityDotProps {
  priority: string;
  className?: string;
}

export function PriorityDot({ priority, className }: PriorityDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full flex-shrink-0",
        PRIORITY_COLORS[priority] ?? "bg-muted-foreground/40",
        className
      )}
      title={`${priority} priority`}
    />
  );
}
