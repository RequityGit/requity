"use client";

import { cn } from "@/lib/utils";

interface SOPFilterChipsProps {
  departments: string[];
  activeDepartment: string;
  onSelect: (dept: string) => void;
}

export function SOPFilterChips({
  departments,
  activeDepartment,
  onSelect,
}: SOPFilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect("")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
          !activeDepartment
            ? "border-primary bg-accent text-primary"
            : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        All
      </button>
      {departments.map((dept) => (
        <button
          key={dept}
          onClick={() => onSelect(dept)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            activeDepartment === dept
              ? "border-primary bg-accent text-primary"
              : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          {dept}
        </button>
      ))}
    </div>
  );
}
