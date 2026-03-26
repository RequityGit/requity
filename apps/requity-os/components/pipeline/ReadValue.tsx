"use client";

import { cn } from "@/lib/utils";
import { formatFieldValue, isFieldEmpty, isFinancialFieldType } from "@/lib/format";

interface ReadValueProps {
  value: unknown;
  fieldType: string;
  onClick?: () => void;
  className?: string;
  /** Placeholder shown when value is empty. Defaults to field-type-appropriate text. */
  placeholder?: string;
}

export function ReadValue({ value, fieldType, onClick, className, placeholder }: ReadValueProps) {
  const empty = isFieldEmpty(value);
  const formatted = empty ? "" : formatFieldValue(value, fieldType);
  const isFinancial = isFinancialFieldType(fieldType);

  // Field-type-aware placeholder — show dash for numeric types (0 is not real data)
  const emptyText = placeholder ?? "Add...";

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
        "border border-transparent",
        onClick && "hover:border-border hover:bg-muted/40 cursor-pointer",
        className
      )}
    >
      {empty ? (
        <span className="text-sm text-muted-foreground/40 select-none truncate">
          {emptyText}
        </span>
      ) : (
        <span
          className={cn(
            "text-sm text-foreground truncate",
            isFinancial && "num tabular-nums"
          )}
        >
          {formatted}
        </span>
      )}
    </div>
  );
}
