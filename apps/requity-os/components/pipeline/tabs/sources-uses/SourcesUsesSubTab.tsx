"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Hammer,
  Shield,
  Banknote,
  Target,
  Trash2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  upsertDebtTranches,
  upsertClosingCosts,
  upsertReserves,
  upsertScopeOfWork,
  updateSUConfig,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { SUCollapsible, SUFieldRow, SUMetricCard } from "./su-shared";
import {
  n,
  calcMonthlyPmt,
  calcAnnualDS,
  calcMaxLoanFromDSCR,
  fmtCurrency,
} from "./su-calculations";
import type {
  DebtTranche,
  ClosingCostRow,
  ReserveRow,
  ScopeOfWorkRow,
  SUConfig,
} from "./su-types";
import {
  DEFAULT_CLOSING_COST_LABELS,
  DEFAULT_RESERVE_LABELS,
} from "./su-types";

// ── Props ──

interface SourcesUsesSubTabProps {
  uwId: string | null;
  purchasePrice: number;
  numUnits: number;
  exitCapRate: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: Record<string, any>;
  debt: Record<string, unknown>[];
  sourcesUses: Record<string, unknown>[];
  scopeOfWork: Record<string, unknown>[];
}

// ── Helpers to parse DB rows into local state ──

function parseDebtTranche(raw: Record<string, unknown>, fallbackType: string): DebtTranche {
  return {
    id: raw.id as string | undefined,
    tranche_name: String(raw.tranche_name ?? ""),
    tranche_type: (raw.tranche_type as DebtTranche["tranche_type"]) ?? fallbackType as DebtTranche["tranche_type"],
    loan_amount: n(raw.loan_amount),
    interest_rate: n(raw.interest_rate),
    term_years: n(raw.term_years) || 5,
    amortization_years: n(raw.amortization_years) || 30,
    io_period_months: n(raw.io_period_months),
    is_io: Boolean(raw.is_io),
    origination_fee_pct: n(raw.origination_fee_pct),
    ltv_pct: n(raw.ltv_pct),
    prepay_type: String(raw.prepay_type ?? "none"),
    lender_name: String(raw.lender_name ?? ""),
    loan_type: String(raw.loan_type ?? "fixed"),
    max_ltv_constraint: n(raw.max_ltv_constraint) || 75,
    dscr_floor_constraint: n(raw.dscr_floor_constraint) || 1.25,
    takeout_year: n(raw.takeout_year) || 3,
    appraisal_cap_rate: n(raw.appraisal_cap_rate) || 7,
    sort_order: n(raw.sort_order),
  };
}

function parseSURows(rows: Record<string, unknown>[], category: string): ClosingCostRow[] | ReserveRow[] {
  return rows
    .filter((r) => r.category === category)
    .map((r) => ({
      id: r.id as string,
      line_item: String(r.line_item ?? ""),
      amount: n(r.amount),
      notes: (r.notes as string) ?? null,
      sort_order: n(r.sort_order),
    }));
}

function parseSOWRows(rows: Record<string, unknown>[]): ScopeOfWorkRow[] {
  return rows.map((r) => ({
    id: r.id as string,
    item_name: String(r.item_name ?? ""),
    description: (r.description as string) ?? null,
    estimated_cost: n(r.estimated_cost),
    category: (r.category as string) ?? null,
    qty: n(r.qty) || 1,
    unit_cost: n(r.unit_cost),
    timeline: (r.timeline as string) ?? null,
    budget_type: ((r.budget_type as string) ?? "value_add") as "value_add" | "ground_up",
    sort_order: n(r.sort_order),
  }));
}

// ── Main Component ──

