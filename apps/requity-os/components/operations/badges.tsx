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
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {priority}
    </Badge>
  );
}

// --- Status Badge ---
// Map legacy lowercase DB values to canonical display labels
const statusDisplayMap: Record<string, string> = {
  "not started": "Not Started",
  not_started: "Not Started",
  planning: "Planning",
  "in progress": "In Progress",
  in_progress: "In Progress",
  active: "In Progress",
  blocked: "Blocked",
  on_hold: "On Hold",
  "on hold": "On Hold",
  complete: "Complete",
  completed: "Complete",
  cancelled: "Complete",
};

const statusConfig: Record<string, { className: string }> = {
  // Project statuses
  "Not Started": { className: "bg-muted text-muted-foreground border-border" },
  Planning: { className: "bg-purple-100 text-purple-800 border-purple-200" },
  "In Progress": { className: "bg-blue-100 text-blue-800 border-blue-200" },
  Blocked: { className: "bg-red-100 text-red-800 border-red-200" },
  "On Hold": { className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  Complete: { className: "bg-green-100 text-green-800 border-green-200" },
  // Task statuses
  "To Do": { className: "bg-muted text-muted-foreground border-border" },
  "In Review": { className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

export function normalizeStatusDisplay(status: string): string {
  return statusDisplayMap[status] ?? status;
}

export function OpsStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const display = normalizeStatusDisplay(status);
  const config = statusConfig[display] ?? {
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {display}
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
const simplePatternLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

const ordinals = ["", "1st", "2nd", "3rd", "4th"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthAbbr = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function ordinalSuffix(n: number): string {
  if (n === 1 || n === 21 || n === 31) return "st";
  if (n === 2 || n === 22) return "nd";
  if (n === 3 || n === 23) return "rd";
  return "th";
}

function getPatternLabel(pattern: string): string {
  // Simple patterns
  if (simplePatternLabels[pattern]) return simplePatternLabels[pattern];

  // monthly_day:DD  →  "15th of month"
  if (pattern.startsWith("monthly_day:")) {
    const day = parseInt(pattern.split(":")[1], 10);
    return `${day}${ordinalSuffix(day)} of month`;
  }

  // monthly_nth:N:DOW  →  "1st Mon of month" or "Last Fri of month"
  if (pattern.startsWith("monthly_nth:")) {
    const parts = pattern.split(":");
    const nth = parseInt(parts[1], 10);
    const dow = parseInt(parts[2], 10);
    const dayName = dayNames[dow] ?? "?";
    const nthLabel = nth === -1 ? "Last" : (ordinals[nth] ?? `${nth}th`);
    return `${nthLabel} ${dayName} of month`;
  }

  // annually_date:MM:DD  →  "Mar 15"
  if (pattern.startsWith("annually_date:")) {
    const parts = pattern.split(":");
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${monthAbbr[month] ?? "?"} ${day}`;
  }

  return pattern;
}

export function RecurringBadge({
  pattern,
  isActive = true,
}: {
  pattern: string | null;
  isActive?: boolean;
}) {
  if (!pattern) return null;
  const label = getPatternLabel(pattern);
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        isActive
          ? "bg-purple-100 text-purple-800 border-purple-200"
          : "bg-muted text-muted-foreground border-border line-through"
      )}
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
