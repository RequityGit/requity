"use client";

import { useState } from "react";
import {
  CheckSquare,
  Square,
  Paperclip,
  Upload,
  Eye,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  T,
  DotPill,
  OutlinePill,
  Btn,
  cap,
  fD,
  type ConditionData,
} from "../components";

interface ConditionsTabProps {
  conditions: ConditionData[];
}

const STATUS_COLORS: Record<string, string> = {
  cleared: "#22c55e",
  approved: "#22c55e",
  waived: "#71717a",
  received: "#3b82f6",
  submitted: "#3b82f6",
  under_review: "#3b82f6",
  ordered: "#3b82f6",
  pending: "#71717a",
  rejected: "#ef4444",
};

export function ConditionsTab({ conditions }: ConditionsTabProps) {
  const [filter, setFilter] = useState("all");
  const [cpOnly, setCpOnly] = useState(false);

  const filtered = conditions.filter((c) => {
    if (filter !== "all" && c.category !== filter) return false;
    if (cpOnly && !c.critical_path) return false;
    return true;
  });

  const cleared = conditions.filter(
    (c) => c.status === "cleared" || c.status === "approved" || c.status === "waived"
  ).length;
  const total = conditions.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div
        className="rounded-xl px-5 py-4"
        style={{ backgroundColor: T.bg.surface, border: `1px solid ${T.bg.border}` }}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold num" style={{ color: T.text.primary }}>
            {cleared} of {total} cleared ({pct}%)
          </span>
          <Btn label="Add Condition" icon={Plus} small />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: T.bg.elevated }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: pct + "%", background: T.accent.green }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "ptf", "ptc", "ptd", "post_closing"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="cursor-pointer rounded-lg border px-3.5 py-1 text-xs font-medium"
            style={{
              color: filter === f ? "#FFF" : T.text.muted,
              background: filter === f ? T.accent.blue : T.bg.surface,
              borderColor: filter === f ? T.accent.blue : T.bg.border,
            }}
          >
            {f === "all" ? "All" : f.toUpperCase().replace("_", " ")}
          </button>
        ))}
        <div
          className="ml-2 flex cursor-pointer items-center gap-1.5"
          onClick={() => setCpOnly(!cpOnly)}
        >
          <div
            className="flex h-4 w-4 items-center justify-center rounded"
            style={{
              border: `1.5px solid ${cpOnly ? T.accent.blue : T.bg.border}`,
              background: cpOnly ? T.accent.blue : "transparent",
            }}
          >
            {cpOnly && <CheckCircle2 size={10} color="#FFF" />}
          </div>
          <span className="text-xs" style={{ color: T.text.muted }}>
            Critical Path
          </span>
        </div>
      </div>

      {/* Condition cards */}
      {filtered.length === 0 && (
        <div
          className="rounded-xl px-5 py-8 text-center text-sm"
          style={{ backgroundColor: T.bg.surface, border: `1px solid ${T.bg.border}`, color: T.text.muted }}
        >
          No conditions match the current filter.
        </div>
      )}
      {filtered.map((c) => {
        const isCleared = c.status === "cleared" || c.status === "approved" || c.status === "waived";
        const isOverdue = !isCleared && c.due_date && new Date(c.due_date) < new Date();

        return (
          <div
            key={c.id}
            className="flex items-center gap-3.5 rounded-xl px-5 py-3.5"
            style={{ backgroundColor: T.bg.surface, border: `1px solid ${T.bg.border}` }}
          >
            <div className="shrink-0">
              {isCleared ? (
                <CheckSquare size={18} color={T.accent.green} strokeWidth={1.5} />
              ) : (
                <Square size={18} color={T.bg.border} strokeWidth={1.5} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm font-medium"
                  style={{
                    textDecoration: isCleared ? "line-through" : "none",
                    opacity: isCleared ? 0.6 : 1,
                    color: T.text.primary,
                  }}
                >
                  {c.name}
                </span>
                {c.category && <OutlinePill label={c.category.toUpperCase()} />}
                <DotPill label={cap(c.status)} color={STATUS_COLORS[c.status] || T.text.muted} />
                {c.critical_path && <DotPill label="Critical" color={T.accent.red} />}
              </div>
              <div className="mt-1.5 flex gap-4 text-xs" style={{ color: T.text.muted }}>
                {c._assigned_name && <span>{c._assigned_name}</span>}
                {c.due_date && (
                  <span
                    style={{
                      color: isOverdue ? T.accent.red : T.text.muted,
                      fontWeight: isOverdue ? 600 : 400,
                    }}
                    className="num"
                  >
                    Due: {fD(c.due_date)}
                    {isOverdue ? " (OVERDUE)" : ""}
                  </span>
                )}
                {(c._doc_count ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 num">
                    <Paperclip size={11} strokeWidth={1.5} /> {c._doc_count}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Btn label="Upload" icon={Upload} small />
              <Btn label="Review" icon={Eye} small />
            </div>
          </div>
        );
      })}
    </div>
  );
}
