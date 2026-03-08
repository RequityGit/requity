"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Scale,
  TrendingUp,
  Banknote,
  ArrowRight,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeProForma,
  computeDealAnalysis,
  computeExitAnalysis,
  computeReturnSummary,
  computeSensitivity,
  computeWaterfallDistributions,
  computeAnnualDebtService,
  type DealIncomeRow,
  type DealExpenseRow,
  type DealUWRecord,
  type DealSourceUseRow,
  type DealWaterfallTier,
  type ProFormaYearResult,
} from "@/lib/commercial-uw/deal-computations";
import { PillNav } from "./financials/shared";

// ── Types ──

export interface CommercialUWData {
  uw: Record<string, unknown>;
  income: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  rentRoll: Record<string, unknown>[];
  scopeOfWork: Record<string, unknown>[];
  sourcesUses: Record<string, unknown>[];
  debt: Record<string, unknown>[];
  waterfall: Record<string, unknown>[];
  allVersions: Record<string, unknown>[];
}

interface CommercialUnderwritingTabProps {
  data: CommercialUWData;
  dealId: string;
}

// ── Helpers ──

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

function fC(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  if (v < 0) return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fCk(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  const abs = Math.abs(v);
  const str = abs >= 1_000_000 ? `$${(abs / 1_000_000).toFixed(2)}M` : abs >= 1_000 ? `$${(abs / 1_000).toFixed(0)}K` : `$${abs.toFixed(0)}`;
  return v < 0 ? `(${str})` : str;
}

function fPct(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  return `${(v * 100).toFixed(2)}%`;
}

function fX(v: number | null | undefined): string {
  if (v == null) return "\u2014";
  return `${v.toFixed(2)}x`;
}

// ── Sub-tab keys ──

const UW_TABS = [
  { key: "pro-forma" as const, label: "Pro Forma", icon: BarChart3 },
  { key: "sensitivity" as const, label: "Sensitivity", icon: Scale },
  { key: "returns" as const, label: "Returns & Exit", icon: TrendingUp },
];

type UWTabKey = (typeof UW_TABS)[number]["key"];

// ── Main Component ──

export function CommercialUnderwritingTab({ data, dealId }: CommercialUnderwritingTabProps) {
  const [activeTab, setActiveTab] = useState<UWTabKey>("pro-forma");
  const { uw, income, expenses, sourcesUses, waterfall, debt } = data;

  const incomeRows: DealIncomeRow[] = useMemo(
    () => income.map((r) => ({ id: String(r.id ?? ""), line_item: String(r.line_item ?? ""), t12_amount: n(r.t12_amount), year_1_amount: n(r.year_1_amount), growth_rate: n(r.growth_rate), is_deduction: Boolean(r.is_deduction), sort_order: n(r.sort_order) })),
    [income]
  );

  const expenseRows: DealExpenseRow[] = useMemo(
    () => expenses.map((r) => ({ id: String(r.id ?? ""), category: String(r.category ?? ""), t12_amount: n(r.t12_amount), year_1_amount: n(r.year_1_amount), growth_rate: n(r.growth_rate), is_percentage: Boolean(r.is_percentage), sort_order: n(r.sort_order) })),
    [expenses]
  );

  const uwRecord: DealUWRecord = useMemo(() => ({
    purchase_price: n(uw?.purchase_price), closing_costs: n(uw?.closing_costs), capex_reserve: n(uw?.capex_reserve),
    working_capital: n(uw?.working_capital), num_units: n(uw?.num_units), total_sf: n(uw?.total_sf),
    loan_amount: n(uw?.loan_amount), interest_rate: n(uw?.interest_rate), amortization_years: n(uw?.amortization_years),
    loan_term_years: n(uw?.loan_term_years), io_period_months: n(uw?.io_period_months), origination_fee_pct: n(uw?.origination_fee_pct),
    exit_cap_rate: n(uw?.exit_cap_rate), hold_period_years: n(uw?.hold_period_years) || 5,
    sale_costs_pct: n(uw?.sale_costs_pct), disposition_fee_pct: n(uw?.disposition_fee_pct),
  }), [uw]);

  const suRows: DealSourceUseRow[] = useMemo(
    () => sourcesUses.map((r) => ({ type: (r.type as "source" | "use") ?? "use", line_item: String(r.line_item ?? ""), amount: n(r.amount) })),
    [sourcesUses]
  );

  const wfTiers: DealWaterfallTier[] = useMemo(
    () => waterfall.map((r) => ({ tier_order: n(r.tier_order), tier_name: String(r.tier_name ?? ""), hurdle_rate: r.hurdle_rate != null ? n(r.hurdle_rate) : null, sponsor_split: r.sponsor_split != null ? n(r.sponsor_split) : null, investor_split: r.investor_split != null ? n(r.investor_split) : null, is_catch_up: Boolean(r.is_catch_up) })),
    [waterfall]
  );

  // Debt tranches
  const debtTranches = useMemo(
    () => debt.map((d) => ({
      tranche_name: String(d.tranche_name ?? ""),
      loan_type: String(d.loan_type ?? ""),
      loan_amount: n(d.loan_amount),
      interest_rate: n(d.interest_rate),
      term_years: n(d.term_years),
      amortization_years: n(d.amortization_years),
      io_period_months: n(d.io_period_months),
      origination_fee_pct: n(d.origination_fee_pct),
      lender_name: String(d.lender_name ?? ""),
      sort_order: n(d.sort_order),
    })).sort((a, b) => a.sort_order - b.sort_order),
    [debt]
  );

  const proForma = useMemo(() => computeProForma(incomeRows, expenseRows, uwRecord), [incomeRows, expenseRows, uwRecord]);

  const totalEquity = useMemo(() => {
    const eq = suRows.filter((s) => s.type === "source" && s.line_item.toLowerCase().includes("equity")).reduce((sum, s) => sum + s.amount, 0);
    return eq > 0 ? eq : uwRecord.purchase_price - uwRecord.loan_amount;
  }, [suRows, uwRecord]);

  const dealAnalysis = useMemo(() => computeDealAnalysis(uwRecord, proForma, suRows), [uwRecord, proForma, suRows]);
  const exitResult = useMemo(() => computeExitAnalysis(uwRecord, proForma, totalEquity), [uwRecord, proForma, totalEquity]);
  const returnSummary = useMemo(() => computeReturnSummary(uwRecord, proForma, totalEquity, exitResult), [uwRecord, proForma, totalEquity, exitResult]);
  const sensitivity = useMemo(() => computeSensitivity(uwRecord, proForma, totalEquity), [uwRecord, proForma, totalEquity]);

  const holdYears = uwRecord.hold_period_years || 5;
  const ads = computeAnnualDebtService(uwRecord);

  const cashFlowsForWaterfall = useMemo(() => {
    const flows = [-totalEquity];
    for (let yr = 1; yr <= holdYears; yr++) {
      const pf = proForma.find((p) => p.year === yr);
      flows.push(pf?.cashFlowBeforeTax ?? 0);
    }
    return flows;
  }, [totalEquity, holdYears, proForma]);

  const waterfallResult = useMemo(
    () => computeWaterfallDistributions(wfTiers, cashFlowsForWaterfall, exitResult.equityReturned, totalEquity),
    [wfTiers, cashFlowsForWaterfall, exitResult, totalEquity]
  );

  // T12 values
  const t12 = proForma.find((p) => p.year === 0);
  const yr1 = proForma.find((p) => p.year === 1);

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tab pills */}
      <div className="flex items-center justify-between">
        <PillNav tabs={UW_TABS} active={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" /> Last saved {uw?.updated_at ? new Date(String(uw.updated_at)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—"}
        </div>
      </div>

      {activeTab === "pro-forma" && (
        <ProFormaContent
          proForma={proForma}
          dealAnalysis={dealAnalysis}
          uwRecord={uwRecord}
          holdYears={holdYears}
          ads={ads}
          debtTranches={debtTranches}
        />
      )}

      {activeTab === "sensitivity" && (
        <SensitivityContent
          uwRecord={uwRecord}
          proForma={proForma}
          ads={ads}
          incomeRows={incomeRows}
        />
      )}

      {activeTab === "returns" && (
        <ReturnsContent
          exitResult={exitResult}
          returnSummary={returnSummary}
          uwRecord={uwRecord}
          proForma={proForma}
          totalEquity={totalEquity}
          holdYears={holdYears}
          ads={ads}
        />
      )}
    </div>
  );
}

