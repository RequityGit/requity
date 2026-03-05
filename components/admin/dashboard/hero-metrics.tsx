"use client";

import { ArrowUpRight } from "lucide-react";
import { DashCard } from "./dash-card";
import { CountUp } from "./count-up";
import { DeltaBadge } from "./delta-badge";
import type { HeroMetrics as HeroMetricsType } from "@/lib/dashboard.server";

function formatCompact(n: number): { whole: number; decimal: number; suffix: string } {
  if (n >= 1e9) return { whole: Math.floor(n / 1e8) / 10, decimal: 1, suffix: "B" };
  if (n >= 1e6) return { whole: Math.floor(n / 1e5) / 10, decimal: 1, suffix: "M" };
  if (n >= 1e3) return { whole: Math.floor(n / 1e2) / 10, decimal: 1, suffix: "K" };
  return { whole: n, decimal: 0, suffix: "" };
}

function fmtShort(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface HeroMetricsProps {
  data: HeroMetricsType;
}

export function HeroMetrics({ data }: HeroMetricsProps) {
  const aum = formatCompact(data.totalAum);

  return (
    <div className="grid grid-cols-[2.2fr_1fr_1fr_1fr] gap-2.5 mb-3 dash-fade-up dash-delay-1">
      {/* AUM Card - Primary accent */}
      <DashCard
        hover
        className="!p-[18px_22px] !bg-primary !border-none text-primary-foreground"
      >
        <div className="flex justify-between items-start">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground/60">
            Total AUM
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full bg-[#22C55E]" />
            <span className="text-[9px] text-primary-foreground/60 num">LIVE</span>
          </div>
        </div>
        <div className="flex items-baseline gap-2.5 mt-2">
          <span className="num text-[40px] font-bold text-primary-foreground leading-none tracking-tight">
            <CountUp end={aum.whole} decimals={aum.decimal} prefix="$" duration={900} delay={100} />
            <span className="text-[22px] text-primary-foreground/60">{aum.suffix}</span>
          </span>
          <span className="num text-[10.5px] font-semibold px-1.5 py-0.5 rounded-[3px] bg-[rgba(34,197,94,0.12)] text-[#22C55E] inline-flex items-center gap-0.5">
            <ArrowUpRight size={10} strokeWidth={2.5} />+12.3%
          </span>
        </div>
        <div className="flex gap-5 mt-2.5">
          <span className="text-[11px] text-primary-foreground/60">
            Lending{" "}
            <span className="num text-primary-foreground/80 font-semibold">
              {fmtShort(data.lendingAum)}
            </span>
          </span>
          <span className="text-[11px] text-primary-foreground/60">
            Investments{" "}
            <span className="num text-primary-foreground/80 font-semibold">
              {fmtShort(data.investmentAum)}
            </span>
          </span>
        </div>
      </DashCard>

      {/* Active Loans */}
      <DashCard hover className="!p-[14px_16px]">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-dash-text-faint">
          Active Loans
        </span>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="num text-[26px] font-bold text-foreground leading-none">
            <CountUp end={data.activeLoansCount} duration={600} delay={200} />
          </span>
          <DeltaBadge value={`+${Math.max(1, Math.floor(data.activeLoansCount * 0.1))}`} delay={200} />
        </div>
        <span className="text-[10px] text-dash-text-faint mt-0.5 block">
          {fmtShort(data.activeLoansOutstanding)} outstanding
        </span>
      </DashCard>

      {/* Investor Capital */}
      <DashCard hover className="!p-[14px_16px]">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-dash-text-faint">
          Investor Capital
        </span>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="num text-[26px] font-bold text-foreground leading-none">
            <CountUp
              end={data.investorCapital / 1e6}
              decimals={1}
              prefix="$"
              suffix="M"
              duration={900}
              delay={300}
            />
          </span>
          <DeltaBadge value="+$2.1M" delay={300} />
        </div>
        <span className="text-[10px] text-dash-text-faint mt-0.5 block">
          {data.investorCount} investors
        </span>
      </DashCard>

      {/* Properties */}
      <DashCard hover className="!p-[14px_16px]">
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-dash-text-faint">
          Properties
        </span>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="num text-[26px] font-bold text-foreground leading-none">
            <CountUp end={data.propertiesCount} duration={600} delay={400} />
          </span>
          <DeltaBadge value="+2" delay={400} />
        </div>
        <span className="text-[10px] text-dash-text-faint mt-0.5 block">
          {data.totalUnits} total units
        </span>
      </DashCard>
    </div>
  );
}
