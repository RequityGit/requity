"use client";

import { CheckCircle2 } from "lucide-react";
import {
  STAGES,
  TERMINAL_DEAL_STAGES,
  DotPill,
  cap,
  dBetween,
  type DealData,
  type StageHistoryEntry,
} from "./components";

interface StepperProps {
  deal: DealData;
  stageHistory: StageHistoryEntry[];
}

/**
 * Compute per-stage data from the stage history log.
 * The history stores transitions (from_stage -> to_stage).
 * We reconstruct how many days were spent in each stage.
 */
function buildStageTimeline(
  stageHistory: StageHistoryEntry[],
  currentStage: string
) {
  const map: Record<string, { enteredAt: string | null; days: number | null }> = {};

  // Sort by changed_at ascending
  const sorted = [...stageHistory].sort(
    (a, b) =>
      new Date(a.changed_at || "").getTime() -
      new Date(b.changed_at || "").getTime()
  );

  // Track when each stage was entered
  for (const entry of sorted) {
    if (entry.to_stage && entry.changed_at) {
      map[entry.to_stage] = { enteredAt: entry.changed_at, days: null };
    }
    // If from_stage had an entry, calculate days
    if (entry.from_stage && map[entry.from_stage] && entry.changed_at) {
      const entered = new Date(map[entry.from_stage].enteredAt || "");
      const exited = new Date(entry.changed_at);
      map[entry.from_stage].days = Math.floor(
        (exited.getTime() - entered.getTime()) / 86400000
      );
    }
  }

  // Current stage days = days since entered
  if (map[currentStage]?.enteredAt) {
    map[currentStage].days = dBetween(map[currentStage].enteredAt!);
  }

  return map;
}

export function Stepper({ deal, stageHistory }: StepperProps) {
  // Terminal stages => show as a single pill badge
  if (
    TERMINAL_DEAL_STAGES.includes(
      deal.stage as (typeof TERMINAL_DEAL_STAGES)[number]
    )
  ) {
    const stageColor =
      deal.stage === "default" || deal.stage === "reo"
        ? "#E5453D"
        : deal.stage === "withdrawn" || deal.stage === "denied" || deal.stage === "closed_lost"
          ? "#8B8B8B"
          : "#22A861";
    return (
      <div className="rounded-xl border border-[#E5E5E7] bg-white px-6 py-4">
        <DotPill label={cap(deal.stage)} color={stageColor} big />
      </div>
    );
  }

  const ci = STAGES.findIndex((s) => s.k === deal.stage);
  const timeline = buildStageTimeline(stageHistory, deal.stage);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E5E7] bg-white px-6 py-[18px]">
      <div className="flex min-w-[680px] items-start">
        {STAGES.map((stg, i) => {
          const done = i < ci;
          const cur = i === ci;
          const fut = i > ci;
          const info = timeline[stg.k];
          const days = info?.days ?? null;
          const isWarn = cur && stg.w > 0 && days !== null && days >= stg.w && days < stg.a;
          const isAlert = cur && stg.a > 0 && days !== null && days >= stg.a;
          const velColor = isAlert ? "#E5453D" : isWarn ? "#E5930E" : "#6B6B6B";

          return (
            <div key={stg.k} className="flex flex-1 items-start">
              <div className="flex min-w-[75px] flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    background: done ? "#1A1A1A" : cur ? stg.c : "transparent",
                    border: `2px solid ${done ? "#1A1A1A" : cur ? stg.c : "#E5E5E7"}`,
                    boxShadow: cur ? `0 0 0 4px ${stg.c}20` : "none",
                  }}
                >
                  {done && <CheckCircle2 size={14} color="#FFF" />}
                  {cur && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                {/* Label */}
                <span
                  className="text-center text-[11px] font-sans"
                  style={{
                    fontWeight: cur ? 600 : 500,
                    color: fut ? "#8B8B8B" : "#1A1A1A",
                  }}
                >
                  {stg.l}
                </span>
                {/* Days */}
                {done && days != null && (
                  <span className="text-[10px] text-[#8B8B8B] num">
                    {days}d
                  </span>
                )}
                {cur && days != null && (
                  <span
                    className="text-[10px] font-semibold num"
                    style={{ color: velColor }}
                  >
                    {days}d
                  </span>
                )}
              </div>
              {/* Connector */}
              {i < STAGES.length - 1 && (
                <div
                  className="mx-1 mt-[14px] h-0.5 flex-1"
                  style={{
                    background: i < ci ? "#1A1A1A" : "#E5E5E7",
                    opacity: fut ? 0.4 : 1,
                    ...(fut
                      ? {
                          backgroundImage:
                            "repeating-linear-gradient(90deg, #E5E5E7, #E5E5E7 4px, transparent 4px, transparent 8px)",
                          background: "none",
                        }
                      : {}),
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
