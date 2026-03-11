"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

export function fmtCurrency(v: unknown): string {
  const num = n(v);
  if (num === 0) return "$0";
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtPct(v: unknown): string {
  const num = n(v);
  return (num * 100).toFixed(1) + "%";
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function TH({
  children,
  align,
}: {
  children?: React.ReactNode;
  align?: "right" | "left";
}) {
  return (
    <th
      className={cn(
        "text-[11px] uppercase tracking-wider font-semibold px-3 py-2 text-muted-foreground bg-muted/50",
        align === "right" ? "text-right" : "text-left"
      )}
    >
      {children}
    </th>
  );
}

export function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

export function PillNav<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; icon: LucideIcon }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex gap-1.5 flex-wrap">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3.5 py-[7px] text-[13px] font-medium cursor-pointer transition-all duration-150",
              isActive
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function MetricBar({
  items,
}: {
  items: { label: string; value: string; sub?: string; accent?: string }[];
}) {
  return (
    <div className="rounded-xl border bg-muted/30 px-6 py-4 flex flex-wrap gap-8">
      {items.map((m, i) => (
        <div key={i} className="flex-1 min-w-[100px]">
          <div className="text-[11px] text-muted-foreground uppercase tracking-[0.05em] mb-1">
            {m.label}
          </div>
          <div
            className={cn("text-xl font-semibold num", m.accent)}
          >
            {m.value}
          </div>
          {m.sub && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {m.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  icon: Icon,
  children,
  actions,
  noPad,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  actions?: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          )}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    occupied: "text-green-500",
    vacant: "text-amber-500",
    down: "text-red-500",
    model: "text-blue-500",
  };
  const dotColors: Record<string, string> = {
    occupied: "bg-green-500",
    vacant: "bg-amber-500",
    down: "bg-red-500",
    model: "bg-blue-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        colors[status] ?? "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full",
          dotColors[status] ?? "bg-muted-foreground"
        )}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
