"use client";

import { Flame } from "lucide-react";

interface StreakBadgeProps {
  current: number;
  best: number;
}

export function StreakBadge({ current, best }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-gold/25 bg-card px-3.5 py-2">
      <Flame className="h-[18px] w-[18px] text-gold" strokeWidth={1.5} />
      <span className="text-base font-bold text-gold num">{current}d</span>
      <span className="text-[11px] font-medium text-dash-text-faint num">
        / {best}d best
      </span>
    </div>
  );
}
