"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function SUCollapsible({
  title,
  icon: Icon,
  expanded,
  onToggle,
  badge,
  children,
}: {
  title: string;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5 w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[12px] font-semibold text-foreground">{title}</span>
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
        <div className="flex-1" />
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", !expanded && "-rotate-90")}
          strokeWidth={1.5}
        />
      </button>
      {expanded && <div className="border-t">{children}</div>}
    </div>
  );
}

export function SUFieldRow({
  label,
  value,
  suffix,
  computed,
  onChange,
  width,
}: {
  label: string;
  value: string;
  suffix?: string;
  computed?: boolean;
  onChange?: (v: string) => void;
  width?: string;
}) {
  return (
    <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors group">
      <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {onChange ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "text-right text-[12px] num font-medium text-foreground bg-transparent outline-none border-b border-dashed border-border/60 focus:border-primary/60",
              width ?? "w-[70px]"
            )}
          />
        ) : (
          <span className={cn("text-[12px] num font-medium", computed ? "text-muted-foreground italic" : "text-foreground")}>
            {value}
          </span>
        )}
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
        {computed && <span className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold">calc</span>}
      </div>
    </div>
  );
}

export function SUMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold num text-foreground">{value}</div>
    </div>
  );
}
