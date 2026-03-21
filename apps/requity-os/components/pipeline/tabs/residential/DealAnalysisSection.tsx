"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SectionCard, MetricBar, fmtCurrency, fmtPct, TableShell, TH, n } from "@/components/pipeline/tabs/financials/shared";
import {
  BarChart3,
  DollarSign,
  Building2,
  Zap,
  ChevronDown,
} from "lucide-react";
import type { LoanProgram, ResidentialDealInputs, DealType } from "@/lib/residential-uw/types";
import { MOCK_PROGRAMS } from "@/lib/residential-uw/types";
import {
  computeLoanSizing,
  computeHoldingCosts,
  computeExitAnalysis,
  computeDSCRAnalysis,
  computeAdjustedLimits,
} from "@/lib/residential-uw/computations";

interface DealAnalysisSectionProps {
  dealInputs: ResidentialDealInputs;
  dealType: DealType;
  onDealTypeChange?: (type: DealType) => void;
  selectedProgramId: string;
  onProgramChange: (programId: string) => void;
  selectedProgram: LoanProgram;
  activeAdjusterKeys: string[];
  onAdjusterKeysChange: (keys: string[]) => void;
}

export function DealAnalysisSection({
  dealInputs,
  dealType,
  onDealTypeChange,
  selectedProgramId,
  onProgramChange,
  selectedProgram,
  activeAdjusterKeys,
  onAdjusterKeysChange,
}: DealAnalysisSectionProps) {
  const [expandedAdjusters, setExpandedAdjusters] = useState(false);

  const loanSizing = useMemo(
    () => computeLoanSizing(dealInputs, selectedProgram, activeAdjusterKeys),
    [dealInputs, selectedProgram, activeAdjusterKeys]
  );

  const holdingCosts = useMemo(
    () => computeHoldingCosts(dealInputs, loanSizing.max_loan, selectedProgram),
    [dealInputs, loanSizing.max_loan, selectedProgram]
  );

  const exitAnalysis = useMemo(
    () => computeExitAnalysis(dealInputs, loanSizing.max_loan, holdingCosts, selectedProgram),
    [dealInputs, loanSizing.max_loan, holdingCosts, selectedProgram]
  );

  const dscrAnalysis = useMemo(
    () => computeDSCRAnalysis(dealInputs, loanSizing.max_loan, selectedProgram),
    [dealInputs, loanSizing.max_loan, selectedProgram]
  );

  const adjustedLimits = useMemo(
    () => computeAdjustedLimits(selectedProgram, activeAdjusterKeys),
    [selectedProgram, activeAdjusterKeys]
  );

  const hasAdjusters = selectedProgram.adjusters && selectedProgram.adjusters.length > 0;

  // KPI Strip (conditional on deal type)
  const kpiItems = useMemo(() => {
    if (dealType === "rtl") {
      return [
        {
          label: "LTV",
          value: fmtPct(loanSizing.effective_ltv / 100),
          sub: fmtCurrency(loanSizing.max_by_ltv),
        },
        {
          label: "LTC",
          value: fmtPct(loanSizing.effective_ltc / 100),
          sub: fmtCurrency(loanSizing.max_by_ltc),
        },
        {
          label: "Max Loan",
          value: fmtCurrency(loanSizing.max_loan),
          accent: "rq-value-positive",
        },
        {
          label: "Rate",
          value: fmtPct(loanSizing.effective_rate / 100),
          sub: `${loanSizing.effective_pts} pts`,
        },
        {
          label: "Net Profit",
          value: fmtCurrency(exitAnalysis.net_profit),
          accent: exitAnalysis.net_profit >= 0 ? "rq-value-positive" : "rq-value-negative",
        },
        {
          label: "Ann. ROI",
          value: fmtPct(exitAnalysis.annualized_roi / 100),
          sub: `${exitAnalysis.hold_period_months}mo hold`,
        },
      ];
    } else {
      // DSCR
      return [
        {
          label: "LTV",
          value: fmtPct(loanSizing.effective_ltv / 100),
          sub: fmtCurrency(loanSizing.max_by_ltv),
        },
        {
          label: "DSCR",
          value: dscrAnalysis.dscr.toFixed(2) + "x",
          accent: dscrAnalysis.dscr >= 1.25 ? "rq-value-positive" : "rq-value-warn",
        },
        {
          label: "Loan Amount",
          value: fmtCurrency(loanSizing.max_loan),
        },
        {
          label: "Rate",
          value: fmtPct(loanSizing.effective_rate / 100),
          sub: `${loanSizing.effective_pts} pts`,
        },
        {
          label: "Monthly Rent",
          value: fmtCurrency(dscrAnalysis.monthly_rent),
        },
        {
          label: "Cash Flow",
          value: fmtCurrency(dscrAnalysis.monthly_cash_flow),
          accent: dscrAnalysis.monthly_cash_flow >= 0 ? "rq-value-positive" : "rq-value-negative",
        },
      ];
    }
  }, [dealType, loanSizing, exitAnalysis, dscrAnalysis]);

  const toggleAdjuster = (key: string) => {
    if (activeAdjusterKeys.includes(key)) {
      onAdjusterKeysChange(activeAdjusterKeys.filter((k) => k !== key));
    } else {
      onAdjusterKeysChange([...activeAdjusterKeys, key]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Deal Type Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Deal Type:</span>
        <div className="flex gap-2">
          {["rtl", "dscr"].map((type) => (
            <button
              key={type}
              onClick={() => onDealTypeChange?.(type as DealType)}
              className={cn(
                "px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                dealType === type
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {type === "rtl" ? "Fix & Flip" : "DSCR Rental"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <MetricBar items={kpiItems} />

      {/* Program Selector */}
      <SectionCard title="Program Selection" icon={BarChart3}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="inline-field-label">Program</label>
            <Select value={selectedProgramId} onValueChange={onProgramChange}>
              <SelectTrigger className="inline-field w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PROGRAMS.map((prog) => (
                  <SelectItem key={prog.id} value={prog.id}>
                    {prog.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProgram.description && (
            <p className="text-xs text-muted-foreground">{selectedProgram.description}</p>
          )}
        </div>
      </SectionCard>

      {/* Loan Sizing Waterfall */}
      <SectionCard title="Loan Sizing Waterfall" icon={DollarSign}>
        <TableShell>
          <thead>
            <tr>
              <TH align="left">Constraint</TH>
              <TH align="right">Max %</TH>
              <TH align="right">Basis</TH>
              <TH align="right">Max Loan</TH>
            </tr>
          </thead>
          <tbody>
            {[
              {
                name: "LTV",
                key: "ltv",
                pct: adjustedLimits.adjusted_ltv,
                basis: n(dealInputs.appraised_value) || n(dealInputs.after_repair_value),
                max: loanSizing.max_by_ltv,
              },
              {
                name: "LTC",
                key: "ltc",
                pct: adjustedLimits.adjusted_ltc,
                basis:
                  n(dealInputs.purchase_price) + n(dealInputs.rehab_budget),
                max: loanSizing.max_by_ltc,
              },
              {
                name: "LTP",
                key: "ltp",
                pct: adjustedLimits.adjusted_ltp,
                basis: n(dealInputs.after_repair_value),
                max: loanSizing.max_by_ltp,
              },
            ].map((row) => (
              <tr
                key={row.key}
                className={cn(
                  "border-t",
                  loanSizing.binding_constraint === row.key ? "bg-amber-50 dark:bg-amber-950/20" : ""
                )}
              >
                <td className="rq-td font-medium">
                  {row.name}
                  {loanSizing.binding_constraint === row.key && (
                    <span className="ml-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      BINDING
                    </span>
                  )}
                </td>
                <td className="rq-td text-right">{row.pct.toFixed(1)}%</td>
                <td className="rq-td text-right num">{fmtCurrency(row.basis)}</td>
                <td className="rq-td text-right num font-semibold">
                  {fmtCurrency(row.max)}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>

        {/* Max Loan Callout */}
        <div className="mt-4 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
          <div className="text-xs font-semibold text-muted-foreground mb-1">MAXIMUM LOAN AMOUNT</div>
          <div className="text-2xl font-bold num">
            {fmtCurrency(loanSizing.max_loan)}
          </div>
        </div>
      </SectionCard>

      {/* Program Terms Summary */}
      <SectionCard title="Program Terms" icon={Zap}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="inline-field-label">Interest Rate</div>
            <div className="text-lg font-semibold">{loanSizing.effective_rate.toFixed(2)}%</div>
          </div>
          <div>
            <div className="inline-field-label">Origination Points</div>
            <div className="text-lg font-semibold">{loanSizing.effective_pts.toFixed(2)}%</div>
          </div>
          <div>
            <div className="inline-field-label">Origination Fee</div>
            <div className="text-lg font-semibold num">
              {fmtCurrency(loanSizing.effective_origination_fee)}
            </div>
          </div>
          <div>
            <div className="inline-field-label">Min FICO</div>
            <div className="text-lg font-semibold">{selectedProgram.min_fico}</div>
          </div>
          {selectedProgram.min_experience_years && (
            <div>
              <div className="inline-field-label">Min Experience</div>
              <div className="text-lg font-semibold">
                {selectedProgram.min_experience_years}+ yrs
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Leverage Adjusters (if program supports them) */}
      {hasAdjusters && (
        <SectionCard
          title="Leverage Adjusters"
          icon={Building2}
          actions={
            <button
              onClick={() => setExpandedAdjusters(!expandedAdjusters)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
                expandedAdjusters && "text-foreground"
              )}
            >
              <ChevronDown
                className={cn("h-3 w-3 transition-transform", expandedAdjusters && "rotate-180")}
              />
              {expandedAdjusters ? "Hide" : "Show"}
            </button>
          }
        >
          {expandedAdjusters && selectedProgram.adjusters && (
            <div className="space-y-3">
              {selectedProgram.adjusters.map((adj) => (
                <div
                  key={adj.key}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30"
                >
                  <input
                    type="checkbox"
                    checked={activeAdjusterKeys.includes(adj.key)}
                    onChange={() => toggleAdjuster(adj.key)}
                    className="mt-1 h-4 w-4 rounded border-input cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{adj.label}</div>
                    {adj.description && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {adj.description}
                      </div>
                    )}
                    {(adj.ltc_impact || adj.ltv_impact || adj.ltp_impact) && (
                      <div className="text-xs text-primary mt-1">
                        {[
                          adj.ltc_impact && `LTC +${adj.ltc_impact}%`,
                          adj.ltv_impact && `LTV +${adj.ltv_impact}%`,
                          adj.ltp_impact && `LTP +${adj.ltp_impact}%`,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {!expandedAdjusters && (
            <p className="text-sm text-muted-foreground">
              {activeAdjusterKeys.length} of {selectedProgram.adjusters?.length || 0} adjusters
              selected
            </p>
          )}
        </SectionCard>
      )}

      {/* DSCR-Specific Analysis */}
      {dealType === "dscr" && (
        <SectionCard title="DSCR Analysis" icon={BarChart3}>
          <TableShell>
            <thead>
              <tr>
                <TH align="left">Monthly Metric</TH>
                <TH align="right">Amount</TH>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="rq-td font-medium">Rental Income</td>
                <td className="rq-td text-right num">{fmtCurrency(dscrAnalysis.monthly_rent)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td font-medium">Operating Expenses</td>
                <td className="rq-td text-right num">
                  ({fmtCurrency(dscrAnalysis.monthly_expenses_total)})
                </td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="rq-td font-semibold">Net Operating Income</td>
                <td className="rq-td text-right num font-semibold">
                  {fmtCurrency(dscrAnalysis.monthly_noi)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td font-medium">Principal & Interest</td>
                <td className="rq-td text-right num">
                  ({fmtCurrency(dscrAnalysis.monthly_pi)})
                </td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="rq-td font-semibold">Monthly Cash Flow</td>
                <td className="rq-td text-right num font-semibold">
                  {fmtCurrency(dscrAnalysis.monthly_cash_flow)}
                </td>
              </tr>
              <tr className="border-t bg-primary/5">
                <td className="rq-td font-semibold">DSCR Ratio</td>
                <td className="rq-td text-right text-lg font-semibold">
                  {dscrAnalysis.dscr.toFixed(2)}x
                </td>
              </tr>
            </tbody>
          </TableShell>
          <div className="mt-3 text-xs text-muted-foreground">
            Annual Cash Flow: {fmtCurrency(dscrAnalysis.cash_flow_annual)}
          </div>
        </SectionCard>
      )}

      {/* RTL-Specific Analysis */}
      {dealType === "rtl" && (
        <SectionCard title="Exit Analysis" icon={BarChart3}>
          <TableShell>
            <thead>
              <tr>
                <TH align="left">Exit Metric</TH>
                <TH align="right">Amount</TH>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="rq-td font-medium">Projected Sale Price</td>
                <td className="rq-td text-right num">
                  {fmtCurrency(exitAnalysis.gross_sale_proceeds)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td font-medium">Sales Disposition Costs</td>
                <td className="rq-td text-right num">
                  ({fmtCurrency(exitAnalysis.sales_disposition_cost)})
                </td>
              </tr>
              <tr className="border-t bg-muted/30">
                <td className="rq-td font-semibold">Net Sale Proceeds</td>
                <td className="rq-td text-right num font-semibold">
                  {fmtCurrency(exitAnalysis.net_proceeds)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td font-medium">Total Cost Basis</td>
                <td className="rq-td text-right num">
                  ({fmtCurrency(exitAnalysis.total_cost_basis)})
                </td>
              </tr>
              <tr className="border-t bg-primary/5">
                <td className="rq-td font-semibold">Net Profit</td>
                <td
                  className={cn(
                    "rq-td text-right text-lg font-semibold num",
                    exitAnalysis.net_profit >= 0
                      ? "rq-value-positive"
                      : "rq-value-negative"
                  )}
                >
                  {fmtCurrency(exitAnalysis.net_profit)}
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td font-medium">Borrower ROI</td>
                <td className="rq-td text-right text-lg font-semibold">
                  {exitAnalysis.borrower_roi.toFixed(1)}%
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td font-medium">Annualized ROI</td>
                <td className="rq-td text-right text-lg font-semibold">
                  {exitAnalysis.annualized_roi.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </TableShell>
        </SectionCard>
      )}
    </div>
  );
}
