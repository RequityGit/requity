import { cn } from "@/lib/utils";
import { PIPELINE_STAGES, LOAN_STAGE_LABELS, LoanStage } from "@/lib/constants";
import { Check } from "lucide-react";

interface LoanStageTrackerProps {
  currentStage: string;
}

export function LoanStageTracker({ currentStage }: LoanStageTrackerProps) {
  const currentIndex = (PIPELINE_STAGES as readonly string[]).indexOf(
    currentStage
  );
  // If stage is a terminal stage (servicing, payoff, etc.), show all pipeline stages as completed
  const isTerminalStage = currentIndex === -1;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-[700px] px-4 py-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isPast = isTerminalStage || idx < currentIndex;
          const isCurrent = !isTerminalStage && idx === currentIndex;

          return (
            <div key={stage} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                    isPast && "bg-green-600 border-green-600 text-white",
                    isCurrent && "bg-[#1a2b4a] border-[#1a2b4a] text-white",
                    !isPast &&
                      !isCurrent &&
                      "bg-white border-slate-300 text-slate-400"
                  )}
                >
                  {isPast ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 text-center leading-tight max-w-[80px]",
                    isCurrent
                      ? "font-semibold text-[#1a2b4a]"
                      : "text-muted-foreground"
                  )}
                >
                  {LOAN_STAGE_LABELS[stage]}
                </span>
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-1",
                    isPast || (isTerminalStage && idx < PIPELINE_STAGES.length - 1)
                      ? "bg-green-600"
                      : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {isTerminalStage && (
        <div className="text-center mt-1">
          <span className="text-xs font-medium text-muted-foreground">
            Current: {LOAN_STAGE_LABELS[currentStage as LoanStage] ?? currentStage}
          </span>
        </div>
      )}
    </div>
  );
}
