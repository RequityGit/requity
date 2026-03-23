"use client";

import { cn } from "@/lib/utils";
import type { StreamFilterType, StreamFilterCounts } from "./useActionCenterData";

const FILTERS: { key: StreamFilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "notes", label: "Notes" },
  { key: "emails", label: "Emails" },
  { key: "calls", label: "Calls" },
  { key: "messages", label: "Messages" },
  { key: "system", label: "System" },
];

interface StreamFiltersProps {
  active: StreamFilterType;
  counts: StreamFilterCounts;
  onChange: (filter: StreamFilterType) => void;
}

export function StreamFilters({ active, counts, onChange }: StreamFiltersProps) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium rq-transition cursor-pointer",
            active === key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
          )}
        >
          {label}
          {counts[key] > 0 && (
            <span
              className={cn(
                "num text-[10px]",
                active === key ? "text-primary-foreground/70" : "text-muted-foreground/60"
              )}
            >
              {counts[key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
