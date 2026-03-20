"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useCommercialUWStore } from "../store";
import { useCommercialUWCalcs } from "../use-calcs";
import { UWCard } from "../uw-card";
import { UWInput } from "../uw-input";
import { NoteButton } from "../note-button";
import { fmtCurrency, fmtNumber } from "../format-utils";
import { cn } from "@/lib/utils";

function SummaryRow({ label, pct, value, isLast }: { label: string; pct: string; value: string; isLast?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center py-2.5", !isLast && "border-b border-border/50")}>
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-[11px] text-muted-foreground tabular-nums">{pct}</span>
        <span className="text-[13px] font-semibold tabular-nums min-w-[90px] text-right">{value}</span>
      </div>
    </div>
  );
}

function BudgetRow({
  label, pct, perUnit, total, bold, indent, editable, note, noteText, onTotalChange,
}: {
  label: string; pct?: string; perUnit?: string; total?: string; bold?: boolean; indent?: boolean;
  editable?: boolean; note?: boolean; noteText?: string; onTotalChange?: (v: number) => void;
}) {
  return (
    <tr className={cn(bold ? "bg-foreground/[0.03]" : "hover:bg-foreground/[0.02] transition-colors")}>
      <td className={cn(
        "px-[14px] h-[42px] text-[13px] border-b tabular-nums",
        indent ? "pl-[38px]" : "pl-[22px]",
        bold ? "font-bold" : "font-normal text-muted-foreground",
        bold ? "text-[13px]" : "text-xs"
      )}>
        <div className="flex items-center gap-1.5">
          {label}
          {note && <NoteButton note={noteText || ""} />}
        </div>
      </td>
      <td className={cn("px-[14px] h-[42px] text-center text-xs text-muted-foreground border-b tabular-nums", bold && "font-bold text-foreground")}>
        {pct || ""}
      </td>
      <td className={cn("px-[14px] h-[42px] text-right text-xs text-muted-foreground border-b tabular-nums", bold && "font-bold text-foreground")}>
        {perUnit ? `$${perUnit}` : ""}
      </td>
      <td className={cn("px-[14px] pr-[22px] h-[42px] text-right border-b tabular-nums", bold ? "font-bold text-[13px]" : "font-medium text-muted-foreground text-[13px]")}>
        {editable ? (
          <div className="flex items-center justify-end">
            <span className="text-muted-foreground text-xs mr-0.5">$</span>
            <input
              defaultValue={total || ""}
              onBlur={(e) => onTotalChange?.(parseFloat(e.target.value.replace(/,/g, "")) || 0)}
              className="max-w-[110px] text-right rounded-lg border border-border bg-accent/50 text-foreground px-[7px] py-[5px] text-xs tabular-nums outline-none"
            />
          </div>
        ) : total ? `$${total}` : ""}
      </td>
    </tr>
  );
}

function SectionHeader({ label, sub }: { label: string; sub?: boolean }) {
  return (
    <tr>
      <td colSpan={4} className={cn(
        "text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground border-b",
        sub ? "px-[22px] pt-[10px] pb-1.5" : "px-[22px] pt-4 pb-1.5 bg-foreground/[0.01]"
      )}>
        {label}
      </td>
    </tr>
  );
}

