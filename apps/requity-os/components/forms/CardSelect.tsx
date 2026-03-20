"use client";

import { useCallback } from "react";
import * as LucideIcons from "lucide-react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormFieldOption } from "@/lib/form-engine/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLucideIcon(name: string): any {
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (typeof icon === "function" || (typeof icon === "object" && icon !== null)) {
    return icon;
  }
  return FileText;
}

interface CardSelectProps {
  options: FormFieldOption[];
  value: string | null;
  onChange: (value: string) => void;
  autoAdvance?: boolean;
}

export function CardSelect({ options, value, onChange, autoAdvance = true }: CardSelectProps) {
  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
    },
    [onChange]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = value === option.value;
        const IconComponent = getLucideIcon(option.icon || "FileText");

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "relative flex items-center gap-4 rounded-lg border p-4 text-left transition-all duration-150",
              isSelected
                ? "border-foreground border-2 bg-muted scale-[1.01]"
                : "border-border hover:border-foreground/30 hover:bg-accent/50"
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
              <IconComponent size={24} strokeWidth={1.5} className="text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-foreground">{option.label}</p>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              )}
            </div>
            <div
              className={cn(
                "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-foreground bg-foreground"
                  : "border-border"
              )}
            >
              {isSelected && (
                <div className="h-2 w-2 rounded-full bg-background" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
