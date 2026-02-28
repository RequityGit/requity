"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Priority Badge ---
const priorityConfig: Record<string, { className: string }> = {
  Critical: { className: "bg-red-100 text-red-800 border-red-200" },
  High: { className: "bg-orange-100 text-orange-800 border-orange-200" },
  Medium: { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Low: { className: "bg-green-100 text-green-800 border-green-200" },
};

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  const config = priorityConfig[priority] ?? {
    className: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {priority}
    </Badge>
  );
}

// --- Status Badge ---
const statusConfig: Record<string, { className: string }> = {
  "To Do": { className: "bg-slate-100 text-slate-800 border-slate-200" },
  "In Progress": { className: "bg-blue-100 text-blue-800 border-blue-200" },
  "In Review": { className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  Blocked: { className: "bg-red-100 text-red-800 border-red-200" },
  Complete: { className: "bg-green-100 text-green-800 border-green-200" },
  Active: { className: "bg-blue-100 text-blue-800 border-blue-200" },
  "On Hold": { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Planning: { className: "bg-purple-100 text-purple-800 border-purple-200" },
  Completed: { className: "bg-green-100 text-green-800 border-green-200" },
  Cancelled: { className: "bg-gray-100 text-gray-800 border-gray-200" },
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const config = statusConfig[status] ?? {
    className: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {status}
    </Badge>
  );
}

// --- Owner Badge ---
export function OwnerBadge({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <Badge
      variant="outline"
      className="text-xs bg-teal-50 text-teal-800 border-teal-200"
    >
      {name}
    </Badge>
  );
}

// --- Recurring Badge ---
const patternLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

export function RecurringBadge({
  pattern,
}: {
  pattern: string | null;
}) {
  if (!pattern) return null;
  const label = patternLabels[pattern] ?? pattern;
  return (
    <Badge
      variant="outline"
      className="text-xs bg-purple-100 text-purple-800 border-purple-200"
    >
      ↻ {label}
    </Badge>
  );
}

// --- Due Date Label ---
export function DueDateLabel({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return <span className="text-muted-foreground text-sm">—</span>;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let label: string;
  let colorClass: string;

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    label = absDays === 1 ? "1d overdue" : `${absDays}d overdue`;
    colorClass = "text-red-600 font-medium";
  } else if (diffDays === 0) {
    label = "Today";
    colorClass = "text-amber-600 font-medium";
  } else if (diffDays === 1) {
    label = "Tomorrow";
    colorClass = "text-amber-600 font-medium";
  } else if (diffDays <= 7) {
    label = `${diffDays}d`;
    colorClass = "text-amber-600";
  } else {
    label = due.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    colorClass = "text-muted-foreground";
  }

  return <span className={cn("text-sm", colorClass)}>{label}</span>;
}
