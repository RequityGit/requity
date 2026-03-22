"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, ListTodo, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCompactCurrency, formatPercent, formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { RailConditionItem } from "./RailConditionItem";
import { RailTaskItem } from "./RailTaskItem";
import type {
  DealConditionRow,
  ConditionDocument,
  DealTask,
} from "./useActionCenterData";

type RailView = "all" | "conditions" | "tasks";

interface ActionCenterRailProps {
  conditions: DealConditionRow[];
  conditionDocs: ConditionDocument[];
  tasks: DealTask[];
  loading: boolean;
  dealId: string;
  // KPI data
  loanAmount?: number | null;
  ltv?: number | null;
  closeDate?: string | null;
  // Callbacks
  onToggleTask: (taskId: string, currentStatus: string) => Promise<{ error?: string; success?: boolean }>;
  onConditionStatusChange: (conditionId: string, newStatus: string) => void;
}

export function ActionCenterRail({
  conditions,
  conditionDocs,
  tasks,
  loading,
  dealId,
  loanAmount,
  ltv,
  closeDate,
  onToggleTask,
  onConditionStatusChange,
}: ActionCenterRailProps) {
  const [view, setView] = useState<RailView>("all");

  // Progress counts
  const clearedConditions = useMemo(
    () => conditions.filter((c) => c.status === "approved" || c.status === "waived" || c.status === "not_applicable").length,
    [conditions]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks]
  );

  const showConditions = view === "all" || view === "conditions";
  const showTasks = view === "all" || view === "tasks";

  return (
    <div className="flex flex-col h-full w-[360px] shrink-0 rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold">Execution</h3>
          <span className="text-[11px] text-muted-foreground num">
            {clearedConditions + completedTasks}/{conditions.length + tasks.length}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex gap-1">
          {(["all", "conditions", "tasks"] as RailView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium rq-transition cursor-pointer border",
                view === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-transparent hover:bg-muted/50"
              )}
            >
              {v === "all" ? "All" : v === "conditions" ? "Conditions" : "Tasks"}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2.5 border-b">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-1.5">
          {showConditions && (
            <span className="num">
              Conditions: {clearedConditions}/{conditions.length}
            </span>
          )}
          {showTasks && (
            <span className="num">
              Tasks: {completedTasks}/{tasks.length}
            </span>
          )}
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 rq-transition"
            style={{
              width:
                conditions.length + tasks.length > 0
                  ? `${Math.round(((clearedConditions + completedTasks) / (conditions.length + tasks.length)) * 100)}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Conditions section */}
            {showConditions && (
              <div>
                <div className="px-4 py-2 border-b">
                  <span className="rq-micro-label">
                    Conditions ({conditions.length})
                  </span>
                </div>
                {conditions.length === 0 ? (
                  <EmptyState
                    icon={ClipboardCheck}
                    title="No conditions"
                    compact
                  />
                ) : (
                  conditions.map((c) => (
                    <RailConditionItem
                      key={c.id}
                      condition={c}
                      documents={conditionDocs}
                      dealId={dealId}
                      onStatusChange={onConditionStatusChange}
                    />
                  ))
                )}
              </div>
            )}

            {/* Tasks section */}
            {showTasks && (
              <div>
                <div className="px-4 py-2 border-b">
                  <span className="rq-micro-label">
                    Tasks ({tasks.length})
                  </span>
                </div>
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={ListTodo}
                    title="No tasks"
                    compact
                  />
                ) : (
                  tasks.map((t) => (
                    <RailTaskItem
                      key={t.id}
                      task={t}
                      onToggle={onToggleTask}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* KPI strip */}
      <div className="border-t px-4 py-2.5 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-field-label">Loan Amount</span>
            <p className="text-[13px] font-semibold num">{formatCompactCurrency(loanAmount)}</p>
          </div>
          <div className="text-center">
            <span className="inline-field-label">LTV</span>
            <p className="text-[13px] font-semibold num">{ltv ? formatPercent(ltv) : "\u2014"}</p>
          </div>
          <div className="text-right">
            <span className="inline-field-label">Close Date</span>
            <p className="text-[13px] font-semibold">{closeDate ? formatDate(closeDate) : "\u2014"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
