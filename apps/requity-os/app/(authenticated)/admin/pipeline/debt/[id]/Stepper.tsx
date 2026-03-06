"use client";

import { Check, Loader2 } from "lucide-react";
import {
  T,
  TERMINAL_DEAL_STAGES,
  DotPill,
  cap,
  type DealData,
  type PipelineStage,
} from "./components";

interface StepperProps {
  deal: DealData;
  stages: PipelineStage[];
  onStageClick?: (stageKey: string) => void;
  updatingStage?: boolean;
}

export function Stepper({ deal, stages, onStageClick, updatingStage }: StepperProps) {
  // Terminal stages => show as a single pill badge
  if (
    TERMINAL_DEAL_STAGES.includes(
      deal.stage as (typeof TERMINAL_DEAL_STAGES)[number]
    )
  ) {
    const stageColor =
      deal.stage === "default" || deal.stage === "reo"
        ? T.accent.red
        : deal.stage === "withdrawn" || deal.stage === "denied" || deal.stage === "closed_lost"
          ? T.text.muted
          : T.accent.green;
    return (
      <div
        className="rounded-xl px-5 py-4"
        style={{
          backgroundColor: T.bg.surface,
          border: `1px solid ${T.bg.border}`,
        }}
      >
        <DotPill label={cap(deal.stage)} color={stageColor} big />
      </div>
    );
  }

  // Filter to non-terminal stages for the tracker
  const nonTerminal = stages.filter((s) => !s.is_terminal);
  const ci = nonTerminal.findIndex((s) => s.stage_key === deal.stage);

  return (
    <div
      className="overflow-x-auto rounded-xl px-5 py-4"
      style={{
        backgroundColor: T.bg.surface,
        border: `1px solid ${T.bg.border}`,
      }}
    >
      <div className="flex items-center gap-0 min-w-[600px]">
        {nonTerminal.map((stg, i) => {
          const isComplete = i < ci;
          const isCurrent = i === ci;
          const isUpcoming = i > ci;
          const isClickable = !!onStageClick && !isCurrent && !updatingStage;
          const dotColor = isComplete
            ? T.accent.green
            : isCurrent
              ? stg.color
              : T.bg.border;

          return (
            <div key={stg.stage_key} className="flex flex-1 items-center">
              <div
                className={`flex flex-col items-center gap-1.5 min-w-0${isClickable ? " cursor-pointer" : ""}`}
                onClick={isClickable ? () => onStageClick(stg.stage_key) : undefined}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onStageClick(stg.stage_key); } : undefined}
              >
                {/* Circle */}
                <div
                  className={`flex items-center justify-center rounded-full transition-all duration-200${isClickable ? " hover:scale-110" : ""}`}
                  style={{
                    width: isCurrent ? 28 : 20,
                    height: isCurrent ? 28 : 20,
                    backgroundColor: isComplete
                      ? T.accent.green
                      : isCurrent
                        ? stg.color + "22"
                        : "transparent",
                    border: `2px solid ${dotColor}`,
                    boxShadow: isCurrent ? `0 0 0 4px ${stg.color}18` : "none",
                  }}
                >
                  {isCurrent && updatingStage ? (
                    <Loader2 size={12} className="animate-spin" style={{ color: stg.color }} />
                  ) : isComplete ? (
                    <Check size={12} color="#fff" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <div
                      className="rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: stg.color,
                      }}
                    />
                  ) : null}
                </div>
                {/* Label */}
                <span
                  className={`text-[11px] text-center whitespace-nowrap${isClickable ? " hover:text-white" : ""}`}
                  style={{
                    fontWeight: isCurrent ? 600 : 400,
                    color: isUpcoming
                      ? T.text.muted
                      : isCurrent
                        ? T.text.primary
                        : T.text.secondary,
                    letterSpacing: "0.02em",
                  }}
                >
                  {stg.label}
                </span>
              </div>
              {/* Connector */}
              {i < nonTerminal.length - 1 && (
                <div
                  className="flex-1 mx-2"
                  style={{
                    height: 2,
                    marginBottom: 22,
                    backgroundColor: i < ci ? T.accent.green : T.bg.border,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
