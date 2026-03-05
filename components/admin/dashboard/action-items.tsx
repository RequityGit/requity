"use client";

import {
  AlertCircle,
  CircleDollarSign,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import { DashCard } from "./dash-card";
import { SectionTitle, ViewAllButton } from "./section-title";
import type { ActionItem } from "@/lib/dashboard.server";

const iconMap: Record<string, React.ElementType> = {
  draw: AlertCircle,
  contribution: CircleDollarSign,
  docs: FileText,
  application: Users,
  distribution: Calendar,
};

interface ActionItemsProps {
  items: ActionItem[];
}

export function ActionItems({ items }: ActionItemsProps) {
  const highCount = items.filter((a) => a.severity === "high").length;
  const medCount = items.filter((a) => a.severity === "med").length;

  return (
    <div className="dash-fade-up dash-delay-3">
      <DashCard className="mb-4 !p-[14px_18px]">
        <SectionTitle
          sub={`${highCount} critical · ${medCount} pending`}
          right={<ViewAllButton label="All tasks" />}
        >
          Action Required
        </SectionTitle>
        <div className="flex flex-col gap-0.5">
          {items.map((item, i) => {
            const isHigh = item.severity === "high";
            const Icon = iconMap[item.type] || AlertCircle;
            return (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-[5px] cursor-pointer dash-row-hover border-l-2 ${
                  isHigh ? "border-l-dash-danger" : "border-l-dash-warning"
                }`}
              >
                <Icon
                  size={13}
                  strokeWidth={1.5}
                  className={`flex-shrink-0 opacity-80 ${
                    isHigh ? "text-dash-danger" : "text-dash-warning"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-dash-text-mut ml-1.5">
                    {item.detail}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-dash-text-sec px-1.5 py-0.5 bg-dash-surface-alt rounded-[3px] flex-shrink-0">
                  {item.assignee}
                </span>
                <span className="text-[10px] text-dash-text-faint num flex-shrink-0 w-7 text-right">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      </DashCard>
    </div>
  );
}
