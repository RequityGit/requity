"use client";

import { cn } from "@/lib/utils";
import { formatFieldValue, isFieldEmpty, isFinancialFieldType } from "@/lib/format";

interface ReadValueProps {
  value: unknown;
  fieldType: string;
  onClick?: () => void;
  className?: string;
}

export function ReadValue({ value, fieldType, onClick, className }: ReadValueProps) {
  const empty = isFieldEmpty(value);
  const formatted = empty ? "" : formatFieldValue(value, fieldType);
  const isFinancial = isFinancialFieldType(fieldType);

  return (
    <div
      onClick={onClick}
      className={cn(
        "py-1.5 min-h-[32px] flex items-center transition-colors",
        onClick && "cursor-pointer border-b border-transparent hover:border-border",
        className
      )}
    >
      {empty ? (
        <span className="text-sm text-muted-foreground/60 select-none">---</span>
      ) : (
        <span
          className={cn(
            "text-sm text-foreground",
            isFinancial && "num"
          )}
        >
          {formatted}
        </span>
      )}
    </div>
  );
}
