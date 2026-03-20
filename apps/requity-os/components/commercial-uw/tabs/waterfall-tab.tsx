"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCommercialUWStore } from "../store";
import { useCommercialUWCalcs } from "../use-calcs";
import { UWCard } from "../uw-card";
import { UWInput, UWSelect } from "../uw-input";
import { fmtCurrency, fmtPct, fmtMultiple } from "../format-utils";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const destructive = "hsl(4, 78%, 57%)";
const dash = "—";

function negColor(v: string | undefined, isBold?: boolean, color?: string) {
  if (!v || v === dash) return "hsl(var(--muted-foreground))";
  if (color) return color;
  if (typeof v === "string" && (v.startsWith("(") || v.startsWith("-"))) return destructive;
  return isBold ? undefined : "hsl(var(--muted-foreground))";
}

function WaterfallSection({
  title,
  accent,
  shareCol,
  rows,
}: {
  title: string;
  accent?: string;
  shareCol?: boolean;
  rows: {
    label?: string; share?: string; total?: string; years?: string[];
    bold?: boolean; metric?: boolean; indent?: boolean; color?: string;
    divider?: boolean; section?: string;
  }[];
}) {
  const colCount = shareCol ? 9 : 8;
  return (
    <UWCard title={title} accent={accent} noPad>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-accent/50">
              <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_12px] pl-[22px] border-b-2 w-[22%]" />
              {shareCol && <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_12px] border-b-2 w-[8%]">Share</th>}
              <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_12px] border-b-2 border-l w-[11%]">Total</th>
              {["Year 0", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map((y, i) => (
                <th key={y} className={cn("text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_12px] border-b-2", i === 5 && "pr-[22px]")}>
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              if (r.divider) return <tr key={i}><td colSpan={colCount} className="p-0 h-2" /></tr>;
              if (r.section) {
                return (
                  <tr key={i}>
                    <td colSpan={colCount} className="px-[22px] pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground border-b">
                      {r.section}
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={i}
                  className={cn(
                    r.bold ? "bg-foreground/[0.04]" : r.metric ? "" : "hover:bg-foreground/[0.02]",
                    "transition-colors"
                  )}
                >
                  <td className={cn(
                    "p-[0_12px] pl-[22px] h-9 text-xs border-b tabular-nums",
                    r.indent && "pl-9",
                    r.bold ? "font-bold text-[13px]" : r.metric ? "font-semibold italic text-muted-foreground" : "text-muted-foreground",
                  )}>
                    {r.label}
                  </td>
                  {shareCol && (
                    <td className="p-[0_12px] h-9 text-right text-[11px] text-muted-foreground border-b tabular-nums">
                      {r.share || ""}
                    </td>
                  )}
                  <td
                    className={cn(
                      "p-[0_12px] h-9 text-right border-b border-l tabular-nums text-xs",
                      r.bold || r.metric ? "font-bold" : "font-medium",
                      r.metric && "bg-dash-info/5",
                    )}
                    style={{ color: negColor(r.total, r.bold, r.color) }}
                  >
                    {r.total || dash}
                  </td>
                  {(r.years || []).map((v, j) => (
                    <td
                      key={j}
                      className={cn("p-[0_12px] h-9 text-right border-b tabular-nums text-xs", r.bold && "font-semibold")}
                      style={{ color: negColor(v, r.bold, r.color) }}
                    >
                      {v || dash}
                    </td>
                  ))}
                  {r.years && r.years.length < 6 && Array(6 - r.years.length).fill(null).map((_, j) => (
                    <td key={`e${j}`} className="p-[0_12px] h-9 text-right border-b text-muted-foreground" />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </UWCard>
  );
}

export function WaterfallTab() {
  const {
    state,
    updateField,
    updateWaterfallTier,
    addPromoteTier,
    removeWaterfallTier,
  } = useCommercialUWStore();
  const c = useCommercialUWCalcs(state);

  const fmtWF = (n: number) => {
    if (n === 0) return dash;
    if (n < 0) return `(${fmtCurrency(Math.abs(n))})`;
    return fmtCurrency(n);
  };

  const projectRows = [
    { label: "Equity Contributions", total: fmtWF(-c.totalEquity), years: [fmtWF(-c.totalEquity), dash, dash, dash, dash, dash] },
    { label: "Distributions", total: fmtCurrency(c.projectLevelCashFlows.slice(1).reduce((s, v) => s + Math.max(0, v), 0)), years: [dash, ...c.ncfByYear.map(fmtWF)] },
    { label: "Levered Project NCF", total: fmtWF(c.projectLevelCashFlows.reduce((s, v) => s + v, 0)), years: c.projectLevelCashFlows.map(fmtWF), bold: true },
    { divider: true },
    { label: "Levered IRR", total: fmtPct(c.projectIRR), years: [] as string[], metric: true },
    { label: "Levered Equity Multiple", total: fmtMultiple(c.projectEquityMultiple), years: [] as string[], metric: true },
  ];

  const projectLevelRows = [
    { label: "Equity Contribution", share: "100.0%", total: fmtWF(-c.totalEquity), years: [fmtWF(-c.totalEquity), dash, dash, dash, dash, dash] },
    { label: "Total Net Cash Flow", share: "100.0%", total: fmtWF(c.projectLevelCashFlows.reduce((s, v) => s + v, 0)), years: c.projectLevelCashFlows.map(fmtWF), bold: true },
    { divider: true },
    { label: "Levered IRR", total: fmtPct(c.projectIRR), years: [] as string[], metric: true },
    { label: "Levered Equity Multiple", total: fmtMultiple(c.projectEquityMultiple), years: [] as string[], metric: true },
  ];

  const gpRows = [
    { label: "Equity Contribution", share: `${state.gpCoInvestPct.toFixed(1)}%`, total: fmtWF(-c.gpEquity), years: [fmtWF(-c.gpEquity), dash, dash, dash, dash, dash] },
    { label: "Total Net Cash Flow", share: `${state.gpCoInvestPct.toFixed(1)}%`, total: fmtWF(c.projectLevelCashFlows.reduce((s, v) => s + v, 0) * (state.gpCoInvestPct / 100)), years: c.projectLevelCashFlows.map((cf) => fmtWF(cf * (state.gpCoInvestPct / 100))), bold: true },
    { divider: true },
    { label: "GP IRR", total: fmtPct(c.gpIRR), years: [] as string[], metric: true },
    { label: "GP Equity Multiple", total: fmtMultiple(c.gpEquityMultiple), years: [] as string[], metric: true },
  ];

  const lpRows = [
    { label: "Equity Contribution", share: `${(100 - state.gpCoInvestPct).toFixed(1)}%`, total: fmtWF(-c.lpEquity), years: [fmtWF(-c.lpEquity), dash, dash, dash, dash, dash] },
    { label: "Total Net Cash Flow", share: `${(100 - state.gpCoInvestPct).toFixed(1)}%`, total: fmtWF(c.projectLevelCashFlows.reduce((s, v) => s + v, 0) * ((100 - state.gpCoInvestPct) / 100)), years: c.projectLevelCashFlows.map((cf) => fmtWF(cf * ((100 - state.gpCoInvestPct) / 100))), bold: true },
    { divider: true },
    { label: "LP IRR", total: fmtPct(c.lpIRR), years: [] as string[], metric: true },
    { label: "LP Equity Multiple", total: fmtMultiple(c.lpEquityMultiple), years: [] as string[], metric: true },
    { label: "Cash on Cash Return", total: "", years: c.cashOnCashByYear.map((coc) => fmtPct(coc)), metric: true },
  ];

  const tierColors: Record<string, string> = {
    pref: "hsl(36, 40%, 42%)",
    roc: "hsl(145, 63%, 29%)",
    promote: "hsl(210, 55%, 41%)",
    residual: "hsl(210, 55%, 41%)",
  };

  const tierBgColors: Record<string, string> = {
    pref: "hsl(36, 40%, 42%, 0.1)",
    roc: "hsl(145, 63%, 29%, 0.15)",
    promote: "hsl(210, 55%, 41%, 0.1)",
    residual: "hsl(210, 55%, 41%, 0.1)",
  };

  const tierBadgeLabels: Record<string, string> = {
    pref: "Pref Return",
    roc: "Return of Capital",
    promote: "Promote",
    residual: "Catch-All",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Equity Structure */}
      <UWCard title="Equity Structure">
        <div className="flex gap-3.5">
          <UWInput label="Total Equity" value={state.equityInvested} prefix="$" onChange={(v) => updateField("equityInvested", v)} />
          <UWInput label="GP Co-Invest %" value={state.gpCoInvestPct} suffix="%" onChange={(v) => updateField("gpCoInvestPct", v)} />
          <UWInput label="GP Co-Invest" value={c.gpEquity} prefix="$" disabled />
          <UWInput label="LP Equity" value={c.lpEquity} prefix="$" disabled />
        </div>
      </UWCard>

      {/* Distribution Waterfall */}
      <UWCard
        title="Distribution Waterfall"
        subtitle="Define waterfall tiers in priority order. Preferred return → Return of capital → Promote tiers."
      >
        <div className="flex flex-col">
          {state.waterfallTiers.map((t, idx) => (
            <div
              key={t.id}
              className="flex items-stretch bg-accent/50 border rounded-lg mb-2 overflow-hidden"
            >
              <div
                className="w-11 flex flex-col items-center justify-center shrink-0 border-r"
                style={{ background: tierBgColors[t.type] }}
              >
                <span className="text-sm font-bold tabular-nums" style={{ color: tierColors[t.type] }}>
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 px-[18px] py-3.5">
                <div className={cn("flex items-center gap-2.5", t.type === "roc" ? "mb-0" : "mb-3")}>
                  <span className="text-[13px] font-semibold">{t.label}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-[0.04em]"
                    style={{
                      background: tierBgColors[t.type],
                      color: tierColors[t.type],
                    }}
                  >
                    {tierBadgeLabels[t.type]}
                  </span>
                </div>
                {t.type === "pref" && (
                  <div className="flex gap-3">
                    <UWInput label="Preferred Rate" value={t.prefRate ?? 8} suffix="%" small width="130px" onChange={(v) => updateWaterfallTier(t.id, "prefRate", v)} />
                    <div className="flex-none w-[130px]">
                      <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">Accrual</div>
                      <select
                        defaultValue={t.accrual}
                        onChange={(e) => updateWaterfallTier(t.id, "accrual", e.target.value)}
                        className="w-full rounded-lg border border-border bg-accent/50 text-foreground px-2 py-[5px] text-xs outline-none cursor-pointer"
                      >
                        {["Annual", "Monthly", "Quarterly"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="flex-none w-[130px]">
                      <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">Compounding</div>
                      <select
                        defaultValue={t.compounding}
                        onChange={(e) => updateWaterfallTier(t.id, "compounding", e.target.value)}
                        className="w-full rounded-lg border border-border bg-accent/50 text-foreground px-2 py-[5px] text-xs outline-none cursor-pointer"
                      >
                        {["Simple", "Compound"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {t.type === "promote" && (
                  <div className="flex gap-3">
                    <UWInput label="IRR Hurdle" value={t.irrHurdle ?? 12} suffix="%" small width="120px" onChange={(v) => updateWaterfallTier(t.id, "irrHurdle", v)} />
                    <UWInput label="GP Split" value={t.gpSplit ?? 20} suffix="%" small width="100px" onChange={(v) => updateWaterfallTier(t.id, "gpSplit", v)} />
                    <UWInput label="LP Split" value={t.lpSplit ?? 80} suffix="%" small width="100px" onChange={(v) => updateWaterfallTier(t.id, "lpSplit", v)} />
                  </div>
                )}
                {t.type === "residual" && (
                  <div className="flex gap-3">
                    <UWInput label="GP Split" value={t.gpSplit ?? 35} suffix="%" small width="100px" onChange={(v) => updateWaterfallTier(t.id, "gpSplit", v)} />
                    <UWInput label="LP Split" value={t.lpSplit ?? 65} suffix="%" small width="100px" onChange={(v) => updateWaterfallTier(t.id, "lpSplit", v)} />
                  </div>
                )}
              </div>
              <div className="flex items-center pr-3.5">
                {t.type !== "roc" && (
                  <button
                    onClick={() => removeWaterfallTier(t.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <button
            onClick={addPromoteTier}
            className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Add Promote Tier
          </button>
        </div>
      </UWCard>

      {/* Output Tables */}
      <WaterfallSection title="Levered Project Net Cash Flow" rows={projectRows} />
      <WaterfallSection title="Project Level" accent="hsl(var(--foreground) / 0.2)" rows={projectLevelRows} shareCol />
      <WaterfallSection title="GP Promote" accent="#C5975B" rows={gpRows} shareCol />
      <WaterfallSection title="LP Investors" accent="hsl(210, 55%, 41%)" rows={lpRows} shareCol />
    </div>
  );
}
