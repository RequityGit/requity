"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/tasks";

interface CategoryPillProps {
  category: string | null;
  className?: string;
}

export function CategoryPill({ category, className }: CategoryPillProps) {
  if (!category) return null;
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        colors.bg,
        colors.text,
        className
      )}
    >
      {category}
    </span>
  );
}