export function SourcesUsesTab() {
  const { state, updateField, updateClosingCost, updateReserve, updateCapexItem, addCapexItem, removeCapexItem, addCapexCategory } = useCommercialUWStore();
  const calcs = useCommercialUWCalcs(state);
  const [useCapexOverride, setUseCapexOverride] = useState(state.capexOverride !== null);

  const totalBudget = calcs.totalAcquisitionBudget;
  const pctOf = (n: number) => totalBudget > 0 ? ((n / totalBudget) * 100).toFixed(1) + "%" : "0.0%";
  const perUnit = (n: number) => state.totalUnits > 0 ? fmtNumber(Math.round(n / state.totalUnits)) : "0";

  return (
    <div className="flex flex-col gap-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-5">
        <UWCard title="Sources" accent="hsl(145, 63%, 29%)">
          <SummaryRow label="Going-In Loan" pct={pctOf(state.goingInLoanAmount)} value={fmtCurrency(state.goingInLoanAmount)} />
          <SummaryRow label="LP Equity" pct={pctOf(calcs.lpEquity)} value={fmtCurrency(calcs.lpEquity)} />
          <SummaryRow label="GP Co-Invest" pct={pctOf(calcs.gpEquity)} value={fmtCurrency(calcs.gpEquity)} />
          <SummaryRow label="Seller Credit" pct="0.0%" value="$0" isLast />
          <div className="flex justify-between items-center pt-3 border-t-2 mt-1">
            <span className="text-[13px] font-bold">Total Sources</span>
            <span className="text-[15px] font-bold tabular-nums">{fmtCurrency(calcs.totalSources)}</span>
          </div>
        </UWCard>

        <UWCard title="Uses" accent="hsl(210, 55%, 41%)">
          <SummaryRow label="Purchase Price" pct={pctOf(state.purchasePrice)} value={fmtCurrency(state.purchasePrice)} />
          <SummaryRow label="Closing Costs" pct={pctOf(calcs.totalClosingCosts)} value={fmtCurrency(calcs.totalClosingCosts)} />
          <SummaryRow label="Acquisition Fee" pct={pctOf(state.acquisitionFee)} value={fmtCurrency(state.acquisitionFee)} />
          <SummaryRow label="Reserves" pct={pctOf(calcs.totalReserves)} value={fmtCurrency(calcs.totalReserves)} />
          <SummaryRow label="Improvement Budget" pct={pctOf(calcs.totalCapex)} value={fmtCurrency(calcs.totalCapex)} isLast />
          <div className="flex justify-between items-center pt-3 border-t-2 mt-1">
            <span className="text-[13px] font-bold">Total Uses</span>
            <span className="text-[15px] font-bold tabular-nums">{fmtCurrency(totalBudget)}</span>
          </div>
        </UWCard>
      </div>

      {/* Acquisition Budget Detail */}
      <UWCard title="Acquisition Budget" subtitle="Detailed breakdown of all costs. Amounts are editable — computed fields auto-calculate." noPad>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-accent/50">
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] pl-[22px] border-b-2 w-[40%]">Description</th>
                <th className="text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 w-[15%]">Notes / Rate</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 w-[15%]">$/Unit</th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] pr-[22px] border-b-2 w-[20%]">Total</th>
              </tr>
            </thead>
            <tbody>
              <BudgetRow label="Purchase Price" pct={pctOf(state.purchasePrice)} perUnit={perUnit(state.purchasePrice)} total={fmtNumber(state.purchasePrice)} bold />

              <SectionHeader label="Closing Costs" />
              {state.closingCosts.map((c) => (
                <BudgetRow
                  key={c.id}
                  label={c.label}
                  perUnit={state.totalUnits > 0 ? fmtNumber(Math.round(c.amount / state.totalUnits)) : undefined}
                  total={fmtNumber(c.amount)}
                  indent
                  editable
                  note={!!c.note}
                  noteText={c.note}
                  onTotalChange={(v) => updateClosingCost(c.id, "amount", v)}
                />
              ))}
              <BudgetRow label="Closing Costs" pct={pctOf(calcs.totalClosingCosts)} perUnit={perUnit(calcs.totalClosingCosts)} total={fmtNumber(calcs.totalClosingCosts)} bold />

              <SectionHeader label="Acquisition Fee" sub />
              <BudgetRow label="Acquisition Fee" pct={pctOf(state.acquisitionFee)} perUnit={perUnit(state.acquisitionFee)} total={fmtNumber(state.acquisitionFee)} indent editable onTotalChange={(v) => updateField("acquisitionFee", v)} />
              <BudgetRow label="Acquisition Fee" pct={pctOf(state.acquisitionFee)} perUnit={perUnit(state.acquisitionFee)} total={fmtNumber(state.acquisitionFee)} bold />

              <SectionHeader label="Reserves for Closing" sub />
              {state.reserves.map((r) => (
                <BudgetRow
                  key={r.id}
                  label={r.label}
                  perUnit={state.totalUnits > 0 && r.amount > 0 ? fmtNumber(Math.round(r.amount / state.totalUnits)) : undefined}
                  total={r.amount > 0 ? fmtNumber(r.amount) : "—"}
                  indent
                  editable
                  onTotalChange={(v) => updateReserve(r.id, "amount", v)}
                />
              ))}
              <BudgetRow label="Total Reserves" pct={pctOf(calcs.totalReserves)} perUnit={perUnit(calcs.totalReserves)} total={fmtNumber(calcs.totalReserves)} bold />

              <SectionHeader label="Improvement / Capex Budget" sub />
            </tbody>
          </table>
        </div>

        {/* Capex inline section */}
        <div className="border-t px-[22px] py-[18px]">
          <div className="flex items-center gap-4 mb-4 p-3 bg-accent/50 rounded-lg border">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setUseCapexOverride(!useCapexOverride);
                  if (!useCapexOverride) {
                    updateField("capexOverride", calcs.totalCapex);
                  } else {
                    updateField("capexOverride", null);
                  }
                }}
                className="w-[38px] h-5 rounded-full relative cursor-pointer transition-colors"
                style={{ background: useCapexOverride ? "hsl(210, 55%, 41%)" : "hsl(var(--border))" }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-[left]"
                  style={{ left: useCapexOverride ? 20 : 2 }}
                />
              </button>
              <span className={cn("text-xs font-medium", useCapexOverride ? "text-foreground" : "text-muted-foreground")}>
                Use manual override
              </span>
            </div>
            {useCapexOverride && (
              <UWInput
                value={state.capexOverride ?? 0}
                prefix="$"
                width="160px"
                onChange={(v) => updateField("capexOverride", v)}
              />
            )}
            {!useCapexOverride && (
              <div className="text-xs text-muted-foreground">
                Detailed budget total: <span className="font-semibold text-foreground tabular-nums">{fmtCurrency(calcs.totalCapex)}</span>
              </div>
            )}
          </div>

          {!useCapexOverride && state.capexCategories.map((cat) => (
            <div key={cat.id} className="mb-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2 pb-1.5 border-b">
                {cat.name}
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[40%]">Description</th>
                    <th className="text-center text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[10%]">Qty</th>
                    <th className="text-right text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[18%]">Unit Cost</th>
                    <th className="text-right text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[18%]">Total</th>
                    <th className="text-center text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[10%]">Timeline</th>
                    <th className="text-[9px] p-[9px_14px] border-b w-[4%]" />
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((item) => (
                    <tr key={item.id} className="hover:bg-foreground/[0.02] transition-colors">
                      <td className="h-9 px-[14px] text-xs text-muted-foreground border-b">
                        <input
                          defaultValue={item.description}
                          onBlur={(e) => updateCapexItem(cat.id, item.id, "description", e.target.value)}
                          className="w-full text-left rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs outline-none"
                        />
                      </td>
                      <td className="h-9 px-[14px] text-center border-b">
                        <input
                          defaultValue={item.qty}
                          onBlur={(e) => updateCapexItem(cat.id, item.id, "qty", parseFloat(e.target.value) || 0)}
                          className="w-[50px] text-center rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs tabular-nums outline-none"
                        />
                      </td>
                      <td className="h-9 px-[14px] border-b">
                        <div className="flex items-center justify-end">
                          <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                          <input
                            defaultValue={fmtNumber(item.unitCost)}
                            onBlur={(e) => updateCapexItem(cat.id, item.id, "unitCost", parseFloat(e.target.value.replace(/,/g, "")) || 0)}
                            className="max-w-[90px] text-right rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs tabular-nums outline-none"
                          />
                        </div>
                      </td>
                      <td className="h-9 px-[14px] text-right font-semibold text-xs border-b tabular-nums">
                        {fmtCurrency(item.qty * item.unitCost)}
                      </td>
                      <td className="h-9 px-[14px] text-center border-b">
                        <select
                          defaultValue={item.timeline}
                          onChange={(e) => updateCapexItem(cat.id, item.id, "timeline", e.target.value)}
                          className="rounded-lg border border-border bg-accent/50 px-1.5 py-[3px] text-[10px] cursor-pointer outline-none"
                        >
                          {["Yr 1", "Yr 2", "Yr 3", "Yr 1-2", "Yr 1-3", "Yr 2-3"].map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                        </select>
                      </td>
                      <td className="h-9 px-[14px] text-center border-b">
                        <button
                          onClick={() => removeCapexItem(cat.id, item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-1.5">
                <button
                  onClick={() => addCapexItem(cat.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors"
                >
                  <Plus className="w-3 h-3" strokeWidth={2} />
                  Add Line Item
                </button>
              </div>
            </div>
          ))}
          {!useCapexOverride && (
            <button
              onClick={addCapexCategory}
              className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={2} />
              Add Category
            </button>
          )}
        </div>

        {/* Grand Totals */}
        <div className="border-t-2">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="bg-foreground/[0.03]">
                <td className="px-[14px] pl-[22px] h-[42px] font-bold text-[13px] w-[40%] border-b">Total Improvement Budget</td>
                <td className="px-[14px] h-[42px] text-center font-semibold w-[15%] border-b tabular-nums">{pctOf(calcs.totalCapex)}</td>
                <td className="px-[14px] h-[42px] text-right font-semibold w-[15%] border-b tabular-nums" />
                <td className="px-[14px] pr-[22px] h-[42px] text-right font-bold w-[20%] border-b tabular-nums">{fmtCurrency(calcs.totalCapex)}</td>
              </tr>
              <tr style={{ background: "hsl(36, 40%, 42%, 0.07)" }}>
                <td className="px-[14px] pl-[22px] h-[42px] font-bold text-sm">Total Acquisition Budget</td>
                <td className="px-[14px] h-[42px] text-center font-bold tabular-nums">100.0%</td>
                <td className="px-[14px] h-[42px] text-right font-bold tabular-nums">${perUnit(totalBudget)}</td>
                <td className="px-[14px] pr-[22px] h-[42px] text-right font-bold text-sm text-gold tabular-nums">{fmtCurrency(totalBudget)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </UWCard>
    </div>
  );
}