// ── KPI Card ──

function KPICard({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-muted-foreground">{label}</div>
      <div className={cn("num text-xl font-semibold tracking-tight mt-0.5", accent)}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({ title, children, noPadding }: { title: string; children: React.ReactNode; noPadding?: boolean }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className={noPadding ? "px-5 pt-5" : "p-5"}>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      </div>
      <div className={noPadding ? "" : "px-5 pb-5"}>{children}</div>
    </div>
  );
}

// ── Pro Forma Content ──

function ProFormaContent({
  proForma, dealAnalysis, uwRecord, holdYears, ads, debtTranches,
}: {
  proForma: ProFormaYearResult[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dealAnalysis: any;
  uwRecord: DealUWRecord;
  holdYears: number;
  ads: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debtTranches: any[];
}) {
  const t12 = proForma.find((p) => p.year === 0);
  const yr1 = proForma.find((p) => p.year === 1);
  const years = proForma.filter((p) => p.year >= 1 && p.year <= holdYears);

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="T-12 NOI" value={fC(t12?.noi ?? 0)} />
        <KPICard label="Year 1 NOI" value={fC(yr1?.noi ?? 0)} accent="text-blue-500" />
        <KPICard label="Stabilized NOI" value={fC(years[years.length - 1]?.noi ?? 0)} accent="text-green-500" />
        <KPICard label="DSCR (Yr1)" value={yr1 ? fX(yr1.dscr) : "\u2014"} accent={yr1 && yr1.dscr >= 1.2 ? "text-green-500" : "text-red-500"} />
        <KPICard label="LTV" value={uwRecord.purchase_price > 0 ? `${((uwRecord.loan_amount / uwRecord.purchase_price) * 100).toFixed(1)}%` : "\u2014"} />
        <KPICard label="Going-In Cap" value={fPct(dealAnalysis.goingInCap)} />
      </div>

      {/* Operating Statement */}
      <Section title="Operating Statement" noPadding>
        <div className="overflow-x-auto px-1 pb-1">
          <ProFormaTable proForma={proForma} holdYears={holdYears} />
        </div>
      </Section>

      {/* Cap Rate Valuation Table */}
      <Section title="Cap Rate Valuation Table">
        <CapRateTable proForma={proForma} uwRecord={uwRecord} holdYears={holdYears} />
      </Section>

      {/* Financing Cards */}
      {debtTranches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debtTranches.map((tranche, i) => (
            <Section key={i} title={tranche.tranche_name || `Tranche ${i + 1}`}>
              {[
                ["Lender", tranche.lender_name || "\u2014"],
                ["Loan Amount", fC(tranche.loan_amount)],
                ["Interest Rate", tranche.interest_rate > 0 ? `${(tranche.interest_rate * 100).toFixed(2)}%` : "\u2014"],
                ["Term", tranche.term_years > 0 ? `${tranche.term_years} years` : "\u2014"],
                ["Amortization", tranche.amortization_years > 0 ? `${tranche.amortization_years} years` : "Interest Only"],
                ["IO Period", tranche.io_period_months > 0 ? `${tranche.io_period_months} months` : "\u2014"],
                ["Origination", tranche.origination_fee_pct > 0 ? `${(tranche.origination_fee_pct * 100).toFixed(2)} pts` : "\u2014"],
              ].map(([l, v], j) => (
                <div key={j} className="flex justify-between py-2 border-b text-[13px]">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-medium num">{v}</span>
                </div>
              ))}
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sensitivity Content ──

function SensitivityContent({
  uwRecord, proForma, ads, incomeRows,
}: {
  uwRecord: DealUWRecord;
  proForma: ProFormaYearResult[];
  ads: number;
  incomeRows: DealIncomeRow[];
}) {
  const baseRate = uwRecord.interest_rate > 0 ? uwRecord.interest_rate * 100 : 11.5;
  const rates = [baseRate - 2.5, baseRate - 1.5, baseRate - 0.5, baseRate, baseRate + 0.5, baseRate + 1.5];
  const vacancies = [3, 5, 8, 10, 12, 15];

  // Get Year 1 GPR and OpEx from pro forma
  const yr1 = proForma.find((p) => p.year === 1);
  const gpr = yr1?.incomeRows.find((r) => !r.isDeduction)?.amount ?? 0;
  const totalOpex = yr1?.totalExpenses ?? 0;

  return (
    <Section title="DSCR Sensitivity — Rate vs. Vacancy">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left px-2.5 py-2 text-[11px] text-muted-foreground">Rate \u2193 / Vacancy \u2192</th>
              {vacancies.map((v) => (
                <th key={v} className={cn("text-center px-2.5 py-2 text-[11px]", v === 8 ? "text-blue-500 font-bold" : "text-muted-foreground")}>{v}%</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate} className="border-b">
                <td className={cn("px-2.5 py-2", Math.abs(rate - baseRate) < 0.01 ? "text-blue-500 font-bold" : "")}>{rate.toFixed(1)}%</td>
                {vacancies.map((vac) => {
                  const adjEgi = gpr * (1 - vac / 100) * 0.98; // ~2% bad debt
                  const adjNoi = adjEgi - totalOpex;
                  const adjAds = (uwRecord.loan_amount * (rate / 100));
                  const dscr = adjAds > 0 ? adjNoi / adjAds : 0;
                  const isBase = Math.abs(rate - baseRate) < 0.01 && vac === 8;

                  return (
                    <td key={vac} className={cn(
                      "text-center px-2.5 py-2 num font-medium",
                      isBase && "bg-blue-500/10 rounded",
                      dscr >= 1.25 ? "text-green-500" : dscr >= 1.0 ? "text-amber-500" : "text-red-500"
                    )}>
                      {dscr > 0 ? `${dscr.toFixed(2)}x` : "\u2014"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> &ge; 1.25x</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 1.00–1.24x</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt; 1.00x</span>
      </div>
    </Section>
  );
}

// ── Returns Content ──

function ReturnsContent({
  exitResult, returnSummary, uwRecord, proForma, totalEquity, holdYears, ads,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exitResult: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returnSummary: any;
  uwRecord: DealUWRecord;
  proForma: ProFormaYearResult[];
  totalEquity: number;
  holdYears: number;
  ads: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Exit Analysis */}
      <Section title="Exit Analysis">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-5">
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Hold Period</div>
            <div className="text-xl font-semibold num">{holdYears} Years</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Exit Value</div>
            <div className="text-xl font-semibold num">{fC(exitResult.exitPrice)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">@ {uwRecord.exit_cap_rate > 0 ? fPct(uwRecord.exit_cap_rate) : "\u2014"} exit cap</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Net Proceeds</div>
            <div className="text-xl font-semibold num text-green-500">{fC(exitResult.netProceeds)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">After debt payoff + disp costs</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Equity Multiple</div>
            <div className="text-xl font-semibold num text-green-500">
              {returnSummary.equityMultiple != null ? fX(returnSummary.equityMultiple) : "\u2014"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">on {fC(totalEquity)} equity</div>
          </div>
        </div>

        {/* Return metric cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Levered IRR", value: returnSummary.leveredIRR != null ? `${(returnSummary.leveredIRR * 100).toFixed(1)}%` : "\u2014", accent: "text-green-500" },
            { label: "Cash-on-Cash (Yr1)", value: returnSummary.avgCashOnCash != null ? `${(returnSummary.avgCashOnCash * 100).toFixed(1)}%` : "\u2014", accent: "text-blue-500" },
            { label: "Unlevered Yield", value: uwRecord.purchase_price > 0 ? `${(((proForma.find((p) => p.year === 1)?.noi ?? 0) / uwRecord.purchase_price) * 100).toFixed(1)}%` : "\u2014" },
          ].map((m, i) => (
            <div key={i} className="rounded-lg border bg-muted/30 px-5 py-5 text-center">
              <div className={cn("text-3xl font-bold num", m.accent)}>{m.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Year-by-Year Cash Flow */}
      <Section title="Year-by-Year Cash Flow" noPadding>
        <div className="overflow-x-auto px-1 pb-1">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2" />
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">Year 0</th>
                {Array.from({ length: holdYears }, (_, i) => (
                  <th key={i} className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
                    Year {i + 1}{i + 1 === holdYears ? " (Exit)" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Equity Invested", getVal: (yr: number) => yr === 0 ? -totalEquity : null },
                { label: "NOI", getVal: (yr: number) => yr === 0 ? null : proForma.find((p) => p.year === yr)?.noi ?? 0 },
                { label: "Debt Service", getVal: (yr: number) => yr === 0 ? null : -(proForma.find((p) => p.year === yr)?.debtService ?? 0) },
                { label: "Net Cash Flow", getVal: (yr: number) => yr === 0 ? null : proForma.find((p) => p.year === yr)?.cashFlowBeforeTax ?? 0, bold: true },
                { label: "Sale Proceeds", getVal: (yr: number) => yr === holdYears ? exitResult.equityReturned : null },
                { label: "Total Cash Flow", getVal: (yr: number) => {
                  if (yr === 0) return -totalEquity;
                  const ncf = proForma.find((p) => p.year === yr)?.cashFlowBeforeTax ?? 0;
                  return yr === holdYears ? ncf + exitResult.equityReturned : ncf;
                }, bold: true, highlight: true },
              ].map((row, ri) => (
                <tr key={ri} className={cn("border-b", row.highlight && "bg-green-500/5 border-green-500/20")}>
                  <td className={cn("px-3 py-2 sticky left-0 z-10 bg-card", row.bold && "font-bold", row.highlight && "bg-green-500/5")}>{row.label}</td>
                  {Array.from({ length: holdYears + 1 }, (_, yr) => {
                    const val = row.getVal(yr);
                    return (
                      <td key={yr} className={cn(
                        "text-right px-3 py-2 num",
                        row.bold && "font-bold",
                        row.highlight && "text-green-500",
                        !row.highlight && val != null && val < 0 && "text-red-500",
                        val == null && "text-muted-foreground",
                      )}>
                        {val != null ? fC(val) : "\u2014"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ── Pro Forma Table ──

function ProFormaTable({ proForma, holdYears }: { proForma: ProFormaYearResult[]; holdYears: number }) {
  const t12 = proForma.find((p) => p.year === 0);
  const years = proForma.filter((p) => p.year >= 1 && p.year <= holdYears);
  const firstYear = t12 || years[0];

  if (!firstYear) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No pro forma data available</p>;
  }

  const incomeLabels = firstYear.incomeRows.map((r) => r.label);
  const expenseLabels = firstYear.expenseRows.map((r) => r.label);
  const colHeaders = [...(t12 ? ["T12"] : []), ...years.map((y) => `Year ${y.year}`)];
  const allPFs = [...(t12 ? [t12] : []), ...years];

  function getVal(pf: ProFormaYearResult, type: "income" | "expense", key: string): number | null {
    if (type === "income") return pf.incomeRows.find((r) => r.label === key)?.amount ?? null;
    return pf.expenseRows.find((r) => r.label === key)?.amount ?? null;
  }

  return (
    <table className="w-full text-sm min-w-[600px]">
      <thead>
        <tr className="bg-muted/50">
          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 sticky left-0 z-10 bg-muted/50">&nbsp;</th>
          {colHeaders.map((h, i) => (
            <th key={i} className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr><td colSpan={colHeaders.length + 1} className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 bg-card">Income</td></tr>
        {incomeLabels.map((label) => {
          const isDeduction = firstYear.incomeRows.find((r) => r.label === label)?.isDeduction;
          return (
            <tr key={label} className="border-b border-border/30">
              <td className="px-3 py-1.5 sticky left-0 z-10 bg-card">{isDeduction ? `(${label})` : label}</td>
              {allPFs.map((pf, i) => {
                const val = getVal(pf, "income", label);
                return <td key={i} className={cn("text-right px-3 py-1.5 num", isDeduction && "text-destructive")}>{val != null ? (val < 0 ? `(${fC(Math.abs(val))})` : fC(val)) : "\u2014"}</td>;
              })}
            </tr>
          );
        })}
        <tr className="border-y border-border">
          <td className="px-3 py-1.5 font-semibold sticky left-0 z-10 bg-card">Net Revenue</td>
          {allPFs.map((pf, i) => <td key={i} className="text-right px-3 py-1.5 font-semibold num">{fC(pf.netRevenue)}</td>)}
        </tr>
        <tr><td colSpan={colHeaders.length + 1} className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 bg-card">Expenses</td></tr>
        {expenseLabels.map((label) => (
          <tr key={label} className="border-b border-border/30">
            <td className="px-3 py-1.5 sticky left-0 z-10 bg-card">{label}</td>
            {allPFs.map((pf, i) => { const val = getVal(pf, "expense", label); return <td key={i} className="text-right px-3 py-1.5 num">{val != null ? fC(val) : "\u2014"}</td>; })}
          </tr>
        ))}
        <tr className="border-t border-border">
          <td className="px-3 py-1.5 font-semibold sticky left-0 z-10 bg-card">Total Expenses</td>
          {allPFs.map((pf, i) => <td key={i} className="text-right px-3 py-1.5 font-semibold num">{fC(pf.totalExpenses)}</td>)}
        </tr>
        <tr className="border-t-2 border-border bg-muted">
          <td className="px-3 py-2 font-bold sticky left-0 z-10 bg-muted">Net Operating Income</td>
          {allPFs.map((pf, i) => <td key={i} className="text-right px-3 py-2 font-bold num">{fC(pf.noi)}</td>)}
        </tr>
        <tr><td colSpan={colHeaders.length + 1} className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-1.5 bg-card">Debt Service</td></tr>
        <tr className="border-b border-border">
          <td className="px-3 py-1.5 sticky left-0 z-10 bg-card">Annual Debt Service</td>
          {allPFs.map((pf, i) => <td key={i} className="text-right px-3 py-1.5 num">{pf.year === 0 ? "\u2014" : fC(pf.debtService)}</td>)}
        </tr>
        <tr className="border-t border-border">
          <td className="px-3 py-1.5 font-semibold sticky left-0 z-10 bg-card">Cash Flow Before Tax</td>
          {allPFs.map((pf, i) => <td key={i} className={cn("text-right px-3 py-1.5 font-semibold num", pf.year > 0 && pf.cashFlowBeforeTax < 0 && "text-destructive")}>{pf.year === 0 ? "\u2014" : fC(pf.cashFlowBeforeTax)}</td>)}
        </tr>
        <tr className="border-t border-border">
          <td className="px-3 py-2 font-bold sticky left-0 z-10 bg-card">DSCR</td>
          {allPFs.map((pf, i) => <td key={i} className={cn("text-right px-3 py-2 font-bold num", pf.year > 0 && pf.dscr < 1 && "text-destructive")}>{pf.year === 0 ? "\u2014" : `${pf.dscr.toFixed(2)}x`}</td>)}
        </tr>
      </tbody>
    </table>
  );
}

// ── Cap Rate Valuation Table ──

function CapRateTable({ proForma, uwRecord, holdYears }: { proForma: ProFormaYearResult[]; uwRecord: DealUWRecord; holdYears: number }) {
  const t12 = proForma.find((p) => p.year === 0);
  const yr1 = proForma.find((p) => p.year === 1);
  const stabilized = proForma.find((p) => p.year === holdYears);
  const capRates = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];
  const goingInPct = uwRecord.exit_cap_rate > 0 ? uwRecord.exit_cap_rate * 100 : null;
  const exitPct = uwRecord.exit_cap_rate > 0 ? uwRecord.exit_cap_rate * 100 : null;

  const rows = [
    { label: "T-12 NOI", noi: t12?.noi ?? 0 },
    { label: "Year 1 NOI", noi: yr1?.noi ?? 0 },
    { label: "Stabilized NOI", noi: stabilized?.noi ?? 0 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left px-2.5 py-2 text-[11px] text-muted-foreground">Cap Rate</th>
            {capRates.map((cr) => (
              <th key={cr} className={cn("text-right px-2.5 py-2 text-[11px]", (goingInPct && Math.abs(cr - goingInPct) < 0.01) || (exitPct && Math.abs(cr - exitPct) < 0.01) ? "text-blue-500 font-bold" : "text-muted-foreground")}>
                {cr.toFixed(1)}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b">
              <td className="px-2.5 py-2 font-semibold">{row.label}</td>
              {capRates.map((cr) => {
                const val = row.noi / (cr / 100);
                return (
                  <td key={cr} className={cn("text-right px-2.5 py-2 num text-muted-foreground")}>
                    {val > 0 ? `$${Math.round(val / 1000).toLocaleString()}K` : "\u2014"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
