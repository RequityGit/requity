"use client";

import { cn } from "@/lib/utils";
import { Calendar, Check, AlertTriangle } from "lucide-react";
import { PriorityDot } from "./priority-dot";
import { CategoryPill } from "./category-pill";
import type { OpsTask, Profile } from "@/lib/tasks";
import {
  getInitials,
  isDueOverdue,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from "@/lib/tasks";

interface ApprovalCardProps {
  task: OpsTask;
  profiles: Profile[];
  onClick: (task: OpsTask) => void;
}

export function ApprovalCard({ task, profiles, onClick }: ApprovalCardProps) {
  const assignee = task.assigned_to
    ? profiles.find((p) => p.id === task.assigned_to)
    : null;
  const assigneeName = assignee?.full_name || task.assigned_to_name || null;
  const overdue = isDueOverdue(task.due_date);
  const statusKey = task.approval_status ?? "pending";
  const statusColor = APPROVAL_STATUS_COLORS[statusKey] ?? APPROVAL_STATUS_COLORS.pending;
  const isAwaitingRevision = statusKey === "awaiting_revision";

  return (
    <div
      onClick={() => onClick(task)}
      className={cn(
        "bg-card rounded-lg border border-border hover:border-border/80 p-3 cursor-pointer transition-[border-color,box-shadow] hover:shadow-sm relative overflow-hidden",
        isAwaitingRevision
          ? "border-l-[3px] border-l-red-500 hover:border-l-red-400"
          : "border-l-[3px] border-l-violet-500 hover:border-l-violet-400"
      )}
    >
      <div className="min-w-0">
        {/* Rejected/awaiting_revision banner */}
        {isAwaitingRevision && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-950/30 px-2 py-1 rounded mb-2 -mx-0.5">
            <AlertTriangle className="h-3 w-3" strokeWidth={2} />
            Rejected — requires revision
          </div>
        )}

        {/* Title row */}
        <div className="flex items-start gap-1.5 mb-1.5">
          <PriorityDot priority={task.priority} className="mt-1.5" />
          <span className="text-sm font-medium leading-snug flex-1">
            {task.title}
          </span>
        </div>

        {/* Amount */}
        {task.amount != null && (
          <p
            className={cn(
              "text-[13px] font-bold num mb-1.5",
              isAwaitingRevision
                ? "text-muted-foreground line-through"
                : "text-violet-600 dark:text-violet-400"
            )}
          >
            ${Number(task.amount).toLocaleString()}
          </p>
        )}

        {/* Tags row: Approval badge + category */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            Approval
          </span>
          <CategoryPill category={task.category} />
        </div>

        {/* Footer: due, requestor, assignee, status pill */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Status pill */}
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
              statusColor.bg,
              statusColor.text
            )}
          >
            {APPROVAL_STATUS_LABELS[statusKey] ?? statusKey}
          </span>
          <div className="flex-1" />
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] num",
                overdue
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" strokeWidth={1.5} />
              {new Date(task.due_date + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              )}
            </span>
          )}
          {assigneeName && (
            <div className="w-[22px] h-[22px] rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground flex-shrink-0">
              {getInitials(assigneeName)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
