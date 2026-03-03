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
  DotPill,
  OutlinePill,
  Btn,
  cap,
  fD,
  T,
  type ConditionData,
} from "../components";

interface ConditionsTabProps {
  conditions: ConditionData[];
}

const STATUS_COLORS: Record<string, string> = {
  cleared: "#22A861",
  approved: "#22A861",
  waived: "#8B8B8B",
  received: "#3B82F6",
  submitted: "#3B82F6",
  under_review: "#3B82F6",
  ordered: "#3B82F6",
  pending: "#8B8B8B",
  rejected: "#E5453D",
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
      <div className="rounded-xl border border-[#E5E5E7] bg-white px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1A1A1A] font-sans">
            {cleared} of {total} cleared ({pct}%)
          </span>
          <Btn label="Add Condition" icon={Plus} small />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#F0F0F2]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: pct + "%",
              background: T.ok,
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {["all", "ptf", "ptc", "ptd", "post_closing"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="cursor-pointer rounded-lg border px-3.5 py-1 text-xs font-medium font-sans"
            style={{
              color: filter === f ? "#FFF" : "#6B6B6B",
              background: filter === f ? "#1A1A1A" : "#FFF",
              borderColor: filter === f ? "#1A1A1A" : "#E5E5E7",
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
              border: `1.5px solid ${cpOnly ? "#1A1A1A" : "#E5E5E7"}`,
              background: cpOnly ? "#1A1A1A" : "transparent",
            }}
          >
            {cpOnly && <CheckCircle2 size={10} color="#FFF" />}
          </div>
          <span className="text-xs text-[#6B6B6B] font-sans">
            Critical Path
          </span>
        </div>
      </div>

      {/* Condition cards */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-[#E5E5E7] bg-white px-5 py-8 text-center text-sm text-[#8B8B8B] font-sans">
          No conditions match the current filter.
        </div>
      )}
      {filtered.map((c) => {
        const isCleared =
          c.status === "cleared" ||
          c.status === "approved" ||
          c.status === "waived";
        const isOverdue =
          !isCleared &&
          c.due_date &&
          new Date(c.due_date) < new Date();

        return (
          <div
            key={c.id}
            className="flex items-center gap-3.5 rounded-xl border border-[#E5E5E7] bg-white px-5 py-3.5"
          >
            <div className="shrink-0">
              {isCleared ? (
                <CheckSquare size={18} color={T.ok} />
              ) : (
                <Square size={18} color="#E5E5E7" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm font-medium font-sans"
                  style={{
                    textDecoration: isCleared ? "line-through" : "none",
                    opacity: isCleared ? 0.6 : 1,
                    color: "#1A1A1A",
                  }}
                >
                  {c.name}
                </span>
                {c.category && (
                  <OutlinePill label={c.category.toUpperCase()} />
                )}
                <DotPill
                  label={cap(c.status)}
                  color={STATUS_COLORS[c.status] || "#8B8B8B"}
                />
                {c.critical_path && (
                  <DotPill label="Critical" color={T.bad} />
                )}
              </div>
              <div className="mt-1.5 flex gap-4 text-xs text-[#8B8B8B] font-sans">
                {c._assigned_name && <span>{c._assigned_name}</span>}
                {c.due_date && (
                  <span
                    style={{
                      color: isOverdue ? T.bad : "#8B8B8B",
                      fontWeight: isOverdue ? 600 : 400,
                    }}
                  >
                    Due: {fD(c.due_date)}
                    {isOverdue ? " (OVERDUE)" : ""}
                  </span>
                )}
                {(c._doc_count ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Paperclip size={11} /> {c._doc_count}
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
