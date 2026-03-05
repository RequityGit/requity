import { DashCard } from "./dash-card";
import { SectionTitle, ViewAllButton } from "./section-title";
import type { ActivityEntry } from "@/lib/dashboard.server";

interface TeamActivityProps {
  entries: ActivityEntry[];
}

export function TeamActivity({ entries }: TeamActivityProps) {
  return (
    <DashCard className="!p-[14px_18px]">
      <SectionTitle
        sub="Latest across divisions"
        right={<ViewAllButton label="Full log" />}
      >
        Team Activity
      </SectionTitle>
      <div className="flex flex-col">
        {entries.map((e, i) => (
          <div
            key={e.id}
            className={`flex gap-2.5 py-[7px] ${
              i < entries.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[8.5px] font-bold text-white"
              style={{
                background: e.color,
                boxShadow: `0 2px 6px ${e.color}30`,
              }}
            >
              {e.initials}
            </div>
            <div className="flex-1">
              <div className="text-[11.5px] text-dash-text-sec leading-tight">
                <span className="font-semibold text-foreground">{e.person}</span>{" "}
                {e.action}
              </div>
              <div className="text-[10.5px] text-dash-text-mut mt-0.5">
                {e.detail}
              </div>
            </div>
            <span className="text-[10px] text-dash-text-faint flex-shrink-0 num">
              {e.time}
            </span>
          </div>
        ))}
      </div>
    </DashCard>
  );
}
