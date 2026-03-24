"use client";

import { cn } from "@/lib/utils";

export type NotificationFilter =
  | "all"
  | "mentions"
  | "threads"
  | "reactions"
  | "assigned";

const FILTER_LABELS: Record<NotificationFilter, string> = {
  all: "All",
  mentions: "Mentions",
  threads: "Threads",
  reactions: "Reactions",
  assigned: "Assigned",
};

export const FILTER_SLUG_MAP: Record<NotificationFilter, string[]> = {
  all: [],
  mentions: ["note_mention"],
  threads: ["note_reply", "thread_reply"],
  reactions: ["note_like", "note_reaction"],
  assigned: ["task_assigned", "task_due_reminder", "approval_requested"],
};

interface NotificationFilterTabsProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  counts: Record<NotificationFilter, number>;
}

export function NotificationFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: NotificationFilterTabsProps) {
  return (
    <div className="flex items-center gap-0.5 px-3.5 py-2 border-b border-border overflow-x-auto">
      {(Object.keys(FILTER_LABELS) as NotificationFilter[]).map((filter) => {
        const isActive = activeFilter === filter;
        const count = counts[filter];
        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap rq-transition",
              isActive
                ? "text-foreground bg-foreground/[0.06] font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
            )}
          >
            {FILTER_LABELS[filter]}
            {count > 0 && (
              <span
                className={cn(
                  "text-[9px] font-semibold min-w-[14px] h-[14px] inline-flex items-center justify-center rounded-full px-1",
                  isActive
                    ? "bg-red-500/10 text-red-500"
                    : "text-muted-foreground/60"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
