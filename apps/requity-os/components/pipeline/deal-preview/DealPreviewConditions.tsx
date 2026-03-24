"use client";

import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState, useCallback, useRef, useMemo } from "react";
import type { DealCondition } from "../pipeline-types";

// ─── Constants ───

type FilterKey = "all" | "submitted" | "rejected" | "pending" | "approved";

const FILTER_ORDER: FilterKey[] = ["all", "submitted", "rejected", "pending", "approved"];

const STATUS_COLORS: Record<string, { dot: string; pillBg: string; pillFg: string }> = {
  submitted:      { dot: "bg-blue-500",    pillBg: "bg-blue-100 dark:bg-blue-900/40",    pillFg: "text-blue-700 dark:text-blue-300" },
  approved:       { dot: "bg-emerald-500", pillBg: "bg-emerald-100 dark:bg-emerald-900/40", pillFg: "text-emerald-700 dark:text-emerald-300" },
  rejected:       { dot: "bg-red-500",     pillBg: "bg-red-100 dark:bg-red-900/40",      pillFg: "text-red-700 dark:text-red-300" },
  pending:        { dot: "bg-muted-foreground/30", pillBg: "bg-muted",                   pillFg: "text-muted-foreground" },
  waived:         { dot: "bg-amber-500",   pillBg: "bg-amber-100 dark:bg-amber-900/40",  pillFg: "text-amber-700 dark:text-amber-300" },
  under_review:   { dot: "bg-blue-400",    pillBg: "bg-blue-100 dark:bg-blue-900/40",    pillFg: "text-blue-700 dark:text-blue-300" },
  not_applicable: { dot: "bg-muted-foreground/30", pillBg: "bg-muted",                   pillFg: "text-muted-foreground" },
};

function getStatusColors(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.pending;
}

// ─── Component ───

interface DealPreviewConditionsProps {
  conditions: DealCondition[];
  dealStage: string;
  onAddCondition: (name: string) => Promise<void>;
  conditionFormRef?: React.RefObject<HTMLInputElement | null>;
}

export function DealPreviewConditions({
  conditions,
  dealStage,
  onAddCondition,
  conditionFormRef,
}: DealPreviewConditionsProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCondName, setNewCondName] = useState("");
  const [adding, setAdding] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = conditionFormRef ?? localRef;

  // Counts
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: conditions.length, submitted: 0, rejected: 0, pending: 0, approved: 0 };
    for (const cond of conditions) {
      if (cond.status === "submitted" || cond.status === "under_review") c.submitted++;
      else if (cond.status === "approved" || cond.status === "waived") c.approved++;
      else if (cond.status === "rejected") c.rejected++;
      else c.pending++;
    }
    return c;
  }, [conditions]);

  // Filtered list
  const filtered = useMemo(() => {
    if (filter === "all") return conditions;
    if (filter === "submitted") return conditions.filter((c) => c.status === "submitted" || c.status === "under_review");
    if (filter === "approved") return conditions.filter((c) => c.status === "approved" || c.status === "waived");
    if (filter === "rejected") return conditions.filter((c) => c.status === "rejected");
    return conditions.filter((c) => c.status === "pending" || c.status === "not_applicable");
  }, [conditions, filter]);

  // Progress
  const completed = counts.submitted + counts.approved;
  const progressPct = conditions.length > 0 ? (completed / conditions.length) * 100 : 0;

  const handleAdd = useCallback(async () => {
    const name = newCondName.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await onAddCondition(name);
      setNewCondName("");
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  }, [newCondName, adding, onAddCondition]);

  const toggleForm = useCallback(() => {
    setShowAddForm((v) => !v);
    if (!showAddForm) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showAddForm, inputRef]);

  return (
    <div className="flex w-[310px] shrink-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border/50 px-3.5 py-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-foreground">Conditions</span>
            <span className="num text-[11px] font-semibold text-muted-foreground">
              {completed}/{conditions.length}
            </span>
          </div>
          <button
            onClick={toggleForm}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground rq-transition hover:bg-accent"
          >
            <Plus className="h-3 w-3" /> Add <Kbd>C</Kbd>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 rq-transition-transform"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-1">
          {FILTER_ORDER.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold capitalize rq-transition",
                filter === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Add condition form */}
      {showAddForm && (
        <div className="shrink-0 border-b border-border/50 bg-muted/30 px-3.5 py-2">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={newCondName}
            onChange={(e) => setNewCondName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setShowAddForm(false);
            }}
            placeholder="Condition name..."
            className="mb-1.5 w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
          />
          <div className="flex gap-1">
            <button
              onClick={handleAdd}
              disabled={!newCondName.trim() || adding}
              className="flex-1 rounded-[5px] bg-foreground py-1 text-[10px] font-medium text-background disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-[5px] border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Conditions list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-6 text-center text-[11px] text-muted-foreground">
            No conditions match filter
          </div>
        )}
        {filtered.map((cond) => {
          const colors = getStatusColors(cond.status);
          const docCount = cond.document_urls?.length ?? 0;
          return (
            <div
              key={cond.id}
              className="flex items-center justify-between border-b border-border/20 px-3.5 py-[7px] rq-transition hover:bg-muted/30"
            >
              <div className="flex min-w-0 flex-1 items-center gap-[7px]">
                <span className={cn("h-[7px] w-[7px] shrink-0 rounded-full", colors.dot)} />
                <span className="truncate text-[11px] text-foreground">{cond.condition_name}</span>
              </div>
              <div className="ml-1.5 flex shrink-0 items-center gap-1.5">
                {docCount > 0 && (
                  <span className="num text-[9px] text-muted-foreground">
                    {docCount} doc{docCount > 1 ? "s" : ""}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                    colors.pillBg,
                    colors.pillFg
                  )}
                >
                  {cond.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="ml-0.5 rounded border border-border bg-background px-1 py-px text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
