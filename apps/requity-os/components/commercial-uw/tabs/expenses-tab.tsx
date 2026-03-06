"use client";

import { Upload } from "lucide-react";
import { useCommercialUWStore } from "../store";
import { useCommercialUWCalcs } from "../use-calcs";
import { UWCard } from "../uw-card";
import { UWInput } from "../uw-input";
import { NoteButton } from "../note-button";
import { fmtCurrencyDetail } from "../format-utils";
import { cn } from "@/lib/utils";

export function ExpensesTab() {
  const { state, updateField, updateArrayField, updateExpenseItem } = useCommercialUWStore();
  const calcs = useCommercialUWCalcs(state);
  const yrs = ["Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"];

  return (
    <div className="flex flex-col gap-5">
      {/* T12 Historical Data */}
      <UWCard
        title="T12 Historical Data"
        action={
          <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors">
            <Upload className="w-[13px] h-[13px]" strokeWidth={1.5} />
            Upload T12
          </button>
        }
      >
        <div className="flex gap-3.5">
          <UWInput label="Gross Potential Income" value={state.t12GPI} prefix="$" onChange={(v) => updateField("t12GPI", v)} />
          <UWInput label="Vacancy Loss" value={state.t12VacancyLoss} prefix="$" onChange={(v) => updateField("t12VacancyLoss", v)} />
          <UWInput label="Bad Debt" value={state.t12BadDebt} prefix="$" onChange={(v) => updateField("t12BadDebt", v)} />
          <UWInput label="Effective Gross Income" value={calcs.t12EGI} prefix="$" disabled />
        </div>
      </UWCard>

      {/* Operating Expenses */}
      <UWCard
        title="Operating Expenses"
        subtitle="T12 actuals alongside Year 1 overrides. Click the comment icon to document assumptions."
        noPad
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-accent/50">
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] pl-[22px] border-b-2 w-[25%]">
                  Line Item
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 w-[14%]">
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    T12 Actual
                  </span>
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 border-l w-[14%]">
                  <span className="flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-dash-info" />
                    Yr 1 Override
                  </span>
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 w-[11%]">
                  Variance
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 w-[10%]">
                  $/Unit
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 w-[10%]">
                  % of EGI
                </th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] pr-[22px] border-b-2 w-[5%]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </th>
              </tr>
            </thead>
            <tbody>
              {state.expenseLineItems.map((it) => {
                const t12 = it.t12Actual;
                const yr1 = it.isPercentOfEGI && it.pctOfEGI !== null
                  ? calcs.t12EGI * (it.pctOfEGI / 100)
                  : it.yr1Override !== null && it.yr1Override !== 0
                    ? it.yr1Override
                    : t12;
                const variance = yr1 - t12;
                const perUnit = state.totalUnits > 0 ? yr1 / state.totalUnits : 0;
                const pctEGI = calcs.t12EGI > 0 ? (yr1 / calcs.t12EGI) * 100 : 0;

                return (
                  <tr key={it.id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-[14px] pl-[22px] h-[42px] text-[13px] font-medium text-muted-foreground border-b tabular-nums">
                      {it.label}
                    </td>
                    <td className="px-[14px] h-[42px] text-right text-gold border-b tabular-nums text-[13px]">
                      ${fmtCurrencyDetail(t12).replace("$", "")}
                    </td>
                    <td className="px-[10px] h-[42px] border-b border-l">
                      {it.isPercentOfEGI ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            defaultValue={it.pctOfEGI ?? ""}
                            onBlur={(e) => updateExpenseItem(it.id, "pctOfEGI", parseFloat(e.target.value) || 0)}
                            className="w-[60px] text-center rounded-lg border border-border bg-accent/50 text-foreground px-[7px] py-[5px] text-xs tabular-nums outline-none"
                          />
                          <span className="text-muted-foreground text-[11px] shrink-0">% EGI</span>
                        </div>
                      ) : (
                        <input
                          defaultValue={it.yr1Override ?? ""}
                          placeholder="—"
                          onBlur={(e) => {
                            const val = e.target.value ? parseFloat(e.target.value.replace(/,/g, "")) : null;
                            updateExpenseItem(it.id, "yr1Override", val);
                          }}
                          className="w-full max-w-[120px] ml-auto text-right rounded-lg border border-border bg-transparent text-foreground px-[7px] py-[5px] text-xs tabular-nums outline-none block"
                        />
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-[14px] h-[42px] text-right text-xs border-b tabular-nums",
                        variance === 0
                          ? "text-muted-foreground"
                          : variance > 0
                            ? "text-destructive"
                            : "text-dash-success"
                      )}
                    >
                      {variance === 0 ? "—" : `${variance > 0 ? "+" : ""}$${Math.abs(variance).toLocaleString()}`}
                    </td>
                    <td className="px-[14px] h-[42px] text-right text-muted-foreground text-xs border-b tabular-nums">
                      ${perUnit.toFixed(2)}
                    </td>
                    <td className="px-[14px] h-[42px] text-right text-muted-foreground text-xs border-b tabular-nums">
                      {pctEGI.toFixed(1)}%
                    </td>
                    <td className="px-[14px] pr-[18px] h-[42px] text-center border-b">
                      <NoteButton
                        note={it.note}
                        onChange={(v) => updateExpenseItem(it.id, "note", v)}
                      />
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="bg-accent/50">
                <td className="px-[14px] pl-[22px] h-[42px] text-[13px] font-bold border-b-0">
                  Total Operating Expenses
                </td>
                <td className="px-[14px] h-[42px] text-right font-bold text-gold border-b-0 tabular-nums text-[13px]">
                  {fmtCurrencyDetail(calcs.totalT12OpEx)}
                </td>
                <td className="px-[14px] h-[42px] text-right font-bold border-b-0 border-l tabular-nums text-[13px]">
                  {fmtCurrencyDetail(calcs.totalYr1OpEx)}
                </td>
                <td className={cn(
                  "px-[14px] h-[42px] text-right font-semibold border-b-0 text-xs tabular-nums",
                  calcs.totalYr1OpEx - calcs.totalT12OpEx > 0 ? "text-destructive" : "text-dash-success"
                )}>
                  {calcs.totalYr1OpEx - calcs.totalT12OpEx > 0 ? "+" : ""}
                  ${Math.abs(calcs.totalYr1OpEx - calcs.totalT12OpEx).toLocaleString()}
                </td>
                <td className="px-[14px] h-[42px] text-right font-bold border-b-0 tabular-nums text-[13px]">
                  ${state.totalUnits > 0 ? (calcs.totalYr1OpEx / state.totalUnits).toFixed(2) : "0.00"}
                </td>
                <td className="px-[14px] h-[42px] text-right font-bold border-b-0 tabular-nums text-[13px]">
                  {calcs.t12EGI > 0 ? ((calcs.totalYr1OpEx / calcs.t12EGI) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="h-[42px] border-b-0" />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-[22px] py-4 border-t flex items-end gap-3.5">
          <UWInput
            label="Replacement Reserve (Annual)"
            value={state.replacementReserve}
            prefix="$"
            width="200px"
            onChange={(v) => updateField("replacementReserve", v)}
          />
          <UWInput
            label="$/Unit"
            value={state.totalUnits > 0 ? (state.replacementReserve / state.totalUnits).toFixed(2) : "0.00"}
            prefix="$"
            width="120px"
            disabled
          />
        </div>
      </UWCard>

      {/* Expense Growth Assumptions */}
      <UWCard title="Expense Growth Assumptions">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[200px]" />
              {yrs.map((y) => (
                <th key={y} className="text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-0 text-xs font-medium text-muted-foreground border-b h-[42px] tabular-nums">
                Expense Growth %
              </td>
              {state.expenseGrowth.map((v, i) => (
                <td key={i} className="text-center p-[5px_8px] border-b h-[42px]">
                  <input
                    defaultValue={v}
                    onBlur={(e) => updateArrayField("expenseGrowth", i, parseFloat(e.target.value) || 0)}
                    className="w-full max-w-[80px] mx-auto text-center rounded-lg border border-border bg-accent/50 text-foreground px-[7px] py-[5px] text-xs tabular-nums outline-none"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </UWCard>
    </div>
  );
}
