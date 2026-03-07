"use client";

import type { NoteFilter, NoteData } from "./types";

interface NoteFiltersProps {
  filter: NoteFilter;
  onFilterChange: (filter: NoteFilter) => void;
  notes: NoteData[];
}

export function NoteFilters({ filter, onFilterChange, notes }: NoteFiltersProps) {
  const internalCount = notes.filter((n) => n.is_internal).length;
  const externalCount = notes.filter((n) => !n.is_internal).length;

  const options: { value: NoteFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: notes.length },
    { value: "internal", label: "Internal Only", count: internalCount },
    { value: "external", label: "External Only", count: externalCount },
  ];

  return (
    <div className="flex gap-1.5">
      {options.map(({ value, label, count }) => (
        <button
          key={value}
          type="button"
          onClick={() => onFilterChange(value)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            filter === value
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
          <span
            className={`text-[10px] font-semibold rounded-md px-1 py-px num ${
              filter === value
                ? "bg-background/20 text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
