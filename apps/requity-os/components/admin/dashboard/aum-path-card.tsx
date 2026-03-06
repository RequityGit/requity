"use client";

import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CapitalMonth } from "@/lib/dashboard.server";

function fmtShort(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface AumPathCardProps {
  totalAum: number;
  qtdCapital: number;
  ytdCapital: number;
  prospectCount: number;
  capitalData: CapitalMonth[];
}

export function AumPathCard({
  totalAum,
  qtdCapital,
  ytdCapital,
  prospectCount,
  capitalData,
}: AumPathCardProps) {
  const target = 1e9; // $1B
  const pct = (totalAum / target) * 100;
  const aumDisplay = totalAum >= 1e6 ? `$${(totalAum / 1e6).toFixed(1)}` : fmtShort(totalAum);
  const aumSuffix = totalAum >= 1e6 ? "M" : "";

  const miniStats = [
    { label: "QTD", value: fmtShort(qtdCapital) },
    { label: "YTD", value: fmtShort(ytdCapital) },
    { label: "Prospects", value: prospectCount.toString() },
  ];

  return (
    <div className="rounded-lg p-4 relative overflow-hidden bg-primary text-primary-foreground shadow-md">
      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-foreground relative">
        Path to $1B AUM
      </span>
      <div className="num text-[32px] font-bold text-primary-foreground mt-1.5 leading-none relative">
        {aumDisplay}
        <span className="text-[17px] text-primary-foreground/60 font-semibold">{aumSuffix}</span>
      </div>
      <div className="text-[10px] text-primary-foreground/60 num mt-0.5">
        {pct.toFixed(2)}% of target
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-primary-foreground/[0.06] rounded-sm overflow-hidden my-3 relative">
        <div
          className="h-full rounded-sm bg-primary-foreground/60"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {miniStats.map((m) => (
          <div
            key={m.label}
            className="bg-primary-foreground/[0.04] rounded border border-primary-foreground/[0.04] px-2 py-1.5"
          >
            <div className="text-[8px] font-bold uppercase tracking-[0.08em] text-primary-foreground/60">
              {m.label}
            </div>
            <div className="num text-[13px] font-bold text-primary-foreground mt-0.5">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini capital chart */}
      <div className="mt-2.5">
        <span className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-primary-foreground/60">
          Capital Raised (6mo)
        </span>
        <ResponsiveContainer width="100%" height={65}>
          <BarChart data={capitalData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="raised" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.5} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 4,
                color: "hsl(var(--foreground))",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
              formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Raised"]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
