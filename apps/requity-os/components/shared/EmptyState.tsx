"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode | {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const ActionIcon = action && !React.isValidElement(action) ? (action as { icon?: LucideIcon }).icon : undefined;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-12",
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "text-muted-foreground/40 mb-3",
            compact ? "h-8 w-8" : "h-10 w-10"
          )}
          strokeWidth={1.5}
        />
      )}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground/70 max-w-[280px]">
          {description}
        </p>
      )}
      {action && (
        React.isValidElement(action) ? (
          <div className="mt-4">{action}</div>
        ) : (
          <button
            type="button"
            onClick={(action as { onClick: () => void }).onClick}
            className="rq-action-btn-sm mt-4"
          >
            {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
            {(action as { label: string }).label}
          </button>
        )
      )}
    </div>
  );
}
