import type { SecondaryMetrics as SecondaryMetricsType } from "@/lib/dashboard.server";

function fmtShort(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface SecondaryMetricsProps {
  data: SecondaryMetricsType;
}

export function SecondaryMetrics({ data }: SecondaryMetricsProps) {
  const metrics = [
    { label: "Wtd Avg Rate", value: data.wtdAvgRate > 0 ? `${data.wtdAvgRate.toFixed(2)}%` : "—" },
    { label: "Pipeline", value: fmtShort(data.pipelineTotal) },
    { label: "Avg Occupancy", value: data.avgOccupancy ? `${data.avgOccupancy.toFixed(1)}%` : "—" },
    { label: "MTD Dist.", value: fmtShort(data.mtdDistributions) },
    { label: "Pending Draws", value: data.pendingDraws.toString() },
    { label: "Capital QTD", value: fmtShort(data.capitalQtd), accent: true },
  ];

  return (
    <div className="grid grid-cols-6 gap-2 mb-4 dash-fade-up dash-delay-2">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`rounded-md px-3 py-2.5 border shadow-sm ${
            m.accent
              ? "bg-accent border-border"
              : "bg-card border-border"
          }`}
        >
          <span
            className={`text-[9px] font-bold uppercase tracking-[0.08em] ${
              m.accent ? "text-foreground" : "text-dash-text-faint"
            }`}
          >
            {m.label}
          </span>
          <div className="font-mono text-[15px] font-bold text-foreground mt-0.5">
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
}
