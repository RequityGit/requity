"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { T, SectionCard, MetricCard } from "../components";
import type { CommercialUWData } from "./CommercialOverviewTab";
import {
  computeProForma,
  computeDealAnalysis,
  computeAnnualDebtService,
  computeExitAnalysis,
  computeReturnSummary,
  computeSensitivity,
  computeWaterfallDistributions,
  type DealIncomeRow,
  type DealExpenseRow,
  type DealUWRecord,
  type DealSourceUseRow,
  type DealWaterfallTier,
  type ProFormaYearResult,
} from "@/lib/commercial-uw/deal-computations";

interface CommercialUnderwritingTabProps {
  data: CommercialUWData;
}

// ── Helpers ──

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

function fC(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v < 0) return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fCk(v: number | null | undefined): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const str = abs >= 1000000 ? `$${(abs / 1000000).toFixed(2)}M` : abs >= 1000 ? `$${(abs / 1000).toFixed(0)}K` : `$${abs.toFixed(0)}`;
  return v < 0 ? `(${str})` : str;
}

function fPct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

function fX(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v.toFixed(2)}x`;
}

// ── Main Component ──

export function CommercialUnderwritingTab({ data }: CommercialUnderwritingTabProps) {
  const { uw, income, expenses, sourcesUses, waterfall } = data;

  // Parse rows
  const incomeRows: DealIncomeRow[] = useMemo(() =>
    income.map((r: DealIncomeRow) => ({ ...r, t12_amount: n(r.t12_amount), year_1_amount: n(r.year_1_amount), growth_rate: n(r.growth_rate) })),
    [income]
  );
  const expenseRows: DealExpenseRow[] = useMemo(() =>
    expenses.map((r: DealExpenseRow) => ({ ...r, t12_amount: n(r.t12_amount), year_1_amount: n(r.year_1_amount), growth_rate: n(r.growth_rate) })),
    [expenses]
  );

  const uwRecord: DealUWRecord = useMemo(() => ({
    purchase_price: n(uw?.purchase_price),
    closing_costs: n(uw?.closing_costs),
    capex_reserve: n(uw?.capex_reserve),
    working_capital: n(uw?.working_capital),
    num_units: n(uw?.num_units),
    total_sf: n(uw?.total_sf),
    loan_amount: n(uw?.loan_amount),
    interest_rate: n(uw?.interest_rate),
    amortization_years: n(uw?.amortization_years),
    loan_term_years: n(uw?.loan_term_years),
    io_period_months: n(uw?.io_period_months),
    origination_fee_pct: n(uw?.origination_fee_pct),
    exit_cap_rate: n(uw?.exit_cap_rate),
    hold_period_years: n(uw?.hold_period_years) || 5,
    sale_costs_pct: n(uw?.sale_costs_pct),
    disposition_fee_pct: n(uw?.disposition_fee_pct),
  }), [uw]);

  const suRows: DealSourceUseRow[] = useMemo(() =>
    sourcesUses.map((r: DealSourceUseRow) => ({ ...r, amount: n(r.amount) })),
    [sourcesUses]
  );

  const wfTiers: DealWaterfallTier[] = useMemo(() =>
    waterfall.map((r: DealWaterfallTier) => ({
      ...r,
      hurdle_rate: r.hurdle_rate != null ? n(r.hurdle_rate) : null,
      sponsor_split: r.sponsor_split != null ? n(r.sponsor_split) : null,
      investor_split: r.investor_split != null ? n(r.investor_split) : null,
    })),
    [waterfall]
  );

  // Computations
  const proForma = useMemo(() => computeProForma(incomeRows, expenseRows, uwRecord), [incomeRows, expenseRows, uwRecord]);
  const totalEquity = useMemo(() => {
    const equitySources = suRows.filter((s) => s.type === "source" && s.line_item.toLowerCase().includes("equity")).reduce((sum, s) => sum + s.amount, 0);
    return equitySources > 0 ? equitySources : (uwRecord.purchase_price - uwRecord.loan_amount);
  }, [suRows, uwRecord]);
  const dealAnalysis = useMemo(() => computeDealAnalysis(uwRecord, proForma, suRows), [uwRecord, proForma, suRows]);
  const exitResult = useMemo(() => computeExitAnalysis(uwRecord, proForma, totalEquity), [uwRecord, proForma, totalEquity]);
  const returnSummary = useMemo(() => computeReturnSummary(uwRecord, proForma, totalEquity, exitResult), [uwRecord, proForma, totalEquity, exitResult]);
  const sensitivity = useMemo(() => computeSensitivity(uwRecord, proForma, totalEquity), [uwRecord, proForma, totalEquity]);

  const holdYears = uwRecord.hold_period_years || 5;

  // Waterfall
  const cashFlowsForWaterfall = useMemo(() => {
    const flows = [-totalEquity];
    for (let yr = 1; yr <= holdYears; yr++) {
      const pf = proForma.find((p) => p.year === yr);
      flows.push(pf?.cashFlowBeforeTax ?? 0);
    }
    return flows;
  }, [totalEquity, holdYears, proForma]);
  const waterfallResult = useMemo(() =>
    computeWaterfallDistributions(wfTiers, cashFlowsForWaterfall, exitResult.equityReturned, totalEquity),
    [wfTiers, cashFlowsForWaterfall, exitResult, totalEquity]
  );

  // Sources & Uses
  const sources = suRows.filter((s) => s.type === "source");
  const uses = suRows.filter((s) => s.type === "use");
  const sourcesTotal = sources.reduce((sum, s) => sum + s.amount, 0);
  const usesTotal = uses.reduce((sum, s) => sum + s.amount, 0);
  const suGap = sourcesTotal - usesTotal;

  // Avg growth rates for version bar
  const avgIncomeGrowth = incomeRows.filter((r) => !r.is_deduction && r.growth_rate > 0);
  const avgExpGrowth = expenseRows.filter((r) => r.growth_rate > 0);
  const avgIncGr = avgIncomeGrowth.length > 0 ? avgIncomeGrowth.reduce((s, r) => s + r.growth_rate, 0) / avgIncomeGrowth.length : 0;
  const avgExpGr = avgExpGrowth.length > 0 ? avgExpGrowth.reduce((s, r) => s + r.growth_rate, 0) / avgExpGrowth.length : 0;
  const vacancyRow = incomeRows.find((r) => r.line_item.toLowerCase().includes("vacancy"));

  return (
    <div className="flex flex-col gap-5">
      {/* ━━━ VERSION BAR ━━━ */}
      <div
        className="rounded-lg px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1"
        style={{ backgroundColor: T.bg.elevated, border: `1px solid ${T.bg.borderSubtle}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold" style={{ color: T.text.primary }}>
            v{uw?.version ?? 1}
          </span>
          {uw?.status === "active" && (
            <span
              className="rounded px-1.5 py-px text-[10px] font-medium"
              style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }}
            >
              Active
            </span>
          )}
          {uw?.status === "draft" && (
            <span
              className="rounded px-1.5 py-px text-[10px] font-medium"
              style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
            >
              Draft
            </span>
          )}
        </div>
        <span className="text-[12px]" style={{ color: T.text.muted }}>
          Rent growth {(avgIncGr * 100).toFixed(1)}%
          {" · "}Expense growth {(avgExpGr * 100).toFixed(1)}% avg
          {vacancyRow ? ` · Vacancy ${(vacancyRow.growth_rate * 100).toFixed(1)}%` : ""}
          {uwRecord.exit_cap_rate > 0 ? ` · Exit cap ${(uwRecord.exit_cap_rate * 100).toFixed(2)}%` : ""}
        </span>
      </div>

      {/* ━━━ SECTION 1: DEAL ANALYSIS ━━━ */}
      <SectionCard title="Deal Analysis">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPIMetric label="Current NOI" value={fC(dealAnalysis.currentNOI)} />
          <KPIMetric label="Going-In Cap" value={fPct(dealAnalysis.goingInCap)} />
          <KPIMetric label="Year 1 DSCR" value={fX(dealAnalysis.year1DSCR)} negative={dealAnalysis.year1DSCR != null && dealAnalysis.year1DSCR < 1} />
          <KPIMetric label="Cash-on-Cash" value={fPct(dealAnalysis.cashOnCash)} negative={dealAnalysis.cashOnCash != null && dealAnalysis.cashOnCash < 0} />
          <KPIMetric label="Debt Yield" value={fPct(dealAnalysis.debtYield)} />
          <KPIMetric label="Price / Unit" value={fC(dealAnalysis.pricePerUnit)} subtitle={uwRecord.num_units > 0 ? `${uwRecord.num_units} units` : undefined} />
          <KPIMetric label="Price / SF" value={fC(dealAnalysis.pricePerSF)} subtitle={uwRecord.total_sf > 0 ? `${Number(uwRecord.total_sf).toLocaleString()} SF` : undefined} />
          <KPIMetric label="NOI / Unit" value={fC(dealAnalysis.noiPerUnit)} />
          <KPIMetric label="Yield-on-Cost" value={fPct(dealAnalysis.yieldOnCost)} />
          <KPIMetric label="Equity Multiple" value={returnSummary.equityMultiple != null ? fX(returnSummary.equityMultiple) : "—"} />
        </div>
      </SectionCard>

      {/* ━━━ SECTION 2: 5-YEAR PRO FORMA ━━━ */}
      <SectionCard title="5-Year Pro Forma" noPad>
        <div className="px-1 pb-1">
          <div className="text-[12px] px-3 pt-3 pb-2" style={{ color: T.text.muted }}>
            Lender assumptions · Year 1 actuals projected at lender growth rates
          </div>
          <div className="overflow-x-auto">
            <ProFormaTable proForma={proForma} holdYears={holdYears} />
          </div>
        </div>
      </SectionCard>

      {/* ━━━ SECTION 3: RETURN SUMMARY ━━━ */}
      <SectionCard title={`Return Summary — ${holdYears} Year Hold`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPIMetric label="Levered IRR" value={returnSummary.leveredIRR != null ? `${(returnSummary.leveredIRR * 100).toFixed(1)}%` : "—"} />
          <KPIMetric label="Equity Multiple" value={returnSummary.equityMultiple != null ? fX(returnSummary.equityMultiple) : "—"} />
          <KPIMetric label="Avg Cash-on-Cash" value={returnSummary.avgCashOnCash != null ? `${(returnSummary.avgCashOnCash * 100).toFixed(1)}%` : "—"} />
          <KPIMetric label="Total Profit" value={fC(returnSummary.totalProfit)} />
          <KPIMetric label="Total Equity In" value={fC(returnSummary.totalEquityIn)} />
          <KPIMetric label="Total Distributions" value={fC(returnSummary.totalDistributions)} />
        </div>
      </SectionCard>

      {/* ━━━ SECTION 4: SOURCES & USES ━━━ */}
      <SectionCard title="Sources & Uses">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Sources */}
          <div className="pr-0 md:pr-4" style={{ borderRight: `1px solid ${T.bg.borderSubtle}` }}>
            <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: T.text.muted }}>Sources</div>
            {sources.length === 0 && <div className="text-[13px] py-2" style={{ color: T.text.muted }}>No sources entered</div>}
            {sources.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                <span className="text-[13px]" style={{ color: T.text.primary }}>{s.line_item}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] num" style={{ color: T.text.primary }}>{fC(s.amount)}</span>
                  {sourcesTotal > 0 && (
                    <span className="text-[11px] num" style={{ color: T.text.muted }}>{((s.amount / sourcesTotal) * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            ))}
            {sources.length > 0 && (
              <div className="flex items-center justify-between py-2 font-semibold">
                <span className="text-[13px]" style={{ color: T.text.primary }}>Total</span>
                <span className="text-[13px] num" style={{ color: T.text.primary }}>{fC(sourcesTotal)}</span>
              </div>
            )}
          </div>

          {/* Uses */}
          <div className="pl-0 md:pl-4 mt-4 md:mt-0">
            <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: T.text.muted }}>Uses</div>
            {uses.length === 0 && <div className="text-[13px] py-2" style={{ color: T.text.muted }}>No uses entered</div>}
            {uses.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                <span className="text-[13px]" style={{ color: T.text.primary }}>{s.line_item}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] num" style={{ color: T.text.primary }}>{fC(s.amount)}</span>
                  {usesTotal > 0 && (
                    <span className="text-[11px] num" style={{ color: T.text.muted }}>{((s.amount / usesTotal) * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            ))}
            {uses.length > 0 && (
              <div className="flex items-center justify-between py-2 font-semibold">
                <span className="text-[13px]" style={{ color: T.text.primary }}>Total</span>
                <span className="text-[13px] num" style={{ color: T.text.primary }}>{fC(usesTotal)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gap warning */}
        {sources.length > 0 && uses.length > 0 && Math.abs(suGap) > 1 && (
          <div
            className="mt-4 flex items-center gap-2 rounded-r-md px-4 py-3 text-[13px]"
            style={{
              backgroundColor: T.accent.amberMuted,
              color: T.accent.amber,
              borderLeft: `4px solid ${T.accent.amber}`,
            }}
          >
            <AlertTriangle size={14} strokeWidth={1.5} />
            Gap: {fC(suGap)} — {suGap < 0 ? "Uses exceed Sources" : "Sources exceed Uses"}
          </div>
        )}
      </SectionCard>

      {/* ━━━ SECTION 5: WATERFALL ━━━ */}
      <SectionCard title="Distribution Waterfall">
        {wfTiers.length === 0 ? (
          <div className="text-[13px] py-4 text-center" style={{ color: T.text.muted }}>
            No waterfall tiers configured yet
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Tier</th>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Structure</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Hurdle</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Sponsor</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Investor</th>
                  </tr>
                </thead>
                <tbody>
                  {wfTiers.sort((a, b) => a.tier_order - b.tier_order).map((tier, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] font-medium px-3 py-2" style={{ color: T.text.primary }}>{tier.tier_name}</td>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>
                        {tier.is_catch_up ? "Catch-up" : tier.hurdle_rate ? "Pref Return" : "Remaining Split"}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                        {tier.hurdle_rate != null ? fPct(tier.hurdle_rate) : "—"}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                        {tier.sponsor_split != null ? fPct(tier.sponsor_split) : "—"}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                        {tier.investor_split != null ? fPct(tier.investor_split) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modeled distributions */}
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.bg.borderSubtle}` }}>
              <div className="text-[11px] uppercase tracking-wider font-bold mb-3" style={{ color: T.text.muted }}>
                Modeled Distributions ({holdYears}yr)
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                <div className="flex justify-between py-1">
                  <span className="text-[13px]" style={{ color: T.text.secondary }}>Investor Total</span>
                  <span className="text-[13px] num font-medium" style={{ color: T.text.primary }}>
                    {fC(waterfallResult.investorTotal)}
                    {totalEquity > 0 && <span className="text-[11px] ml-1" style={{ color: T.text.muted }}>({fX(waterfallResult.investorTotal / totalEquity)} on {fC(totalEquity)})</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[13px]" style={{ color: T.text.secondary }}>Sponsor Total</span>
                  <span className="text-[13px] num font-medium" style={{ color: T.text.primary }}>{fC(waterfallResult.sponsorTotal)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </SectionCard>

      {/* ━━━ SECTION 6: EXIT ANALYSIS ━━━ */}
      <SectionCard title="Exit Analysis">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
          <KPIMetric label="Exit Cap Rate" value={uwRecord.exit_cap_rate > 0 ? fPct(uwRecord.exit_cap_rate) : "—"} />
          <KPIMetric label="Exit Price" value={fC(exitResult.exitPrice)} />
          <KPIMetric label="Sale Costs" value={fC(exitResult.saleCosts)} />
          <KPIMetric label="Net Proceeds" value={fC(exitResult.netProceeds)} />
          <KPIMetric label="Loan Payoff" value={fC(exitResult.loanPayoff)} />
          <KPIMetric label="Equity Returned" value={fC(exitResult.equityReturned)} />
          <KPIMetric label="Total Profit" value={fC(exitResult.totalProfit)} negative={exitResult.totalProfit < 0} />
        </div>

        {/* Sensitivity Table */}
        {sensitivity.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: T.text.muted }}>
              Exit Cap Sensitivity
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Exit Cap</th>
                    {sensitivity.map((s, i) => (
                      <th
                        key={i}
                        className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2"
                        style={{
                          color: T.text.muted,
                          backgroundColor: s.isBase ? T.bg.hover : undefined,
                        }}
                      >
                        {(s.exitCap * 100).toFixed(2)}%
                        {s.isBase && " *"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>Exit Price</td>
                    {sensitivity.map((s, i) => (
                      <td
                        key={i}
                        className="text-right text-[13px] num px-3 py-2"
                        style={{
                          color: T.text.primary,
                          backgroundColor: s.isBase ? T.bg.hover : undefined,
                          fontWeight: s.isBase ? 600 : 400,
                        }}
                      >
                        {fCk(s.exitPrice)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>Equity Mult</td>
                    {sensitivity.map((s, i) => (
                      <td
                        key={i}
                        className="text-right text-[13px] num px-3 py-2"
                        style={{
                          color: T.text.primary,
                          backgroundColor: s.isBase ? T.bg.hover : undefined,
                          fontWeight: s.isBase ? 600 : 400,
                        }}
                      >
                        {fX(s.equityMultiple)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>Levered IRR</td>
                    {sensitivity.map((s, i) => (
                      <td
                        key={i}
                        className="text-right text-[13px] num px-3 py-2"
                        style={{
                          color: T.text.primary,
                          backgroundColor: s.isBase ? T.bg.hover : undefined,
                          fontWeight: s.isBase ? 600 : 400,
                        }}
                      >
                        {s.leveredIRR !== 0 ? `${(s.leveredIRR * 100).toFixed(1)}%` : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── KPI Metric ──

function KPIMetric({
  label,
  value,
  subtitle,
  negative,
}: {
  label: string;
  value: string;
  subtitle?: string;
  negative?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg px-3.5 py-3"
      style={{
        backgroundColor: T.bg.elevated,
        border: `1px solid ${T.bg.borderSubtle}`,
      }}
    >
      <span className="text-[11px] uppercase tracking-[0.05em] font-semibold" style={{ color: T.text.muted }}>
        {label}
      </span>
      <span
        className="num text-[22px] font-bold tracking-tight"
        style={{ color: negative ? T.accent.red : T.text.primary }}
      >
        {value}
      </span>
      {subtitle && (
        <span className="text-[11px] mt-0.5" style={{ color: T.text.muted }}>{subtitle}</span>
      )}
    </div>
  );
}

// ── Pro Forma Table ──

function ProFormaTable({
  proForma,
  holdYears,
}: {
  proForma: ProFormaYearResult[];
  holdYears: number;
}) {
  const t12 = proForma.find((p) => p.year === 0);
  const years = proForma.filter((p) => p.year >= 1 && p.year <= holdYears);

  // Build combined row keys from first available year
  const firstYear = t12 || years[0];
  if (!firstYear) {
    return <div className="text-[13px] py-4 text-center" style={{ color: T.text.muted }}>No pro forma data available</div>;
  }

  const incomeLabels = firstYear.incomeRows.map((r) => r.label);
  const expenseLabels = firstYear.expenseRows.map((r) => r.label);

  const colHeaders = [
    ...(t12 ? ["T12"] : []),
    ...years.map((y) => `Year ${y.year}`),
  ];

  function getVal(pf: ProFormaYearResult | undefined, type: "income" | "expense" | "metric", key: string): number | null {
    if (!pf) return null;
    if (type === "income") {
      const row = pf.incomeRows.find((r) => r.label === key);
      return row?.amount ?? null;
    }
    if (type === "expense") {
      const row = pf.expenseRows.find((r) => r.label === key);
      return row?.amount ?? null;
    }
    switch (key) {
      case "netRevenue": return pf.netRevenue;
      case "totalExpenses": return pf.totalExpenses;
      case "noi": return pf.noi;
      case "debtService": return pf.debtService;
      case "cfbt": return pf.cashFlowBeforeTax;
      case "dscr": return pf.dscr;
      default: return null;
    }
  }

  const allPFs = [...(t12 ? [t12] : []), ...years];

  return (
    <table className="w-full border-collapse min-w-[600px]">
      <thead>
        <tr style={{ backgroundColor: T.bg.elevated }}>
          <th className="text-left text-[11px] uppercase tracking-[0.04em] font-semibold px-3 py-2 sticky left-0 z-10" style={{ color: T.text.muted, backgroundColor: T.bg.elevated }}>&nbsp;</th>
          {colHeaders.map((h, i) => (
            <th key={i} className="text-right text-[11px] uppercase tracking-[0.04em] font-semibold px-3 py-2" style={{ color: T.text.muted }}>
              {h === "T12" && <span className="inline-block h-[6px] w-[6px] rounded-full mr-1" style={{ backgroundColor: T.accent.green }} />}
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* INCOME section label */}
        <tr>
          <td
            colSpan={colHeaders.length + 1}
            className="text-[11px] uppercase tracking-[0.05em] font-bold px-3 py-1.5"
            style={{ color: T.text.muted, backgroundColor: T.bg.surface }}
          >
            Income
          </td>
        </tr>

        {incomeLabels.map((label) => {
          const isDeduction = firstYear.incomeRows.find((r) => r.label === label)?.isDeduction;
          return (
            <tr key={label} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}08` }}>
              <td className="text-[13px] px-3 py-1.5 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>
                {isDeduction ? `(${label})` : label}
              </td>
              {allPFs.map((pf, i) => {
                const val = getVal(pf, "income", label);
                return (
                  <td
                    key={i}
                    className="text-right text-[13px] num px-3 py-1.5"
                    style={{ color: isDeduction ? T.accent.red : T.text.primary }}
                  >
                    {val != null ? (val < 0 ? `(${fC(Math.abs(val))})` : fC(val)) : "—"}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {/* NET REVENUE */}
        <tr style={{ borderTop: `1px solid ${T.bg.border}`, borderBottom: `1px solid ${T.bg.border}` }}>
          <td className="text-[13px] font-semibold px-3 py-1.5 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>Net Revenue</td>
          {allPFs.map((pf, i) => (
            <td key={i} className="text-right text-[13px] font-semibold num px-3 py-1.5" style={{ color: T.text.primary }}>{fC(pf.netRevenue)}</td>
          ))}
        </tr>

        {/* EXPENSES section label */}
        <tr>
          <td
            colSpan={colHeaders.length + 1}
            className="text-[11px] uppercase tracking-[0.05em] font-bold px-3 py-1.5"
            style={{ color: T.text.muted, backgroundColor: T.bg.surface }}
          >
            Expenses
          </td>
        </tr>

        {expenseLabels.map((label) => (
          <tr key={label} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}08` }}>
            <td className="text-[13px] px-3 py-1.5 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>{label}</td>
            {allPFs.map((pf, i) => {
              const val = getVal(pf, "expense", label);
              return (
                <td key={i} className="text-right text-[13px] num px-3 py-1.5" style={{ color: T.text.primary }}>
                  {val != null ? fC(val) : "—"}
                </td>
              );
            })}
          </tr>
        ))}

        {/* TOTAL EXPENSES */}
        <tr style={{ borderTop: `1px solid ${T.bg.border}` }}>
          <td className="text-[13px] font-semibold px-3 py-1.5 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>Total Expenses</td>
          {allPFs.map((pf, i) => (
            <td key={i} className="text-right text-[13px] font-semibold num px-3 py-1.5" style={{ color: T.text.primary }}>{fC(pf.totalExpenses)}</td>
          ))}
        </tr>

        {/* NOI */}
        <tr style={{ borderTop: `2px solid ${T.bg.border}` }}>
          <td className="text-[13px] font-bold px-3 py-2 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>Net Operating Income</td>
          {allPFs.map((pf, i) => (
            <td key={i} className="text-right text-[13px] font-bold num px-3 py-2" style={{ color: T.text.primary }}>{fC(pf.noi)}</td>
          ))}
        </tr>

        {/* DEBT SERVICE section */}
        <tr>
          <td
            colSpan={colHeaders.length + 1}
            className="text-[11px] uppercase tracking-[0.05em] font-bold px-3 py-1.5"
            style={{ color: T.text.muted, backgroundColor: T.bg.surface }}
          >
            Debt Service
          </td>
        </tr>

        <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
          <td className="text-[13px] px-3 py-1.5 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>Annual Debt Service</td>
          {allPFs.map((pf, i) => (
            <td key={i} className="text-right text-[13px] num px-3 py-1.5" style={{ color: T.text.primary }}>
              {pf.year === 0 ? "—" : fC(pf.debtService)}
            </td>
          ))}
        </tr>

        {/* CASH FLOW BEFORE TAX */}
        <tr style={{ borderTop: `1px solid ${T.bg.border}` }}>
          <td className="text-[13px] font-semibold px-3 py-1.5 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>Cash Flow Before Tax</td>
          {allPFs.map((pf, i) => (
            <td
              key={i}
              className="text-right text-[13px] font-semibold num px-3 py-1.5"
              style={{ color: pf.year > 0 && pf.cashFlowBeforeTax < 0 ? T.accent.red : T.text.primary }}
            >
              {pf.year === 0 ? "—" : fC(pf.cashFlowBeforeTax)}
            </td>
          ))}
        </tr>

        {/* DSCR */}
        <tr style={{ borderTop: `1px solid ${T.bg.border}` }}>
          <td className="text-[13px] font-bold px-3 py-2 sticky left-0 z-10" style={{ color: T.text.primary, backgroundColor: T.bg.surface }}>DSCR</td>
          {allPFs.map((pf, i) => (
            <td
              key={i}
              className="text-right text-[13px] font-bold num px-3 py-2"
              style={{ color: pf.year > 0 && pf.dscr < 1 ? T.accent.red : T.text.primary }}
            >
              {pf.year === 0 ? "—" : `${pf.dscr.toFixed(2)}x`}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
