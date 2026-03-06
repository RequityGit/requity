"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check, X, Loader2 } from "lucide-react";
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

// ── EditableFieldRow: Click-to-edit label-value row ──
export type FieldType = "text" | "number" | "date" | "select" | "boolean" | "currency";

export interface EditableFieldRowProps {
  label: string;
  value: React.ReactNode;
  rawValue: string | number | boolean | null | undefined;
  fieldType?: FieldType;
  selectOptions?: { label: string; value: string }[];
  mono?: boolean;
  danger?: boolean;
  onSave: (newValue: string | number | boolean | null) => Promise<void>;
}

export function EditableFieldRow({
  label,
  value,
  rawValue,
  fieldType = "text",
  selectOptions,
  mono,
  danger,
  onSave,
}: EditableFieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const startEditing = useCallback(() => {
    if (fieldType === "boolean") {
      setEditValue(rawValue ? "true" : "false");
    } else if (fieldType === "currency") {
      // Strip formatting for editing
      const num = typeof rawValue === "number" ? rawValue : null;
      setEditValue(num != null ? String(num) : "");
    } else {
      setEditValue(rawValue != null ? String(rawValue) : "");
    }
    setEditing(true);
  }, [rawValue, fieldType]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  async function handleSave() {
    setSaving(true);
    try {
      let parsed: string | number | boolean | null;
      if (editValue === "" || editValue === null) {
        parsed = null;
      } else if (fieldType === "number" || fieldType === "currency") {
        parsed = Number(editValue);
        if (isNaN(parsed)) parsed = null;
      } else if (fieldType === "boolean" || (fieldType === "select" && selectOptions?.some(o => o.value === "true"))) {
        parsed = editValue === "true";
      } else {
        parsed = editValue;
      }
      await onSave(parsed);
      setEditing(false);
    } catch {
      // toast handled by parent
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  if (editing) {
    return (
      <div className="flex justify-between items-center py-1.5 border-b border-border/40 gap-2">
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          {(fieldType === "select" || fieldType === "boolean") ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="h-7 rounded-md border border-border bg-background px-2 text-[13px] text-foreground outline-none focus:border-foreground transition-colors"
            >
              <option value="">—</option>
              {fieldType === "boolean" ? (
                <>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </>
              ) : (
                selectOptions?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))
              )}
            </select>
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={fieldType === "date" ? "date" : fieldType === "number" || fieldType === "currency" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className={cn(
                "h-7 w-32 rounded-md border border-border bg-background px-2 text-[13px] text-foreground text-right outline-none focus:border-foreground transition-colors",
                mono && "font-medium num font-mono"
              )}
            />
          )}
          {saving ? (
            <Loader2 size={14} className="text-muted-foreground animate-spin" />
          ) : (
            <>
              <button
                onClick={handleSave}
                className="h-6 w-6 rounded-md flex items-center justify-center bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Check size={12} strokeWidth={2} />
              </button>
              <button
                onClick={handleCancel}
                className="h-6 w-6 rounded-md flex items-center justify-center bg-muted text-muted-foreground hover:bg-accent transition-colors"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group flex justify-between items-center py-2 border-b border-border/40 cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded transition-colors"
      onClick={startEditing}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-[13px] text-right",
            danger ? "text-red-500" : "text-foreground",
            mono ? "font-medium num font-mono" : "font-normal"
          )}
        >
          {value || "—"}
        </span>
        <Pencil size={12} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
      </div>
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
        "py-2.5 mr-6 bg-transparent border-none border-b-2 text-[13px] cursor-pointer transition-all duration-150 inline-flex items-center gap-1.5 whitespace-nowrap",
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
