import { DashCard } from "./dash-card";
import { SectionTitle, ViewAllButton } from "./section-title";
import type { PipelineStage } from "@/lib/dashboard.server";

function fmtShort(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-dash-text-faint",
  application: "bg-dash-info",
  underwriting: "bg-dash-warning",
  approved: "bg-primary",
  clear_to_close: "bg-primary",
  funded: "bg-dash-success",
};

// We need inline styles for the bar colors since they use dynamic widths
const STAGE_COLOR_HEX: Record<string, string> = {
  lead: "#9FAAB5",
  application: "#2E6EA6",
  underwriting: "#B8822A",
  approved: "hsl(var(--primary))",
  clear_to_close: "#4B6A8F",
  funded: "#1B7A44",
};

interface PipelineChartProps {
  stages: PipelineStage[];
  totalValue: number;
  totalDeals: number;
  monthVolume?: number;
}

export function PipelineChart({
  stages,
  totalValue,
  totalDeals,
  monthVolume,
}: PipelineChartProps) {
  return (
    <DashCard className="!p-[14px_18px]">
      <SectionTitle
        sub={`${totalDeals} deals · ${fmtShort(totalValue)}`}
        right={<ViewAllButton label="Pipeline" href="/admin/originations" />}
      >
        Lending Pipeline
      </SectionTitle>
      <div className="flex flex-col gap-1">
        {stages.map((stage) => {
          const pct = totalValue > 0 ? Math.max((stage.value / totalValue) * 100, 8) : 8;
          const color = STAGE_COLOR_HEX[stage.stage] || "#9FAAB5";
          return (
            <div key={stage.stage} className="flex items-center gap-[7px]">
              <span className="text-[10.5px] font-medium text-dash-text-mut w-[66px] text-right">
                {stage.label}
              </span>
              <div className="flex-1 h-5 bg-dash-surface-alt rounded-[3px] overflow-hidden">
                <div
                  className="h-full rounded-[3px] flex items-center pl-1.5 min-w-[34px] dash-bar-fill"
                  style={{ width: `${pct}%`, background: color }}
                >
                  <span className="font-mono text-[9.5px] font-bold text-white">
                    {stage.count}
                  </span>
                </div>
              </div>
              <span className="font-mono text-[10.5px] font-semibold text-dash-text-sec w-11 text-right">
                {fmtShort(stage.value)}
              </span>
            </div>
          );
        })}
      </div>
      {monthVolume !== undefined && monthVolume > 0 && (
        <div className="mt-2.5 px-2.5 py-[7px] bg-accent rounded border border-border flex justify-between items-center">
          <span className="text-[10.5px] font-semibold text-foreground">
            {new Date().toLocaleDateString("en-US", { month: "short" })} volume
          </span>
          <span className="font-mono text-[13px] font-bold text-foreground">
            {fmtShort(monthVolume)}
          </span>
        </div>
      )}
    </DashCard>
  );
}
