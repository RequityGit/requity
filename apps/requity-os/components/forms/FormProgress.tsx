"use client";

import { cn } from "@/lib/utils";

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function FormProgress({ currentStep, totalSteps }: FormProgressProps) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
