"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ── DotPill: Pill with colored dot prefix ──
export function DotPill({
  color,
  label,
  small,
  className,
}: {
  color: string;
  label: string;
  small?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        className
      )}
      style={{ backgroundColor: `${color}14`, color }}
    >
      <span
        className={cn("rounded-full shrink-0", small ? "h-1.5 w-1.5" : "h-[7px] w-[7px]")}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

// ── OutlinedPill: Pill with border, transparent bg ──
export function OutlinedPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border border-foreground text-foreground whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

// ── SectionCard: White card with optional title bar ──
export function SectionCard({
  title,
  icon: Icon,
  children,
  action,
  noPad,
}: {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-muted-foreground" strokeWidth={1.5} />}
            <span className="text-[13px] font-semibold text-foreground">{title}</span>
          </div>
          {action}
        </div>
      )}
      {noPad ? children : <div className="p-5">{children}</div>}
    </div>
  );
}

// ── MetricCard: Label/value/subtitle metric ──
export function MetricCard({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex-1 min-w-[120px]">
      <div className="text-[11px] text-muted-foreground font-medium mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={cn("text-xl font-semibold text-foreground leading-tight", mono && "num font-mono")}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ── FieldRow: Label-value row for detail grids ──
export function FieldRow({
  label,
  value,
  mono,
  danger,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/40">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-[13px] text-right",
          danger ? "text-red-500" : "text-foreground",
          mono ? "font-medium num font-mono" : "font-normal"
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// ── TabBtn: Tab button with optional count badge ──
export function TabBtn({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number | null;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 mr-6 bg-transparent border-none border-b-2 text-[13px] cursor-pointer transition-all duration-150 inline-flex items-center gap-1.5 whitespace-nowrap",
        active
          ? "border-foreground text-foreground font-semibold"
          : "border-transparent text-muted-foreground font-medium hover:text-foreground/70"
      )}
    >
      {label}
      {count != null && (
        <span
          className={cn(
            "text-[10px] rounded-full px-1.5 py-px font-semibold",
            active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── MonoValue: JetBrains Mono for numbers ──
export function MonoValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("tabular-nums", className)}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {children}
    </span>
  );
}

// ── relTime helper ──
export function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diff = Math.floor(diffMs / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
