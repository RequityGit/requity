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
    <div className="rounded-lg p-4 relative overflow-hidden bg-gradient-to-br from-navy via-navy-mid to-navy-light shadow-[0_4px_10px_rgba(11,25,41,0.10),0_14px_32px_rgba(11,25,41,0.08)]">
      {/* Decorative glow */}
      <div className="absolute -top-[50px] -right-10 w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(197,151,91,0.08)_0%,transparent_60%)] pointer-events-none" />

      <span className="font-body text-[9px] font-bold uppercase tracking-[0.14em] text-gold relative">
        Path to $1B AUM
      </span>
      <div className="font-mono text-[32px] font-bold text-[#FAFAF8] mt-1.5 leading-none relative">
        {aumDisplay}
        <span className="text-[17px] text-navy-text font-semibold">{aumSuffix}</span>
      </div>
      <div className="text-[10px] text-navy-text font-mono mt-0.5">
        {pct.toFixed(2)}% of target
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/[0.06] rounded-sm overflow-hidden my-3 relative">
        <div
          className="h-full rounded-sm bg-gradient-to-r from-gold to-gold-light dash-progress-glow"
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-1.5">
        {miniStats.map((m) => (
          <div
            key={m.label}
            className="bg-white/[0.04] rounded border border-white/[0.04] px-2 py-1.5"
          >
            <div className="text-[8px] font-bold uppercase tracking-[0.08em] text-navy-text">
              {m.label}
            </div>
            <div className="font-mono text-[13px] font-bold text-[#FAFAF8] mt-0.5">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Mini capital chart */}
      <div className="mt-2.5">
        <span className="text-[8.5px] font-bold uppercase tracking-[0.08em] text-navy-text">
          Capital Raised (6mo)
        </span>
        <ResponsiveContainer width="100%" height={65}>
          <BarChart data={capitalData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <Bar dataKey="raised" fill="#C5975B" radius={[2, 2, 0, 0]} opacity={0.5} />
            <Tooltip
              contentStyle={{
                background: "#122640",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 4,
                color: "#fff",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
              formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Raised"]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
