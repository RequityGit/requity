"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useState, useCallback } from "react";
import type { UnifiedStage } from "../pipeline-types";

// ─── Stage definitions ───

const STAGES: { key: UnifiedStage; label: string }[] = [
  { key: "lead", label: "Intake" },
  { key: "analysis", label: "Analysis" },
  { key: "negotiation", label: "Negotiation" },
  { key: "execution", label: "Execution" },
  { key: "closed", label: "Closed" },
];

const STAGE_COLORS: Record<UnifiedStage, { dot: string; activeBg: string; activeFg: string; line: string }> = {
  lead:        { dot: "bg-zinc-400",   activeBg: "bg-zinc-700",   activeFg: "text-white", line: "bg-zinc-300" },
  analysis:    { dot: "bg-blue-600",   activeBg: "bg-blue-600",   activeFg: "text-white", line: "bg-blue-300" },
  negotiation: { dot: "bg-amber-600",  activeBg: "bg-amber-600",  activeFg: "text-white", line: "bg-amber-300" },
  execution:   { dot: "bg-green-600",  activeBg: "bg-green-600",  activeFg: "text-white", line: "bg-green-300" },
  closed:      { dot: "bg-purple-600", activeBg: "bg-purple-600", activeFg: "text-white", line: "bg-purple-300" },
};

// ─── Component ───

interface DealPreviewStageRailProps {
  currentStage: UnifiedStage;
  onAdvance: () => void;
  onRegress: () => void;
  disabled?: boolean;
}

export function DealPreviewStageRail({
  currentStage,
  onAdvance,
  onRegress,
  disabled,
}: DealPreviewStageRailProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);
  const canAdvance = currentIdx < STAGES.length - 1 && !disabled;
  const canRegress = currentIdx > 0 && !disabled;
  const nextStage = canAdvance ? STAGES[currentIdx + 1] : null;

  const [justAdvanced, setJustAdvanced] = useState<string | null>(null);

  const handleAdvance = useCallback(() => {
    if (!canAdvance || !nextStage) return;
    setJustAdvanced(nextStage.label);
    onAdvance();
    setTimeout(() => setJustAdvanced(null), 1500);
  }, [canAdvance, nextStage, onAdvance]);

  const handleRegress = useCallback(() => {
    if (!canRegress) return;
    onRegress();
  }, [canRegress, onRegress]);

  return (
    <div className="relative">
      <div className="flex items-center gap-0 rounded-lg border border-border bg-muted/30 p-1">
        {/* Regress button */}
        <button
          onClick={handleRegress}
          disabled={!canRegress}
          className={cn(
            "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border-none rq-transition",
            canRegress
              ? "bg-background text-foreground shadow-sm cursor-pointer hover:bg-accent"
              : "text-muted-foreground/30 cursor-default"
          )}
          title="Move to previous stage"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Stage dots */}
        <div className="flex flex-1 items-center justify-center gap-0">
          {STAGES.map((stage, i) => {
            const colors = STAGE_COLORS[stage.key];
            const isActive = stage.key === currentStage;
            const isPast = i < currentIdx;

            return (
              <div key={stage.key} className="flex items-center">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-0.5 w-5 rounded-full rq-transition",
                      isPast ? cn(colors.line, "opacity-50") : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md px-1.5 py-1 rq-transition",
                    isActive && cn(colors.activeBg, "px-2.5")
                  )}
                  title={stage.label}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full rq-transition",
                      isActive
                        ? "bg-white"
                        : isPast
                          ? cn(colors.dot, "opacity-50")
                          : "bg-muted-foreground/30"
                    )}
                  />
                  {isActive && (
                    <span className={cn("text-[11px] font-semibold whitespace-nowrap", colors.activeFg)}>
                      {stage.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Advance button */}
        <button
          onClick={handleAdvance}
          disabled={!canAdvance}
          className={cn(
            "flex h-[26px] shrink-0 items-center justify-center gap-1 rounded-md border-none text-[11px] font-semibold rq-transition",
            canAdvance
              ? cn("cursor-pointer px-2.5 text-white", STAGE_COLORS[nextStage!.key].activeBg, "hover:opacity-90")
              : "px-1.5 text-muted-foreground/30 cursor-default"
          )}
          title={canAdvance ? `Advance to ${nextStage!.label}` : ""}
        >
          {canAdvance ? (
            <>
              <ChevronRight className="h-3 w-3" />
              <span>{nextStage!.label}</span>
            </>
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Stage advance toast */}
      {justAdvanced && (
        <div className="absolute -top-2 right-0 flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-lg rq-animate-fade-in">
          <Zap className="h-3 w-3" />
          Moved to {justAdvanced}
        </div>
      )}
    </div>
  );
}
