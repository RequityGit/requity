"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { STAGES, type UnifiedStage } from "./pipeline-types";

interface StageStepperProps {
  currentStage: UnifiedStage;
  compact?: boolean;
  interactive?: boolean;
  loading?: boolean;
  onStageDoubleClick?: (stage: UnifiedStage) => void;
}

export function StageStepper({
  currentStage,
  compact,
  interactive,
  loading,
  onStageDoubleClick,
}: StageStepperProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  const handleDoubleClick = (stage: UnifiedStage) => {
    if (!interactive || loading || stage === currentStage) return;
    onStageDoubleClick?.(stage);
  };

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isClickable = interactive && !loading && !isCurrent;

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-3",
                  isComplete ? "bg-[#1B7A44]" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center justify-center rounded-full text-[10px] font-medium select-none",
                compact ? "h-5 w-5" : "h-6 w-6",
                isComplete && "bg-[#1B7A44] text-white",
                isCurrent && "bg-foreground text-background",
                !isComplete && !isCurrent && "bg-muted text-muted-foreground",
                isClickable &&
                  "cursor-pointer transition-opacity hover:opacity-70",
                loading && "opacity-50"
              )}
              title={stage.label}
              onDoubleClick={() => handleDoubleClick(stage.key)}
            >
              {loading && isCurrent ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                i + 1
              )}
            </div>
            {!compact && (
              <span
                className={cn(
                  "text-xs whitespace-nowrap select-none",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                  isClickable &&
                    "cursor-pointer transition-opacity hover:opacity-70"
                )}
                onDoubleClick={() => handleDoubleClick(stage.key)}
              >
                {stage.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
