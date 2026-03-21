"use client";

import { useMemo } from "react";
import {
  SectionCard,
  TableShell,
  TH,
  fmtCurrency,
  n,
} from "@/components/pipeline/tabs/financials/shared";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DealType, LoanProgram, ResidentialDealInputs } from "@/lib/residential-uw/types";
import {
  computeLoanSizing,
  computeHoldingCosts,
  computeExitAnalysis,
  computeDSCRAnalysis,
} from "@/lib/residential-uw/computations";

export interface CostsReturnsSectionProps {
  dealInputs: ResidentialDealInputs;
  dealType: DealType;
  selectedProgram: LoanProgram;
  activeAdjusterKeys: string[];
}

const LEGAL_DOC_PREP = 1500;
const TITLE_CLOSING_ESCROW = 2000;
const MAINTENANCE_MONTHLY = 100;
const VACANCY_PCT = 0.05;
const MANAGEMENT_PCT = 0.08;

export function CostsReturnsSection({
  dealInputs,
  dealType,
  selectedProgram,
  activeAdjusterKeys,
}: CostsReturnsSectionProps) {
  const loanSizing = useMemo(
    () => computeLoanSizing(dealInputs, selectedProgram, activeAdjusterKeys),
    [dealInputs, selectedProgram, activeAdjusterKeys]
  );

  const holdingCosts = useMemo(
    () => computeHoldingCosts(dealInputs, loanSizing.max_loan, selectedProgram, activeAdjusterKeys),
    [dealInputs, loanSizing.max_loan, selectedProgram, activeAdjusterKeys]
  );

  const exitAnalysis = useMemo(
    () =>
      computeExitAnalysis(dealInputs, loanSizing.max_loan, holdingCosts, selectedProgram),
    [dealInputs, loanSizing.max_loan, holdingCosts, selectedProgram]
  );

  const dscrAnalysis = useMemo(
    () => computeDSCRAnalysis(dealInputs, loanSizing.max_loan, selectedProgram),
    [dealInputs, loanSizing.max_loan, selectedProgram]
  );

  const salesDispPct = n(dealInputs.sales_disposition_pct) || 5;

  const rtlTotals = useMemo(() => {
    const months = holdingCosts.total_holding_period;
    const purchase = n(dealInputs.purchase_price);
    const rehab = n(dealInputs.rehab_budget);
    const totalBasis = purchase + rehab;
    const origination = loanSizing.effective_origination_fee;
    const interestTotal = holdingCosts.monthly_interest * months;
    const insMonthly = n(dealInputs.annual_insurance) / 12;
    const taxMonthly = n(dealInputs.annual_property_tax) / 12;
    const insTotal = insMonthly * months;
    const taxTotal = taxMonthly * months;
    const utilsTotal = holdingCosts.monthly_utilities * months;
    const totalProjectCost =
      totalBasis +
      origination +
      LEGAL_DOC_PREP +
      TITLE_CLOSING_ESCROW +
      interestTotal +
      insTotal +
      taxTotal +
      utilsTotal;
    return {
      months,
      purchase,
      rehab,
      totalBasis,
      origination,
      interestTotal,
      insMonthly,
      taxMonthly,
      insTotal,
      taxTotal,
      utilsTotal,
      totalProjectCost,
    };
  }, [dealInputs, holdingCosts, loanSizing.effective_origination_fee]);

  const dscrSimplified = useMemo(() => {
    const rent = dscrAnalysis.monthly_rent;
    const vacancyMo = rent * VACANCY_PCT;
    const egiMo = rent - vacancyMo;
    const taxMo = n(dealInputs.annual_property_tax) / 12;
    const insMo = n(dealInputs.annual_insurance) / 12;
    const mgmtMo = rent * MANAGEMENT_PCT;
    const maintMo = MAINTENANCE_MONTHLY;
    const noiMo = egiMo - taxMo - insMo - mgmtMo - maintMo;
    const pi = dscrAnalysis.monthly_pi;
    const cashAfterMo = noiMo - pi;
    return {
      rent,
      vacancyMo,
      egiMo,
      taxMo,
      insMo,
      mgmtMo,
      maintMo,
      noiMo,
      pi,
      cashAfterMo,
      annualNoi: noiMo * 12,
      annualCashAfter: cashAfterMo * 12,
    };
  }, [dealInputs, dscrAnalysis]);

  const closingCostsEstimate =
    loanSizing.effective_origination_fee + loanSizing.max_loan * 0.01 + 500;

  const dscrCashInvested = Math.max(
    n(dealInputs.purchase_price) - loanSizing.max_loan + closingCostsEstimate,
    0
  );

  const cocReturn =
    dscrCashInvested > 0 ? (dscrSimplified.annualCashAfter / dscrCashInvested) * 100 : 0;

  const capRate =
    n(dealInputs.purchase_price) > 0
      ? (dscrSimplified.annualNoi / n(dealInputs.purchase_price)) * 100
      : 0;

  if (dealType === "rtl") {
    const t = rtlTotals;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title={`Project Costs${t.months ? ` · Holding ${t.months} MO` : ""}`}
          icon={DollarSign}
        >
          <TableShell>
            <tbody>
              <tr className="border-t">
                <td colSpan={2} className="rq-td rq-micro-label py-2">
                  Acquisition
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">Purchase Price</td>
                <td className="rq-td text-right num">{fmtCurrency(t.purchase)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">Rehab Budget</td>
                <td className="rq-td text-right num">{fmtCurrency(t.rehab)}</td>
              </tr>
              <tr className="border-t rq-subtotal-row">
                <td className="rq-td font-semibold text-left">Total Basis</td>
                <td className="rq-td text-right num font-semibold">{fmtCurrency(t.totalBasis)}</td>
              </tr>

              <tr className="border-t">
                <td colSpan={2} className="rq-td rq-micro-label py-2">
                  Loan costs
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">
                  Origination Fee ({loanSizing.effective_pts.toFixed(2)} pts)
                </td>
                <td className="rq-td text-right num">{fmtCurrency(t.origination)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">Legal / Doc Prep</td>
                <td className="rq-td text-right num">{fmtCurrency(LEGAL_DOC_PREP)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">Title / Closing / Escrow</td>
                <td className="rq-td text-right num">{fmtCurrency(TITLE_CLOSING_ESCROW)}</td>
              </tr>

              <tr className="border-t">
                <td colSpan={2} className="rq-td rq-micro-label py-2">
                  Holding costs ({t.months} MO)
                </td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">
                  Interest ({fmtCurrency(holdingCosts.monthly_interest)}/mo)
                </td>
                <td className="rq-td text-right num">{fmtCurrency(t.interestTotal)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">
                  Insurance ({fmtCurrency(t.insMonthly)}/mo)
                </td>
                <td className="rq-td text-right num">{fmtCurrency(t.insTotal)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">
                  Property Taxes ({fmtCurrency(t.taxMonthly)}/mo)
                </td>
                <td className="rq-td text-right num">{fmtCurrency(t.taxTotal)}</td>
              </tr>
              <tr className="border-t">
                <td className="rq-td text-left">
                  Utilities ({fmtCurrency(holdingCosts.monthly_utilities)}/mo)
                </td>
                <td className="rq-td text-right num">{fmtCurrency(t.utilsTotal)}</td>
              </tr>

              <tr className="border-t rq-total-row">
                <td className="rq-td text-left text-[15px] font-bold">Total Project Cost</td>
                <td className="rq-td text-right num text-[15px] font-bold">
                  {fmtCurrency(t.totalProjectCost)}
                </td>
              </tr>
            </tbody>
          </TableShell>
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard title="Exit Analysis" icon={TrendingUp}>
            <TableShell>
              <tbody>
                <tr className="border-t">
                  <td className="rq-td font-medium text-left">Projected Sale Price</td>
                  <td className="rq-td text-right num">
                    {fmtCurrency(exitAnalysis.gross_sale_proceeds)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="rq-td font-medium text-left">
                    Disposition Costs ({salesDispPct.toFixed(1)}%)
                  </td>
                  <td className="rq-td text-right num rq-value-negative">
                    ({fmtCurrency(exitAnalysis.sales_disposition_cost)})
                  </td>
                </tr>
                <tr className="border-t rq-subtotal-row">
                  <td className="rq-td font-semibold text-left">Net Sale Proceeds</td>
                  <td className="rq-td text-right num font-semibold">
                    {fmtCurrency(exitAnalysis.net_proceeds)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="rq-td font-medium text-left">Less: Total Project Cost</td>
                  <td className="rq-td text-right num rq-value-negative">
                    ({fmtCurrency(t.totalProjectCost)})
                  </td>
                </tr>
              </tbody>
            </TableShell>
          </SectionCard>

          <div
            className={cn(
              "rounded-xl border p-5",
              exitAnalysis.net_profit >= 0
                ? "bg-emerald-50/5 border-emerald-200/20 dark:bg-emerald-950/20 dark:border-emerald-800/30"
                : "bg-red-50/5 border-red-200/20 dark:bg-red-950/20 dark:border-red-800/30"
            )}
          >
            <div className="rq-micro-label mb-1">Net Profit</div>
            <div
              className={cn(
                "text-2xl font-bold num",
                exitAnalysis.net_profit >= 0 ? "rq-value-positive" : "rq-value-negative"
              )}
            >
              {fmtCurrency(exitAnalysis.net_profit)}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
              <div>
                <div className="text-muted-foreground text-xs">Cash Invested</div>
                <div className="font-medium num mt-0.5">
                  {fmtCurrency(exitAnalysis.total_cost_basis - loanSizing.max_loan)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">ROI</div>
                <div className="font-medium num mt-0.5">{exitAnalysis.borrower_roi.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Annualized ROI</div>
                <div className="font-medium num mt-0.5">
                  {exitAnalysis.annualized_roi.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border text-center py-6 px-4">
            <div className="rq-section-title">Dual Scenario: Bridge + DSCR Takeout</div>
            <p className="text-sm text-muted-foreground mt-1">
              Model a stabilized rental takeout alongside this fix &amp; flip
            </p>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              Add DSCR Takeout Scenario (Coming Soon)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const d = dscrSimplified;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Annual Cash Flow" icon={BarChart3}>
        <TableShell>
          <thead>
            <tr>
              <TH align="left">Item</TH>
              <TH align="right">Monthly</TH>
              <TH align="right">Annual</TH>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="rq-td font-medium text-left rq-value-positive">Gross Rental Income</td>
              <td className="rq-td text-right num rq-value-positive">{fmtCurrency(d.rent)}</td>
              <td className="rq-td text-right num rq-value-positive">{fmtCurrency(d.rent * 12)}</td>
            </tr>
            <tr className="border-t">
              <td className="rq-td text-left text-muted-foreground">Less: Vacancy (5%)</td>
              <td className="rq-td text-right num text-muted-foreground">
                ({fmtCurrency(d.vacancyMo)})
              </td>
              <td className="rq-td text-right num text-muted-foreground">
                ({fmtCurrency(d.vacancyMo * 12)})
              </td>
            </tr>
            <tr className="border-t rq-subtotal-row">
              <td className="rq-td font-semibold text-left">Effective Gross Income</td>
              <td className="rq-td text-right num font-semibold">{fmtCurrency(d.egiMo)}</td>
              <td className="rq-td text-right num font-semibold">{fmtCurrency(d.egiMo * 12)}</td>
            </tr>
            <tr className="border-t">
              <td className="rq-td text-left text-muted-foreground">Property Taxes</td>
              <td className="rq-td text-right num text-muted-foreground">({fmtCurrency(d.taxMo)})</td>
              <td className="rq-td text-right num text-muted-foreground">
                ({fmtCurrency(d.taxMo * 12)})
              </td>
            </tr>
            <tr className="border-t">
              <td className="rq-td text-left text-muted-foreground">Insurance</td>
              <td className="rq-td text-right num text-muted-foreground">({fmtCurrency(d.insMo)})</td>
              <td className="rq-td text-right num text-muted-foreground">
                ({fmtCurrency(d.insMo * 12)})
              </td>
            </tr>
            <tr className="border-t">
              <td className="rq-td text-left text-muted-foreground">Management (8%)</td>
              <td className="rq-td text-right num text-muted-foreground">({fmtCurrency(d.mgmtMo)})</td>
              <td className="rq-td text-right num text-muted-foreground">
                ({fmtCurrency(d.mgmtMo * 12)})
              </td>
            </tr>
            <tr className="border-t">
              <td className="rq-td text-left text-muted-foreground">Maintenance Reserve</td>
              <td className="rq-td text-right num text-muted-foreground">
                ({fmtCurrency(MAINTENANCE_MONTHLY)})
              </td>
              <td className="rq-td text-right num text-muted-foreground">($1,200)</td>
            </tr>
            <tr className="border-t">
              <td className="rq-td font-semibold text-left">Net Operating Income</td>
              <td className="rq-td text-right num font-semibold">{fmtCurrency(d.noiMo)}</td>
              <td className="rq-td text-right num font-semibold">{fmtCurrency(d.annualNoi)}</td>
            </tr>
            <tr className="border-t">
              <td className="rq-td font-medium text-left rq-value-negative">Debt Service P&amp;I</td>
              <td className="rq-td text-right num rq-value-negative">({fmtCurrency(d.pi)})</td>
              <td className="rq-td text-right num rq-value-negative">({fmtCurrency(d.pi * 12)})</td>
            </tr>
            <tr className="border-t bg-emerald-50/40 dark:bg-emerald-950/25">
              <td className="rq-td font-semibold text-left rq-value-positive">
                Cash Flow After Debt
              </td>
              <td
                className={cn(
                  "rq-td text-right num font-semibold",
                  d.cashAfterMo >= 0 ? "rq-value-positive" : "rq-value-negative"
                )}
              >
                {fmtCurrency(d.cashAfterMo)}
              </td>
              <td
                className={cn(
                  "rq-td text-right num font-semibold",
                  d.annualCashAfter >= 0 ? "rq-value-positive" : "rq-value-negative"
                )}
              >
                {fmtCurrency(d.annualCashAfter)}
              </td>
            </tr>
          </tbody>
        </TableShell>
      </SectionCard>

      <SectionCard title="Return Metrics" icon={TrendingUp}>
        <div className="space-y-2">
          <div className="rounded-lg bg-muted/30 px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-[13px] text-muted-foreground">Cash Invested</span>
            <span className="text-[13px] font-medium num">{fmtCurrency(dscrCashInvested)}</span>
          </div>
          <div className="rounded-lg bg-muted/30 px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-[13px] text-muted-foreground">Annual Cash Flow</span>
            <span
              className={cn(
                "text-[13px] font-medium num",
                d.annualCashAfter >= 0 ? "rq-value-positive" : "rq-value-negative"
              )}
            >
              {fmtCurrency(d.annualCashAfter)}
            </span>
          </div>
          <div className="rounded-lg bg-muted/30 px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-[13px] text-muted-foreground">Cash-on-Cash Return</span>
            <span
              className={cn(
                "text-[13px] font-medium num",
                cocReturn > 8 ? "rq-value-positive" : ""
              )}
            >
              {cocReturn.toFixed(1)}%
            </span>
          </div>
          <div className="rounded-lg bg-muted/30 px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-[13px] text-muted-foreground">Cap Rate</span>
            <span className="text-[13px] font-medium num">{capRate.toFixed(2)}%</span>
          </div>
          <div className="rounded-lg bg-muted/30 px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-[13px] text-muted-foreground">DSCR</span>
            <span
              className={cn(
                "text-[13px] font-medium num",
                dscrAnalysis.dscr >= 1.25 ? "rq-value-positive" : "rq-value-warn"
              )}
            >
              {dscrAnalysis.dscr.toFixed(2)}x
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