export function SourcesUsesSubTab({
  uwId,
  purchasePrice: pp,
  numUnits,
  exitCapRate: dbExitCapRate,
  uw,
  debt,
  sourcesUses,
  scopeOfWork,
}: SourcesUsesSubTabProps) {
  const router = useRouter();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Parse initial data from DB ──
  const rawSenior = debt.find((d) => d.tranche_type === "senior");
  const rawMezz = debt.find((d) => d.tranche_type === "mezz");
  const rawTakeout = debt.find((d) => d.tranche_type === "takeout");

  const initialSenior: DebtTranche = rawSenior
    ? parseDebtTranche(rawSenior, "senior")
    : { tranche_name: "Senior Debt", tranche_type: "senior", loan_amount: 0, interest_rate: 7, term_years: 5, amortization_years: 30, io_period_months: 0, is_io: true, origination_fee_pct: 0.75, ltv_pct: 60, prepay_type: "none", lender_name: "", loan_type: "fixed", max_ltv_constraint: 75, dscr_floor_constraint: 1.25, takeout_year: 3, appraisal_cap_rate: 7, sort_order: 0 };

  const initialMezz: DebtTranche = rawMezz
    ? parseDebtTranche(rawMezz, "mezz")
    : { tranche_name: "Mezzanine", tranche_type: "mezz", loan_amount: 0, interest_rate: 12, term_years: 5, amortization_years: 30, io_period_months: 0, is_io: true, origination_fee_pct: 0, ltv_pct: 0, prepay_type: "none", lender_name: "", loan_type: "fixed", max_ltv_constraint: 75, dscr_floor_constraint: 1.25, takeout_year: 3, appraisal_cap_rate: 7, sort_order: 1 };

  const initialTakeout: DebtTranche = rawTakeout
    ? parseDebtTranche(rawTakeout, "takeout")
    : { tranche_name: "Takeout", tranche_type: "takeout", loan_amount: 0, interest_rate: 6, term_years: 10, amortization_years: 30, io_period_months: 0, is_io: false, origination_fee_pct: 0, ltv_pct: 0, prepay_type: "none", lender_name: "", loan_type: "fixed", max_ltv_constraint: 75, dscr_floor_constraint: 1.25, takeout_year: 3, appraisal_cap_rate: dbExitCapRate || 7, sort_order: 2 };

  const closingCostRows = parseSURows(sourcesUses, "closing_cost") as ClosingCostRow[];
  const initialCC: ClosingCostRow[] = closingCostRows.length > 0
    ? closingCostRows
    : DEFAULT_CLOSING_COST_LABELS.map((label, i) => ({ line_item: label, amount: 0, notes: null, sort_order: i }));

  const reserveRows = parseSURows(sourcesUses, "reserve") as ReserveRow[];
  const initialReserves: ReserveRow[] = reserveRows.length > 0
    ? reserveRows
    : DEFAULT_RESERVE_LABELS.map((label, i) => ({ line_item: label, amount: 0, notes: null, sort_order: i }));

  const initialSOW = parseSOWRows(scopeOfWork);

  const initialConfig: SUConfig = {
    budget_mode: (uw?.budget_mode as SUConfig["budget_mode"]) ?? "value_add",
    takeout_enabled: Boolean(uw?.takeout_enabled),
    value_add_contingency_pct: n(uw?.value_add_contingency_pct) || 10,
    ground_up_gc_fee_pct: n(uw?.ground_up_gc_fee_pct) || 5,
    ground_up_dev_fee_pct: n(uw?.ground_up_dev_fee_pct) || 4,
    ground_up_contingency_pct: n(uw?.ground_up_contingency_pct) || 10,
  };

  // ── Local state ──
  const [senior, setSenior] = useState<DebtTranche>(initialSenior);
  const [mezz, setMezz] = useState<DebtTranche>(initialMezz);
  const [takeout, setTakeout] = useState<DebtTranche>(initialTakeout);
  const [closingCosts, setClosingCosts] = useState<ClosingCostRow[]>(initialCC);
  const [reserves, setReserves] = useState<ReserveRow[]>(initialReserves);
  const [sowItems, setSowItems] = useState<ScopeOfWorkRow[]>(initialSOW);
  const [config, setConfig] = useState<SUConfig>(initialConfig);
  const [exitCapRate, setExitCapRate] = useState(dbExitCapRate || 7);
  const [sections, setSections] = useState<Record<string, boolean>>({
    summary: true, senior: true, mezz: false, closing: true, construction: true, reserves: true, takeout: true,
  });

  const toggle = (k: string) => setSections((prev) => ({ ...prev, [k]: !prev[k] }));

  // ── Debounced save helper ──
  const debouncedSave = useCallback(
    (saveFn: () => Promise<{ error: string | null }>) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        if (!uwId) return;
        const result = await saveFn();
        if (result.error) {
          toast.error(`Save failed: ${result.error}`);
        } else {
          router.refresh();
        }
      }, 800);
    },
    [uwId, router]
  );

  // ── Save functions ──
  const saveDebt = useCallback(() => {
    if (!uwId) return;
    const tranches = [
      { ...senior, loan_amount: Math.round(pp * senior.ltv_pct / 100), sort_order: 0 },
      ...(mezz.ltv_pct > 0 ? [{ ...mezz, loan_amount: Math.round(pp * mezz.ltv_pct / 100), sort_order: 1 }] : []),
      ...(config.takeout_enabled ? [{ ...takeout, sort_order: 2 }] : []),
    ];
    debouncedSave(() => upsertDebtTranches(uwId, tranches));
  }, [uwId, senior, mezz, takeout, pp, config.takeout_enabled, debouncedSave]);

  const saveClosingCosts = useCallback(() => {
    if (!uwId) return;
    debouncedSave(() => upsertClosingCosts(uwId, closingCosts.map((c, i) => ({ line_item: c.line_item, amount: c.amount, notes: c.notes, sort_order: i }))));
  }, [uwId, closingCosts, debouncedSave]);

  const saveReserves = useCallback(() => {
    if (!uwId) return;
    debouncedSave(() => upsertReserves(uwId, reserves.map((r, i) => ({ line_item: r.line_item, amount: r.amount, notes: r.notes, sort_order: i }))));
  }, [uwId, reserves, debouncedSave]);

  const saveSOW = useCallback(() => {
    if (!uwId) return;
    debouncedSave(() => upsertScopeOfWork(uwId, sowItems.map((r, i) => ({
      item_name: r.item_name,
      description: r.description,
      estimated_cost: r.estimated_cost,
      category: r.category,
      qty: r.qty,
      unit_cost: r.unit_cost,
      timeline: r.timeline,
      budget_type: r.budget_type,
      sort_order: i,
    }))));
  }, [uwId, sowItems, debouncedSave]);

  const saveConfig = useCallback(
    (updates: Partial<SUConfig>) => {
      if (!uwId) return;
      debouncedSave(() => updateSUConfig(uwId, updates));
    },
    [uwId, debouncedSave]
  );

  // ── Update helpers ──
  const updateSenior = useCallback(
    (patch: Partial<DebtTranche>) => {
      setSenior((prev) => ({ ...prev, ...patch }));
      setTimeout(saveDebt, 0);
    },
    [saveDebt]
  );

  const updateMezz = useCallback(
    (patch: Partial<DebtTranche>) => {
      setMezz((prev) => ({ ...prev, ...patch }));
      setTimeout(saveDebt, 0);
    },
    [saveDebt]
  );

  const updateTakeout = useCallback(
    (patch: Partial<DebtTranche>) => {
      setTakeout((prev) => ({ ...prev, ...patch }));
      setTimeout(saveDebt, 0);
    },
    [saveDebt]
  );

  const updateConfig = useCallback(
    (patch: Partial<SUConfig>) => {
      setConfig((prev) => ({ ...prev, ...patch }));
      saveConfig(patch);
    },
    [saveConfig]
  );

  // ── Computed values ──
  const seniorLoan = Math.round(pp * senior.ltv_pct / 100);
  const mezzLoan = Math.round(pp * mezz.ltv_pct / 100);
  const seniorOrigFee = Math.round(seniorLoan * senior.origination_fee_pct / 100);
  const totalCC = closingCosts.reduce((s, c) => s + c.amount, 0);
  const totalRes = reserves.reduce((s, r) => s + r.amount, 0);
  const units = numUnits || 1;

  const vaItems = sowItems.filter((i) => i.budget_type === "value_add");
  const guItems = sowItems.filter((i) => i.budget_type === "ground_up");
  const vaCategories = useMemo(() => {
    const cats: Record<string, ScopeOfWorkRow[]> = {};
    vaItems.forEach((item) => {
      const cat = item.category || "General";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(item);
    });
    return Object.entries(cats);
  }, [vaItems]);
  const guCategories = useMemo(() => {
    const cats: Record<string, ScopeOfWorkRow[]> = {};
    guItems.forEach((item) => {
      const cat = item.category || "General";
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(item);
    });
    return Object.entries(cats);
  }, [guItems]);

  let totalBudget = 0;
  if (config.budget_mode === "value_add") {
    const li = vaItems.reduce((s, i) => s + i.qty * i.unit_cost, 0);
    totalBudget = li + Math.round(li * config.value_add_contingency_pct / 100);
  } else {
    const hardItems = guItems.filter((i) => (i.category || "").toLowerCase().includes("hard"));
    const softItems = guItems.filter((i) => !(i.category || "").toLowerCase().includes("hard"));
    const hard = hardItems.reduce((s, i) => s + i.estimated_cost, 0);
    const soft = softItems.reduce((s, i) => s + i.estimated_cost, 0);
    const gc = Math.round(hard * config.ground_up_gc_fee_pct / 100);
    const sub = hard + soft + gc;
    totalBudget = sub + Math.round(hard * config.ground_up_contingency_pct / 100) + Math.round(sub * config.ground_up_dev_fee_pct / 100);
  }

  const totalUses = pp + totalCC + seniorOrigFee + totalRes + totalBudget;
  const totalDebt = seniorLoan + mezzLoan;
  const sponsorEquity = totalUses - totalDebt;
  const combinedLTV = senior.ltv_pct + mezz.ltv_pct;

  const seniorAnnualDS = calcAnnualDS(seniorLoan, senior.interest_rate, senior.is_io, senior.amortization_years);
  const mezzAnnualDS = calcAnnualDS(mezzLoan, mezz.interest_rate, mezz.is_io, mezz.amortization_years || 30);
  const totalAnnualDS = seniorAnnualDS + mezzAnnualDS;

  // Use NOI from the T-12/Yr1 data on the UW record, or a reasonable estimate
  const yr1NOI = n(uw?.noi_year1) || n(uw?.t12_noi) || (pp > 0 ? pp * 0.06 : 0);
  const t12NOI = n(uw?.t12_noi) || yr1NOI;

  const seniorDSCR = seniorAnnualDS > 0 ? yr1NOI / seniorAnnualDS : 0;
  const combinedDSCR = totalAnnualDS > 0 ? yr1NOI / totalAnnualDS : 0;
  const debtYield = seniorLoan > 0 ? yr1NOI / seniorLoan : 0;
  const blendedRate = totalDebt > 0 ? (seniorLoan * senior.interest_rate + mezzLoan * mezz.interest_rate) / totalDebt : 0;

  const fmt = (v: number) => fmtCurrency(v);
  const pctOf = (v: number) => totalUses > 0 ? ((v / totalUses) * 100).toFixed(1) + "%" : "0.0%";

  // Takeout calculations
  const takeoutNOI = yr1NOI * Math.pow(1.03, takeout.takeout_year);
  const takeoutAppraised = exitCapRate > 0 ? Math.round(takeoutNOI / (exitCapRate / 100)) : 0;
  const takeoutLTVMax = Math.round(takeoutAppraised * takeout.max_ltv_constraint / 100);
  const takeoutDSCRMax = calcMaxLoanFromDSCR(takeoutNOI, takeout.dscr_floor_constraint, takeout.interest_rate, takeout.amortization_years);
  const takeoutMaxLoan = Math.min(takeoutLTVMax, takeoutDSCRMax);
  const takeoutGoverning = takeoutLTVMax <= takeoutDSCRMax ? "LTV" : "DSCR";
  const takeoutPayoff = seniorLoan + mezzLoan;
  const takeoutCostPct = 1.25;
  const takeoutCosts = Math.round(takeoutMaxLoan * takeoutCostPct / 100);
  const takeoutNetProceeds = takeoutMaxLoan - takeoutPayoff - takeoutCosts;

  const stressRates = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
  const stressDSCRs = [1.15, 1.20, 1.25, 1.30, 1.35];
  const stressMatrix = stressRates.map((rate) => ({
    rate,
    cells: stressDSCRs.map((dscr) => {
      const maxL = Math.min(
        Math.round(takeoutAppraised * takeout.max_ltv_constraint / 100),
        calcMaxLoanFromDSCR(takeoutNOI, dscr, rate, takeout.amortization_years)
      );
      return maxL - takeoutPayoff - Math.round(maxL * takeoutCostPct / 100);
    }),
  }));

  if (!uwId) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Initialize underwriting to use Sources & Uses.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. Capital Stack Summary ── */}
      <SUCollapsible title="Going-In Capital Stack" icon={TrendingUp} expanded={sections.summary} onToggle={() => toggle("summary")}>
        <div className="p-4">
          <div className="grid grid-cols-5 gap-3 mb-4">
            <SUMetricCard label="Total Sources" value={fmt(totalUses)} />
            <SUMetricCard label="Total Uses" value={fmt(totalUses)} />
            <SUMetricCard label="Blended LTV" value={`${combinedLTV.toFixed(1)}%`} />
            <SUMetricCard label="Combined DSCR" value={combinedDSCR > 0 ? `${combinedDSCR.toFixed(2)}x` : "N/A"} />
            <SUMetricCard label="Blended Rate" value={blendedRate > 0 ? `${blendedRate.toFixed(2)}%` : "N/A"} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sources */}
            <div className="rounded-xl border bg-card/50">
              <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Sources</span>
              </div>
              <div className="flex flex-col px-2 pb-3">
                <StackRow label="Senior Loan" value={fmt(seniorLoan)} pct={pctOf(seniorLoan)} />
                {mezzLoan > 0 && <StackRow label="Mezzanine" value={fmt(mezzLoan)} pct={pctOf(mezzLoan)} />}
                <StackRow label="Sponsor Equity" value={fmt(sponsorEquity)} pct={pctOf(sponsorEquity)} />
                <div className="flex items-center justify-between py-[5px] px-2 mt-1 border-t border-border/40">
                  <span className="text-[12px] font-semibold">Total</span>
                  <span className="text-[12px] num font-semibold">{fmt(totalUses)}</span>
                </div>
              </div>
            </div>

            {/* Uses */}
            <div className="rounded-xl border bg-card/50">
              <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                <Receipt className="h-3.5 w-3.5 text-blue-600" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Uses</span>
              </div>
              <div className="flex flex-col px-2 pb-3">
                {[
                  { name: "Purchase Price", val: pp },
                  { name: "Closing Costs", val: totalCC },
                  { name: "Origination Fee", val: seniorOrigFee },
                  { name: "Construction / Rehab", val: totalBudget },
                  { name: "Reserves", val: totalRes },
                ].map((u) => (
                  <StackRow key={u.name} label={u.name} value={fmt(u.val)} pct={pctOf(u.val)} />
                ))}
                <div className="flex items-center justify-between py-[5px] px-2 mt-1 border-t border-border/40">
                  <span className="text-[12px] font-semibold">Total</span>
                  <span className="text-[12px] num font-semibold">{fmt(totalUses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capital Stack Bar */}
          {totalUses > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Capital Stack</div>
              <div className="flex h-7 rounded-full overflow-hidden border">
                {seniorLoan > 0 && (
                  <div className="bg-primary/80 flex items-center justify-center" style={{ width: `${(seniorLoan / totalUses * 100).toFixed(1)}%` }}>
                    <span className="text-[9px] font-semibold text-primary-foreground">Senior {senior.ltv_pct.toFixed(0)}%</span>
                  </div>
                )}
                {mezzLoan > 0 && (
                  <div className="bg-amber-500/80 flex items-center justify-center" style={{ width: `${(mezzLoan / totalUses * 100).toFixed(1)}%` }}>
                    <span className="text-[9px] font-semibold text-white">Mezz {mezz.ltv_pct.toFixed(0)}%</span>
                  </div>
                )}
                {sponsorEquity > 0 && (
                  <div className="bg-emerald-500/70 flex items-center justify-center" style={{ width: `${(sponsorEquity / totalUses * 100).toFixed(1)}%` }}>
                    <span className="text-[9px] font-semibold text-white">Equity {(sponsorEquity / totalUses * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SUCollapsible>

      {/* ── 2. Senior Loan ── */}
      <SUCollapsible title="Going-In Purchase Loan (Senior)" icon={DollarSign} expanded={sections.senior} onToggle={() => toggle("senior")} badge={fmt(seniorLoan)}>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-0.5">
              <SUFieldRow label="Loan Amount" value={fmt(seniorLoan)} computed />
              <SUFieldRow label="LTV" value={senior.ltv_pct.toFixed(1)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateSenior({ ltv_pct: x }); }} />
              <SUFieldRow label="Interest Rate" value={senior.interest_rate.toFixed(2)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateSenior({ interest_rate: x }); }} />
              <SUFieldRow label="Loan Term" value={senior.term_years.toString()} suffix="years" onChange={(v) => { const x = parseInt(v); if (!isNaN(x)) updateSenior({ term_years: x }); }} />
              <SUFieldRow label="Amortization" value={senior.is_io ? "Interest Only" : `${senior.amortization_years} years`} computed={senior.is_io} />
              <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">I/O or Amortizing</span>
                <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
                  {(["IO", "Amort"] as const).map((opt) => (
                    <button key={opt} onClick={() => updateSenior({ is_io: opt === "IO" })} className={cn(
                      "rounded px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer transition-all",
                      (opt === "IO" ? senior.is_io : !senior.is_io) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>{opt}</button>
                  ))}
                </div>
              </div>
              <SUFieldRow label="Origination Fee" value={senior.origination_fee_pct.toFixed(2)} suffix={`% (${fmt(seniorOrigFee)})`} onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateSenior({ origination_fee_pct: x }); }} />
              <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">Prepayment</span>
                <select value={senior.prepay_type} onChange={(e) => updateSenior({ prepay_type: e.target.value })} className="text-[12px] num font-medium bg-transparent border-b border-dashed border-border/60 outline-none cursor-pointer px-1 py-0.5">
                  <option value="none">None</option>
                  <option value="yield_maint">Yield Maintenance</option>
                  <option value="step_down">Step-Down</option>
                  <option value="defeasance">Defeasance</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Computed Outputs</div>
              <div className="flex flex-col gap-0.5">
                <SUFieldRow label="Monthly Payment" value={fmt(Math.round(senior.is_io ? seniorLoan * senior.interest_rate / 100 / 12 : calcMonthlyPmt(seniorLoan, senior.interest_rate, senior.amortization_years)))} computed />
                <SUFieldRow label="Annual Debt Service" value={fmt(Math.round(seniorAnnualDS))} computed />
                <SUFieldRow label="DSCR (Year 1 NOI)" value={seniorDSCR > 0 ? `${seniorDSCR.toFixed(2)}x` : "N/A"} computed />
                <SUFieldRow label="DSCR (T-12 NOI)" value={seniorAnnualDS > 0 ? `${(t12NOI / seniorAnnualDS).toFixed(2)}x` : "N/A"} computed />
                <SUFieldRow label="Debt Yield" value={debtYield > 0 ? `${(debtYield * 100).toFixed(2)}%` : "N/A"} computed />
              </div>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 3. Mezz Loan ── */}
      <SUCollapsible title="Going-In Mezz Loan" icon={DollarSign} expanded={sections.mezz} onToggle={() => toggle("mezz")} badge={mezzLoan > 0 ? fmt(mezzLoan) : "Inactive"}>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-0.5">
              <SUFieldRow label="Mezz Loan Amount" value={fmt(mezzLoan)} computed />
              <SUFieldRow label="Mezz LTV" value={mezz.ltv_pct.toFixed(1)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateMezz({ ltv_pct: x }); }} />
              <SUFieldRow label="Interest Rate" value={mezz.interest_rate.toFixed(2)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateMezz({ interest_rate: x }); }} />
              <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">I/O or Amortizing</span>
                <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
                  {(["IO", "Amort"] as const).map((opt) => (
                    <button key={opt} onClick={() => updateMezz({ is_io: opt === "IO" })} className={cn(
                      "rounded px-2.5 py-0.5 text-[10px] font-semibold cursor-pointer transition-all",
                      (opt === "IO" ? mezz.is_io : !mezz.is_io) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Combined Metrics</div>
              <div className="flex flex-col gap-0.5">
                <SUFieldRow label="Combined LTV" value={`${combinedLTV.toFixed(1)}%`} computed />
                <SUFieldRow label="Combined Annual DS" value={fmt(Math.round(totalAnnualDS))} computed />
                <SUFieldRow label="Combined DSCR" value={combinedDSCR > 0 ? `${combinedDSCR.toFixed(2)}x` : "N/A"} computed />
                <SUFieldRow label="Blended Rate" value={blendedRate > 0 ? `${blendedRate.toFixed(2)}%` : "N/A"} computed />
              </div>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 4. Closing Costs ── */}
      <SUCollapsible title="Closing Costs" icon={Receipt} expanded={sections.closing} onToggle={() => toggle("closing")} badge={fmt(totalCC)}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2 w-[50%]">Description</th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2 w-[20%]">Amount</th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2 w-[15%]">% of Purchase</th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2 w-[15%]">$/Unit</th>
              </tr>
            </thead>
            <tbody>
              {closingCosts.map((cc, idx) => (
                <tr key={idx} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-foreground/80">{cc.line_item}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center justify-end">
                      <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                      <input
                        defaultValue={cc.amount.toLocaleString()}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                          setClosingCosts((prev) => prev.map((c, i) => i === idx ? { ...c, amount: val } : c));
                          setTimeout(saveClosingCosts, 0);
                        }}
                        className="w-[90px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/40 focus:border-primary/60"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right num text-foreground/60">{pp > 0 ? (cc.amount / pp * 100).toFixed(2) + "%" : ""}</td>
                  <td className="px-3 py-2 text-right num text-foreground/60">${Math.round(cc.amount / units).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-muted/20">
                <td className="px-4 py-2 font-semibold">Total Closing Costs</td>
                <td className="px-3 py-2 text-right font-semibold num">{fmt(totalCC)}</td>
                <td className="px-3 py-2 text-right font-semibold num">{pp > 0 ? (totalCC / pp * 100).toFixed(2) + "%" : ""}</td>
                <td className="px-3 py-2 text-right font-semibold num">${Math.round(totalCC / units).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SUCollapsible>

      {/* ── 5. Construction / Improvement Budget ── */}
      <SUCollapsible title="Construction / Improvement Budget" icon={Hammer} expanded={sections.construction} onToggle={() => toggle("construction")} badge={fmt(totalBudget)}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex gap-0.5 rounded-lg p-[2px] bg-muted border">
              {([{ key: "value_add" as const, label: "Value-Add / Rehab" }, { key: "ground_up" as const, label: "Ground-Up Construction" }]).map((opt) => (
                <button key={opt.key} onClick={() => updateConfig({ budget_mode: opt.key })} className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-colors",
                  config.budget_mode === opt.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>{opt.label}</button>
              ))}
            </div>
          </div>

          {config.budget_mode === "value_add" ? (
            <div className="flex flex-col gap-4">
              {vaCategories.map(([catName, items]) => {
                const catTotal = items.reduce((s, i) => s + i.qty * i.unit_cost, 0);
                return (
                  <div key={catName}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 pb-1.5 border-b">{catName}</div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[40%]">Description</th>
                          <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[10%]">Qty</th>
                          <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[18%]">Unit Cost</th>
                          <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[18%]">Total</th>
                          <th className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[10%]">Timeline</th>
                          <th className="p-[6px_10px] border-b w-[4%]" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id ?? item.sort_order} className="hover:bg-muted/20 transition-colors">
                            <td className="h-9 px-[10px] text-foreground/80 border-b">{item.item_name}</td>
                            <td className="h-9 px-[10px] text-center num border-b">{item.qty}</td>
                            <td className="h-9 px-[10px] text-right num border-b">${item.unit_cost.toLocaleString()}</td>
                            <td className="h-9 px-[10px] text-right num font-medium border-b">{fmt(item.qty * item.unit_cost)}</td>
                            <td className="h-9 px-[10px] text-center border-b">
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{item.timeline ?? ""}</span>
                            </td>
                            <td className="h-9 px-[10px] text-center border-b">
                              <button onClick={() => {
                                setSowItems((prev) => prev.filter((i) => i !== item));
                                setTimeout(saveSOW, 0);
                              }} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between mt-1.5">
                      <button onClick={() => {
                        const newItem: ScopeOfWorkRow = {
                          item_name: "New item", description: null, estimated_cost: 0,
                          category: catName, qty: 1, unit_cost: 0, timeline: "Yr 1",
                          budget_type: "value_add", sort_order: sowItems.length,
                        };
                        setSowItems((prev) => [...prev, newItem]);
                        setTimeout(saveSOW, 0);
                      }} className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus className="w-3 h-3" strokeWidth={2} /> Add Item
                      </button>
                      <span className="text-[11px] font-semibold num">{fmt(catTotal)}</span>
                    </div>
                  </div>
                );
              })}

              {vaCategories.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No value-add items yet.</p>
                  <button onClick={() => {
                    const newItem: ScopeOfWorkRow = {
                      item_name: "New item", description: null, estimated_cost: 0,
                      category: "Interior Renovations", qty: 1, unit_cost: 0, timeline: "Yr 1",
                      budget_type: "value_add", sort_order: 0,
                    };
                    setSowItems((prev) => [...prev, newItem]);
                    setTimeout(saveSOW, 0);
                  }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer hover:bg-muted/50 transition-colors">
                    <Plus className="w-3 h-3" strokeWidth={2} /> Add Item
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">Contingency</span>
                  <input
                    value={config.value_add_contingency_pct}
                    onChange={(e) => { const x = parseFloat(e.target.value); if (!isNaN(x)) updateConfig({ value_add_contingency_pct: x }); }}
                    className="w-[40px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/60 focus:border-primary/60"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
                <span className="text-[12px] font-semibold num">{fmt(Math.round(vaItems.reduce((s, i) => s + i.qty * i.unit_cost, 0) * config.value_add_contingency_pct / 100))}</span>
              </div>

              <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-primary/[0.04] dark:bg-primary/[0.08] border">
                <span className="text-[13px] font-bold">Total Improvement Budget</span>
                <span className="text-[13px] font-bold num">{fmt(totalBudget)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {guCategories.map(([catName, items]) => {
                const sectionTotal = items.reduce((s, i) => s + i.estimated_cost, 0);
                return (
                  <div key={catName}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2 pb-1.5 border-b">{catName}</div>
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr>
                          <th className="text-left text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[60%]">Description</th>
                          <th className="text-right text-[9px] font-semibold uppercase tracking-wider text-muted-foreground p-[6px_10px] border-b w-[30%]">Amount</th>
                          <th className="p-[6px_10px] border-b w-[10%]" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id ?? item.sort_order} className="hover:bg-muted/20 transition-colors">
                            <td className="h-9 px-[10px] text-foreground/80 border-b">{item.item_name}</td>
                            <td className="h-9 px-[10px] text-right border-b">
                              <div className="inline-flex items-center justify-end">
                                <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                                <input
                                  defaultValue={item.estimated_cost.toLocaleString()}
                                  onBlur={(e) => {
                                    const val = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                                    setSowItems((prev) => prev.map((i) => i === item ? { ...i, estimated_cost: val } : i));
                                    setTimeout(saveSOW, 0);
                                  }}
                                  className="w-[100px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/40 focus:border-primary/60"
                                />
                              </div>
                            </td>
                            <td className="h-9 px-[10px] text-center border-b">
                              <button onClick={() => {
                                setSowItems((prev) => prev.filter((i) => i !== item));
                                setTimeout(saveSOW, 0);
                              }} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex items-center justify-between mt-1.5">
                      <button onClick={() => {
                        const newItem: ScopeOfWorkRow = {
                          item_name: "New item", description: null, estimated_cost: 0,
                          category: catName, qty: 1, unit_cost: 0, timeline: null,
                          budget_type: "ground_up", sort_order: sowItems.length,
                        };
                        setSowItems((prev) => [...prev, newItem]);
                        setTimeout(saveSOW, 0);
                      }} className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer hover:bg-muted/50 transition-colors">
                        <Plus className="w-3 h-3" strokeWidth={2} /> Add Item
                      </button>
                      <span className="text-[11px] font-semibold num">{fmt(sectionTotal)}</span>
                    </div>
                  </div>
                );
              })}

              {guCategories.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No ground-up items yet.</p>
                  <button onClick={() => {
                    const newItem: ScopeOfWorkRow = {
                      item_name: "New item", description: null, estimated_cost: 0,
                      category: "Hard Costs", qty: 1, unit_cost: 0, timeline: null,
                      budget_type: "ground_up", sort_order: 0,
                    };
                    setSowItems((prev) => [...prev, newItem]);
                    setTimeout(saveSOW, 0);
                  }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer hover:bg-muted/50 transition-colors">
                    <Plus className="w-3 h-3" strokeWidth={2} /> Add Item
                  </button>
                </div>
              )}

              {(() => {
                const hardItems = guItems.filter((i) => (i.category || "").toLowerCase().includes("hard"));
                const hard = hardItems.reduce((s, i) => s + i.estimated_cost, 0);
                const soft = guItems.filter((i) => !(i.category || "").toLowerCase().includes("hard")).reduce((s, i) => s + i.estimated_cost, 0);
                const gcFee = Math.round(hard * config.ground_up_gc_fee_pct / 100);
                const contingency = Math.round(hard * config.ground_up_contingency_pct / 100);
                const subtotal = hard + soft + gcFee;
                const devFee = Math.round(subtotal * config.ground_up_dev_fee_pct / 100);
                return (
                  <div className="flex flex-col gap-2 mt-2">
                    <FeeRow label="GC Fee" value={config.ground_up_gc_fee_pct} suffix="% of hard" amount={gcFee} onChange={(v) => updateConfig({ ground_up_gc_fee_pct: v })} />
                    <FeeRow label="Contingency" value={config.ground_up_contingency_pct} suffix="% of hard" amount={contingency} onChange={(v) => updateConfig({ ground_up_contingency_pct: v })} />
                    <FeeRow label="Developer Fee" value={config.ground_up_dev_fee_pct} suffix="% of total" amount={devFee} onChange={(v) => updateConfig({ ground_up_dev_fee_pct: v })} />
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-primary/[0.04] dark:bg-primary/[0.08] border">
                      <span className="text-[13px] font-bold">Total Construction Budget</span>
                      <span className="text-[13px] font-bold num">{fmt(totalBudget)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </SUCollapsible>

      {/* ── 6. Reserves ── */}
      <SUCollapsible title="Reserves" icon={Shield} expanded={sections.reserves} onToggle={() => toggle("reserves")} badge={fmt(totalRes)}>
        <div className="p-4">
          <div className="flex flex-col gap-0.5">
            {reserves.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between py-[6px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                <span className="text-[12px] text-muted-foreground">{r.line_item}</span>
                <div className="inline-flex items-center">
                  <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                  <input
                    defaultValue={r.amount.toLocaleString()}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value.replace(/,/g, "")) || 0;
                      setReserves((prev) => prev.map((res, i) => i === idx ? { ...res, amount: val } : res));
                      setTimeout(saveReserves, 0);
                    }}
                    className="w-[90px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/40 focus:border-primary/60"
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between py-[6px] px-3 mt-1 border-t border-border/40">
              <span className="text-[12px] font-semibold">Total Reserves</span>
              <span className="text-[12px] num font-semibold">{fmt(totalRes)}</span>
            </div>
          </div>
        </div>
      </SUCollapsible>

      {/* ── 7. Takeout Loan Analysis ── */}
      <SUCollapsible title="Takeout Loan Analysis" icon={Banknote} expanded={sections.takeout} onToggle={() => toggle("takeout")} badge={config.takeout_enabled ? fmt(takeoutMaxLoan) : "Disabled"}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => updateConfig({ takeout_enabled: !config.takeout_enabled })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-all border",
                config.takeout_enabled ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border/40 hover:text-foreground"
              )}
            >
              {config.takeout_enabled ? "Enabled" : "Disabled"}
            </button>
            <p className="text-[11px] text-muted-foreground">Permanent loan that pays off going-in senior + mezz at stabilization</p>
          </div>

          {config.takeout_enabled && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Takeout Terms</div>
                  <div className="flex items-center justify-between py-[5px] px-3 rounded-md hover:bg-muted/40 transition-colors">
                    <span className="text-[12px] text-muted-foreground">Takeout Year</span>
                    <select value={takeout.takeout_year} onChange={(e) => updateTakeout({ takeout_year: parseInt(e.target.value) })} className="text-[12px] num font-medium bg-transparent border-b border-dashed border-border/60 outline-none cursor-pointer px-1 py-0.5">
                      {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <SUFieldRow label="Interest Rate" value={takeout.interest_rate.toFixed(2)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateTakeout({ interest_rate: x }); }} />
                  <SUFieldRow label="Amortization" value={takeout.amortization_years.toString()} suffix="years" onChange={(v) => { const x = parseInt(v); if (!isNaN(x)) updateTakeout({ amortization_years: x }); }} />
                  <SUFieldRow label="Term" value={takeout.term_years.toString()} suffix="years" onChange={(v) => { const x = parseInt(v); if (!isNaN(x)) updateTakeout({ term_years: x }); }} />

                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mt-3 mb-1">Sizing Constraints</div>
                  <SUFieldRow label="Max LTV" value={takeout.max_ltv_constraint.toFixed(1)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateTakeout({ max_ltv_constraint: x }); }} />
                  <SUFieldRow label="Min DSCR" value={takeout.dscr_floor_constraint.toFixed(2)} suffix="x" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) updateTakeout({ dscr_floor_constraint: x }); }} />
                  <SUFieldRow label="Appraisal Cap Rate" value={exitCapRate.toFixed(2)} suffix="%" onChange={(v) => { const x = parseFloat(v); if (!isNaN(x)) setExitCapRate(x); }} />
                </div>

                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Takeout Sizing</div>
                  <div className="flex flex-col gap-0.5">
                    <SUFieldRow label={`Stabilized NOI (Yr ${takeout.takeout_year})`} value={fmt(Math.round(takeoutNOI))} computed />
                    <SUFieldRow label="Appraised Value" value={fmt(takeoutAppraised)} computed />
                    <SUFieldRow label="LTV-Constrained Max" value={fmt(takeoutLTVMax)} computed />
                    <SUFieldRow label="DSCR-Constrained Max" value={fmt(takeoutDSCRMax)} computed />
                    <div className="flex items-center justify-between py-[5px] px-3 rounded-md bg-primary/[0.06] dark:bg-primary/[0.1] mt-1">
                      <span className="text-[12px] font-semibold text-primary">Max Takeout Loan</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] num font-bold text-primary">{fmt(takeoutMaxLoan)}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">{takeoutGoverning}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 mt-3 pt-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">Proceeds Analysis</div>
                    <SUFieldRow label="Going-In Loan Payoff" value={fmt(takeoutPayoff)} computed />
                    <SUFieldRow label={`Takeout Closing (${takeoutCostPct}%)`} value={`(${fmt(takeoutCosts)})`} computed />
                    <div className={cn(
                      "flex items-center justify-between py-[6px] px-3 rounded-md mt-1",
                      takeoutNetProceeds >= 0 ? "bg-emerald-500/[0.06] dark:bg-emerald-500/10" : "bg-red-500/[0.06] dark:bg-red-500/10"
                    )}>
                      <span className={cn("text-[12px] font-semibold", takeoutNetProceeds >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        Net to Sponsor
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[12px] num font-bold", takeoutNetProceeds >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {takeoutNetProceeds >= 0 ? fmt(takeoutNetProceeds) : `(${fmt(Math.abs(takeoutNetProceeds))})`}
                        </span>
                        <span className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          takeoutNetProceeds >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                        )}>
                          {takeoutNetProceeds >= 0 ? "Cash Out" : "Shortfall"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stress Test Matrix */}
              <div className="rounded-xl border bg-card/50">
                <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
                  <Target className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Takeout Proceeds Sensitivity</span>
                  <span className="text-[10px] text-muted-foreground ml-1">(Rate vs. Min DSCR)</span>
                </div>
                <div className="px-4 pb-3 overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Rate</th>
                        {stressDSCRs.map((d) => (
                          <th key={d} className="py-1.5 px-2 text-right font-medium text-muted-foreground">{d.toFixed(2)}x</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stressMatrix.map((row) => {
                        const isBaseRate = Math.abs(row.rate - takeout.interest_rate) < 0.01;
                        return (
                          <tr key={row.rate} className={cn("border-b border-border/20", isBaseRate && "bg-primary/[0.04]")}>
                            <td className={cn("py-1.5 px-2 num", isBaseRate ? "font-semibold text-primary" : "text-foreground")}>{row.rate.toFixed(1)}%</td>
                            {row.cells.map((proceeds, ci) => {
                              const isBaseDSCR = Math.abs(stressDSCRs[ci] - takeout.dscr_floor_constraint) < 0.01;
                              const isBaseCell = isBaseRate && isBaseDSCR;
                              return (
                                <td key={ci} className={cn(
                                  "py-1.5 px-2 text-right num",
                                  isBaseCell && "font-bold",
                                  proceeds >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
                                )}>
                                  {proceeds >= 0 ? `$${(proceeds / 1000).toFixed(0)}K` : `($${(Math.abs(proceeds) / 1000).toFixed(0)}K)`}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground/60">
                    <span>Values = Net proceeds to sponsor after payoff and closing costs</span>
                    <span className="text-emerald-600">Green = Cash out</span>
                    <span className="text-red-500">Red = Shortfall</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SUCollapsible>
    </div>
  );
}

// ── Sub-components ──

function StackRow({ label, value, pct }: { label: string; value: string; pct: string }) {
  return (
    <div className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors">
      <span className="text-[12px] text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[12px] num font-medium text-foreground">{value}</span>
        <span className="text-[11px] num text-muted-foreground w-12 text-right">{pct}</span>
      </div>
    </div>
  );
}

function FeeRow({ label, value, suffix, amount, onChange }: {
  label: string; value: number; suffix: string; amount: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <input
          value={value}
          onChange={(e) => { const x = parseFloat(e.target.value); if (!isNaN(x)) onChange(x); }}
          className="w-[40px] text-right text-[12px] num font-medium bg-transparent outline-none border-b border-dashed border-border/60 focus:border-primary/60"
        />
        <span className="text-[10px] text-muted-foreground">{suffix}</span>
      </div>
      <span className="text-[12px] font-semibold num">{fmtCurrency(amount)}</span>
    </div>
  );
}
