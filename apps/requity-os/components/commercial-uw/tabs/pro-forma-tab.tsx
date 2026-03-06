"use client";

import { useCommercialUWStore } from "../store";
import { useCommercialUWCalcs } from "../use-calcs";
import { UWCard, UWKpi } from "../uw-card";
import { fmtCurrency, fmtPct, fmtMultiple } from "../format-utils";
import { cn } from "@/lib/utils";

function SectionRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={7} className="px-[22px] pt-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground border-b bg-foreground/[0.01]">
        {label}
      </td>
    </tr>
  );
}

function SpacerRow() {
  return <tr><td colSpan={7} className="p-0 h-1.5" /></tr>;
}

function PFRow({
  label, t12, values, bold, indent, highlight, color, borderTop,
}: {
  label: string; t12?: string; values: string[];
  bold?: boolean; indent?: boolean; highlight?: boolean;
  color?: string; borderTop?: boolean;
}) {
  return (
    <tr
      className={cn(
        highlight ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02]",
        "transition-colors"
      )}
    >
      <td
        className={cn(
          "px-[14px] h-[42px] text-foreground border-b tabular-nums",
          indent ? "pl-10" : bold ? "pl-[22px]" : "pl-[30px]",
          bold ? "font-bold text-[13px]" : "text-xs font-normal",
          borderTop && "border-t-2",
        )}
        style={color ? { color } : undefined}
      >
        {label}
      </td>
      <td
        className={cn(
          "px-[14px] h-[42px] text-right border-b border-r tabular-nums",
          bold ? "font-bold" : "font-normal",
          borderTop && "border-t-2",
        )}
        style={{ color: t12 ? "#C5975B" : "transparent" }}
      >
        {t12 || "—"}
      </td>
      {values.map((v, j) => (
        <td
          key={j}
          className={cn(
            "px-[14px] h-[42px] text-right border-b tabular-nums text-[13px]",
            bold ? "font-bold" : "font-normal",
            borderTop && "border-t-2",
          )}
          style={color ? { color } : undefined}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}

export function ProFormaTab() {
  const { state } = useCommercialUWStore();
  const c = useCommercialUWCalcs(state);

  const fmt = (n: number) => {
    if (n === 0) return "$0";
    if (n < 0) return `(${fmtCurrency(Math.abs(n))})`;
    return fmtCurrency(n);
  };
  const fmtArr = (arr: number[]) => arr.map(fmt);
  const fmtNeg = (arr: number[]) => arr.map((n) => n === 0 ? "$0" : n > 0 ? `(${fmtCurrency(n)})` : fmtCurrency(Math.abs(n)));
  const destructive = "hsl(4, 78%, 57%)";

  return (
    <div className="flex flex-col gap-5">
      {/* Deal Analysis KPIs */}
      <UWCard title="Deal Analysis">
        <div className="flex gap-2.5 flex-wrap">
          <UWKpi label="Current NOI" value={fmtCurrency(c.noiByYear[0])} />
          <UWKpi label="Going-In Cap" value={fmtPct(c.capRateByYear[0])} />
          <UWKpi label="Year 1 DSCR" value={fmtMultiple(c.dscrByYear[0])} color={c.dscrByYear[0] < 1 ? destructive : undefined} />
          <UWKpi label="Cash-on-Cash" value={fmtPct(c.cashOnCashByYear[0])} color={c.cashOnCashByYear[0] < 0 ? destructive : undefined} />
          <UWKpi label="Debt Yield" value={fmtPct(state.goingInLoanAmount > 0 ? ((c.noiByYear[0] || 0) / state.goingInLoanAmount) * 100 : 0)} />
        </div>
        <div className="flex gap-2.5 mt-2.5 flex-wrap">
          <UWKpi label="Price / Unit" value={fmtCurrency(c.pricePerUnit)} sub={`${state.totalUnits} units`} />
          <UWKpi label="Price / SF" value={fmtCurrency(c.pricePerSF)} sub={`${new Intl.NumberFormat("en-US").format(state.totalSF)} SF`} />
          <UWKpi label="NOI / Unit" value={fmtCurrency(c.noiPerUnit)} />
          <UWKpi label="Yield-on-Cost" value={fmtPct(c.yieldOnCostByYear[0])} />
          <UWKpi label="Equity Multiple" value={c.projectEquityMultiple > 0 ? fmtMultiple(c.projectEquityMultiple) : "—"} />
        </div>
      </UWCard>

      {/* 5-Year Pro Forma */}
      <UWCard title="5-Year Pro Forma" subtitle="T12 historical vs. projected performance" noPad>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-accent/50">
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] pl-[22px] border-b-2 w-[22%]" />
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 border-r w-[13%]">
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    T12
                  </span>
                </th>
                {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map((y) => (
                  <th key={y} className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2">
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SectionRow label="INCOME" />
              <PFRow label="Gross Potential Rent" t12={fmtCurrency(state.t12GPI)} values={fmtArr(c.gpiByYear)} />
              <PFRow label="Ancillary Income" t12={fmtCurrency(c.totalAncillaryCurrent)} values={c.gpiByYear.map(() => fmtCurrency(c.totalAncillaryStabilized))} />
              <PFRow
                label="Gross Potential Income"
                t12={fmtCurrency(state.t12GPI + c.totalAncillaryCurrent)}
                values={c.gpiByYear.map((g) => fmtCurrency(g + c.totalAncillaryStabilized))}
                bold
                borderTop
              />
              <PFRow label="Physical Vacancy" values={c.gpiByYear.map((g, i) => `(${fmtCurrency(g * (state.physicalVacancy[i] || 0) / 100)})`)} indent color={destructive} />
              <PFRow label="Economic Vacancy" values={c.gpiByYear.map((g, i) => `(${fmtCurrency(g * (state.economicVacancy[i] || 0) / 100)})`)} indent color={destructive} />
              <PFRow label="Loss to Lease" values={c.gpiByYear.map((g, i) => `(${fmtCurrency(g * (state.lossToLease[i] || 0) / 100)})`)} indent color={destructive} />
              <PFRow label="Bad Debt" t12={`(${fmtCurrency(state.t12BadDebt)})`} values={fmtNeg(c.badDebtByYear)} indent color={destructive} />
              <PFRow label="Effective Gross Income" t12={fmtCurrency(c.t12EGI)} values={fmtArr(c.egiByYear)} bold borderTop />

              <SectionRow label="EXPENSES" />
              {state.expenseLineItems.map((ex) => {
                const yr1Val = ex.isPercentOfEGI && ex.pctOfEGI !== null
                  ? c.egiByYear[0] * (ex.pctOfEGI / 100)
                  : (ex.yr1Override !== null && ex.yr1Override !== 0 ? ex.yr1Override : ex.t12Actual);
                const vals = c.egiByYear.map((_, yr) => {
                  if (yr === 0) return yr1Val;
                  let v = yr1Val;
                  for (let g = 1; g <= yr; g++) v *= 1 + (state.expenseGrowth[g] || 0) / 100;
                  return v;
                });
                return (
                  <PFRow
                    key={ex.id}
                    label={ex.label}
                    t12={fmtCurrency(ex.t12Actual)}
                    values={vals.map(fmtCurrency)}
                  />
                );
              })}
              <PFRow label="Total OpEx" t12={fmtCurrency(c.totalT12OpEx)} values={fmtArr(c.opexByYear)} bold borderTop color={destructive} />

              <SpacerRow />
              <PFRow label="Net Operating Income" t12={fmtCurrency(c.t12EGI - c.totalT12OpEx)} values={fmtArr(c.noiByYear)} bold highlight />
              <SpacerRow />
              <PFRow label="Replacement Reserve" values={c.replacementReserveByYear.map((r) => `(${fmtCurrency(r)})`)} indent color="hsl(var(--muted-foreground))" />
              <PFRow label="NOI After Reserves" values={fmtArr(c.noiAfterReservesByYear)} bold />

              <SectionRow label="DEBT SERVICE" />
              <PFRow
                label="Going-In Loan"
                values={c.debtServiceByYear.map((_, i) =>
                  i < Math.ceil(state.goingInTermMonths / 12)
                    ? `(${fmtCurrency(state.goingInLoanAmount * (state.goingInInterestRate / 100))})`
                    : "—"
                )}
                color={destructive}
              />
              <PFRow
                label="Permanent Loan"
                values={c.debtServiceByYear.map((ds, i) =>
                  i >= Math.ceil(state.goingInTermMonths / 12)
                    ? `(${fmtCurrency(ds)})`
                    : "—"
                )}
                color={destructive}
              />
              <PFRow label="Total Debt Service" values={c.debtServiceByYear.map((ds) => `(${fmtCurrency(ds)})`)} bold borderTop color={destructive} />

              <SpacerRow />
              <PFRow label="Net Cash Flow" values={fmtArr(c.ncfByYear)} bold highlight />

              <SectionRow label="RETURNS" />
              <PFRow
                label="DSCR"
                values={c.dscrByYear.map((d) => fmtMultiple(d))}
                color={c.dscrByYear.some((d) => d < 1) ? destructive : undefined}
              />
              <PFRow label="Yield-on-Cost" values={c.yieldOnCostByYear.map((y) => fmtPct(y))} />
              <PFRow
                label="Cash-on-Cash"
                values={c.cashOnCashByYear.map((coc) => fmtPct(coc))}
                color={c.cashOnCashByYear.some((coc) => coc < 0) ? destructive : undefined}
              />
              <PFRow label="Cap Rate" values={c.capRateByYear.map((cr) => fmtPct(cr))} />
            </tbody>
          </table>
        </div>
      </UWCard>
    </div>
  );
}
