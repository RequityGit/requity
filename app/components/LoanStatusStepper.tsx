import type { LoanStatus } from "~/types/database";
import { LOAN_STATUSES } from "~/types/database";

interface Props {
  currentStatus: LoanStatus;
}

export default function LoanStatusStepper({ currentStatus }: Props) {
  const currentIdx = LOAN_STATUSES.indexOf(currentStatus);

  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden md:flex items-center justify-between">
        {LOAN_STATUSES.map((status, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={status} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isCompleted
                      ? "bg-success border-success text-white"
                      : isCurrent
                      ? "bg-accent border-accent text-white"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs text-center max-w-[80px] leading-tight ${
                    isCurrent ? "font-semibold text-accent" : isCompleted ? "text-success font-medium" : "text-muted"
                  }`}
                >
                  {status}
                </span>
              </div>
              {idx < LOAN_STATUSES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                    idx < currentIdx ? "bg-success" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden space-y-2">
        {LOAN_STATUSES.map((status, idx) => {
          const isCompleted = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={status} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border-2 ${
                  isCompleted
                    ? "bg-success border-success text-white"
                    : isCurrent
                    ? "bg-accent border-accent text-white"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-sm ${
                  isCurrent ? "font-semibold text-accent" : isCompleted ? "text-success" : "text-muted"
                }`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
