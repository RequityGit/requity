"use client";

import { Info } from "lucide-react";

interface ConditionInstructionsProps {
  internalDescription: string | null;
  borrowerDescription: string | null;
}

export function ConditionInstructions({
  internalDescription,
  borrowerDescription,
}: ConditionInstructionsProps) {
  if (!internalDescription && !borrowerDescription) {
    return (
      <div className="border-b p-4">
        <div className="rq-micro-label mb-2">Instructions</div>
        <p className="text-xs text-muted-foreground italic">
          No instructions set for this condition.
        </p>
      </div>
    );
  }

  return (
    <div className="border-b p-4 space-y-3">
      <div className="rq-micro-label">Instructions</div>

      {internalDescription && (
        <div className="rounded-lg bg-muted/30 border p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Info className="h-3 w-3" />
            What to Look For
          </div>
          <p className="text-[12.5px] text-foreground/80 leading-relaxed">
            {internalDescription}
          </p>
        </div>
      )}

      {borrowerDescription && (
        <div
          className="rounded-lg border p-3 space-y-1.5"
          style={{
            background: "hsl(var(--chart-4) / 0.06)",
            borderColor: "hsl(var(--chart-4) / 0.15)",
          }}
        >
          <div
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "hsl(var(--chart-4))" }}
          >
            Borrower Sees
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {borrowerDescription}
          </p>
        </div>
      )}
    </div>
  );
}
