"use client";

import { cn } from "@/lib/utils";
import type { ActivityCounts } from "@/hooks/useActivityFeed";

export type ActivityFilter = "all" | "notes" | "conditions" | "messages";

interface ActivityFiltersProps {
  active: ActivityFilter;
  onChange: (filter: ActivityFilter) => void;
  counts: ActivityCounts;
}

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "conditions", label: "Conditions" },
  { key: "messages", label: "Messages" },
];

export function ActivityFilters({ active, onChange, counts }: ActivityFiltersProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b flex-shrink-0">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "px-2.5 py-1 rounded-md text-[11px] font-medium rq-transition cursor-pointer",
            active === f.key
              ? "bg-foreground/[0.06] text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          {f.label}
          <span className="ml-1 text-muted-foreground/60 text-[10px]">
            {counts[f.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
