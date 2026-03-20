import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WorkflowStageTrackerStage {
  id: string;
  name: string;
  position: number;
  is_terminal: boolean | null;
  borrower_label: string | null;
}

interface WorkflowStageTrackerProps {
  stages: WorkflowStageTrackerStage[];
  currentStageId: string | null;
}

export function WorkflowStageTracker({
  stages,
  currentStageId,
}: WorkflowStageTrackerProps) {
  const sorted = [...stages].sort((a, b) => a.position - b.position);
  const currentIndex = sorted.findIndex((s) => s.id === currentStageId);
  const currentStage = sorted[currentIndex];
  const isTerminalReached = currentStage?.is_terminal ?? false;

  return (
    <div className="w-full">
      {/* Desktop: horizontal stepper */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex items-center min-w-[700px] px-4 py-2">
          {sorted.map((stage, idx) => {
            const isPast = isTerminalReached || idx < currentIndex;
            const isCurrent = !isTerminalReached && idx === currentIndex;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                      isPast && "bg-green-600 border-green-600 text-white",
                      isCurrent && "bg-primary border-primary text-white",
                      !isPast &&
                        !isCurrent &&
                        "bg-background border-border text-muted-foreground"
                    )}
                  >
                    {isPast ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 text-center leading-tight max-w-[100px]",
                      isCurrent
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {stage.name}
                  </span>
                </div>
                {idx < sorted.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-1",
                      isPast ? "bg-green-600" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical stepper */}
      <div className="md:hidden px-2 py-1">
        <div className="space-y-0">
          {sorted.map((stage, idx) => {
            const isPast = isTerminalReached || idx < currentIndex;
            const isCurrent = !isTerminalReached && idx === currentIndex;

            return (
              <div key={stage.id}>
                <div className="flex items-center gap-3 py-1.5">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 transition-colors flex-shrink-0",
                      isPast && "bg-green-600 border-green-600 text-white",
                      isCurrent && "bg-primary border-primary text-white",
                      !isPast &&
                        !isCurrent &&
                        "bg-background border-border text-muted-foreground"
                    )}
                  >
                    {isPast ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      isCurrent
                        ? "font-semibold text-foreground"
                        : isPast
                          ? "text-foreground"
                          : "text-muted-foreground"
                    )}
                  >
                    {stage.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-primary font-medium ml-auto">
                      In Progress
                    </span>
                  )}
                  {isPast && (
                    <Check className="h-3.5 w-3.5 text-green-600 ml-auto" />
                  )}
                </div>
                {idx < sorted.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-3 ml-[13px]",
                      isPast ? "bg-green-600" : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Borrower-friendly message for current stage */}
      {currentStage?.borrower_label && (
        <div className="text-center mt-2">
          <span className="text-[13px] font-medium text-muted-foreground">
            {currentStage.borrower_label}
          </span>
        </div>
      )}
    </div>
  );
}
