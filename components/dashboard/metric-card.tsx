"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  change?: {
    value: string;
    positive: boolean;
  };
  isCurrency?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  change,
  isCurrency = false,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("card-cinematic", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-muted">
          {label}
        </p>
        {Icon && (
          <Icon className="h-5 w-5 text-gold/60" strokeWidth={1.5} />
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-surface-white",
          isCurrency
            ? "font-mono text-3xl font-semibold tabular-nums"
            : "font-display text-3xl font-light"
        )}
      >
        {value}
      </p>
      {(subtext || change) && (
        <div className="mt-2 flex items-center gap-2">
          {change && (
            <span
              className={cn(
                "text-xs font-mono font-medium",
                change.positive ? "text-status-success" : "text-status-danger"
              )}
            >
              {change.positive ? "+" : ""}
              {change.value}
            </span>
          )}
          {subtext && (
            <span className="text-xs font-body text-surface-gray">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
