"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashCard } from "./dash-card";
import { SectionTitle } from "./section-title";
import type { OriginationMonth } from "@/lib/dashboard.server";

interface OriginationChartProps {
  data: OriginationMonth[];
}

export function OriginationChart({ data }: OriginationChartProps) {
  const hasData = data.some((d) => d.volume > 0);

  return (
    <DashCard className="!p-[14px_18px]">
      <SectionTitle sub="6-month trend">Origination Volume</SectionTitle>
      {hasData ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="origGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C5975B" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#C5975B" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#9FAAB5", fontSize: 10, fontFamily: "'Source Sans 3', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9FAAB5", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v / 1e6}M`}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid rgba(11,25,41,0.08)",
                borderRadius: 6,
                color: "#0B1929",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                boxShadow: "0 2px 6px rgba(11,25,41,0.08), 0 8px 24px rgba(11,25,41,0.06)",
              }}
              formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, "Volume"]}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#C5975B"
              strokeWidth={2}
              fill="url(#origGrad)"
              dot={{ r: 2.5, fill: "#C5975B", stroke: "#fff", strokeWidth: 1.5 }}
              activeDot={{ r: 4, fill: "#C5975B", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[180px] text-dash-text-mut text-xs">
          No origination data for this period
        </div>
      )}
    </DashCard>
  );
}
