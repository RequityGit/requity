"use client";

import { CalendarDays, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { WeeklySummary } from "../actions";

interface WeeklyRhythmProps {
  summary: WeeklySummary | null;
}

interface MetricItem {
  label: string;
  value: string;
  delta: string;
  good: boolean;
}

export function WeeklyRhythm({ summary }: WeeklyRhythmProps) {
  if (!summary) {
    return (
      <Card className="mb-8 p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
          Week in Review
        </div>
        <div className="py-6 text-center text-[13px] text-muted-foreground">
          No weekly data available yet
        </div>
      </Card>
    );
  }

  const completionRate =
    summary.tasks_created > 0
      ? Math.round((summary.tasks_completed / summary.tasks_created) * 100)
      : 0;

  const metrics: MetricItem[] = [
    {
      label: "Tasks Done",
      value: `${summary.tasks_completed}/${summary.tasks_created}`,
      delta: `${completionRate}%`,
      good: completionRate >= 70,
    },
    {
      label: "Tasks Created",
      value: String(summary.tasks_created),
      delta: "+0",
      good: true,
    },
  ];

  return (
    <Card className="mb-8 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
          Week in Review
        </div>
        <span className="text-[11px] font-medium text-dash-text-faint num">
          {summary.period}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m, i) => {
          const DeltaIcon = m.good ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={i}
              className="rounded-md border border-border bg-background p-3.5"
            >
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-dash-text-faint">
                {m.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground num">
                  {m.value}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-semibold num ${
                    m.good ? "text-[#1B7A44]" : "text-[#B23225]"
                  }`}
                >
                  <DeltaIcon className="h-3 w-3" strokeWidth={2} />
                  {m.delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
