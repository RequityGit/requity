"use client";

interface GuidedStepProps {
  n: number;
  label: string;
}

export function GuidedStep({ n, label }: GuidedStepProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-bold">
        {n}
      </div>
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <div className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}
