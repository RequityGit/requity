"use client";

import { cn } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type IntakeFieldDef,
  type FieldChoice,
  isEmpty,
  valsMatch,
} from "@/lib/intake/types";

interface FieldMergeRowProps {
  fieldDef: IntakeFieldDef;
  incomingVal: unknown;
  existingVal: unknown;
  choice: FieldChoice | undefined;
  onChoice: (val: FieldChoice) => void;
}

function displayVal(v: unknown, format?: string): string {
  if (isEmpty(v)) return "--";
  if (format === "currency") {
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }
  if (format === "percent") {
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return `${(n * 100).toFixed(2)}%`;
  }
  return String(v);
}

export function FieldMergeRow({
  fieldDef,
  incomingVal,
  existingVal,
  choice,
  onChoice,
}: FieldMergeRowProps) {
  const incDisplay = displayVal(incomingVal, fieldDef.format);
  const extDisplay = displayVal(existingVal, fieldDef.format);
  const incEmpty = isEmpty(incomingVal);
  const extEmpty = isEmpty(existingVal);
  const match = valsMatch(incomingVal, existingVal);
  const bothEmpty = incEmpty && extEmpty;
  const isConflict = !incEmpty && !extEmpty && !match;
  const supportsBoth = fieldDef.keepBoth && isConflict;

  // Auto-resolve logic
  const effectiveChoice = (() => {
    if (bothEmpty) return "existing";
    if (match) return "existing";
    if (incEmpty && !extEmpty) return "existing";
    if (extEmpty && !incEmpty) return "incoming";
    return choice;
  })();

  const autoResolved = match || (!isConflict && !bothEmpty);
  const activeChoice = autoResolved ? effectiveChoice : choice || null;

  // Hide rows where neither side has data
  if (bothEmpty) return null;

  return (
    <div
      className={cn(
        "grid items-center gap-2 py-1.5 border-b border-border/30",
        "[grid-template-columns:100px_1fr_28px_1fr]"
      )}
    >
      {/* Label */}
      <div
        className={cn(
          "text-[10px] flex items-center gap-1",
          isConflict && !choice
            ? "text-amber-600 font-semibold"
            : "text-muted-foreground"
        )}
      >
        {isConflict && !choice && (
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
        )}
        {fieldDef.label}
      </div>

      {/* Existing value */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!isConflict}
        onClick={() => isConflict && onChoice("existing")}
        className={cn(
          "h-auto py-1 px-2 text-[10px] font-medium justify-center truncate",
          activeChoice === "existing"
            ? "bg-primary/10 text-primary border border-primary/30"
            : "text-muted-foreground",
          !isConflict && "opacity-60 cursor-default"
        )}
      >
        {extEmpty ? "--" : extDisplay}
      </Button>

      {/* Center: Both button or separator */}
      {supportsBoth ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChoice("both")}
          title="Keep both values"
          className={cn(
            "h-7 w-7 p-0",
            activeChoice === "both"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "text-muted-foreground"
          )}
        >
          <ArrowLeftRight className="h-3 w-3" />
        </Button>
      ) : (
        <div className="text-center text-[10px] text-muted-foreground/40">
          {isConflict ? "or" : match ? "=" : "\u2192"}
        </div>
      )}

      {/* Incoming value */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={!isConflict}
        onClick={() => isConflict && onChoice("incoming")}
        className={cn(
          "h-auto py-1 px-2 text-[10px] font-medium justify-center truncate",
          activeChoice === "incoming"
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
            : "text-muted-foreground",
          !isConflict && "opacity-60 cursor-default"
        )}
      >
        {incEmpty ? "--" : incDisplay}
      </Button>
    </div>
  );
}
