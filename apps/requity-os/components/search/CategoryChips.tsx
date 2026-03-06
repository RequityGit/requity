"use client";

import { cn } from "@/lib/utils";
import { type CategoryChip } from "@/lib/search-utils";

interface CategoryChipsProps {
  categories: CategoryChip[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  resultCounts?: Record<string, number>;
}

export function CategoryChips({
  categories,
  activeFilter,
  onFilterChange,
  resultCounts,
}: CategoryChipsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
      {categories.map((category) => {
        const isActive = activeFilter === category.key;
        const count = category.key
          ? resultCounts?.[category.key] ?? 0
          : undefined;

        return (
          <button
            key={category.key ?? "all"}
            type="button"
            onClick={() => onFilterChange(category.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {category.label}
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "text-[10px]",
                  isActive ? "text-blue-200" : "text-muted-foreground"
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
