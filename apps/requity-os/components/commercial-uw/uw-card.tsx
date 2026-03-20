"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface UWCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPad?: boolean;
  accent?: string;
  children: ReactNode;
  className?: string;
}

export function UWCard({
  title,
  subtitle,
  action,
  noPad,
  accent,
  children,
  className,
}: UWCardProps) {
  return (
    <div
      className={cn("rounded-lg border bg-card overflow-hidden shadow-sm", className)}
      style={accent ? { borderTopWidth: 2, borderTopColor: accent } : undefined}
    >
      {(title || action) && (
        <div className="flex justify-between items-start px-[22px] py-[18px] border-b">
          <div>
            <div className="text-[15px] font-bold tracking-tight">{title}</div>
            {subtitle && (
              <div className="text-[11px] text-muted-foreground mt-[3px] max-w-[600px]">
                {subtitle}
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center shrink-0">{action}</div>
        </div>
      )}
      <div className={noPad ? "" : "px-[22px] py-[18px]"}>{children}</div>
    </div>
  );
}

export function UWKpi({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex-1 p-3 bg-accent/50 rounded-lg border min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-1">
        {label}
      </div>
      <div
        className="text-xl font-bold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      )}
    </div>
  );
}
