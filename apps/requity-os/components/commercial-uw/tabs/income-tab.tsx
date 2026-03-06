"use client";

import { Upload, Plus, Trash2 } from "lucide-react";
import { useCommercialUWStore } from "../store";
import { UWCard } from "../uw-card";
import { UWInput } from "../uw-input";
import { fmtCurrency } from "../format-utils";

export function IncomeTab() {
  const {
    state,
    updateField,
    updateArrayField,
    updateRentRollUnit,
    addRentRollUnit,
    removeRentRollUnit,
    updateAncillaryItem,
    addAncillaryItem,
    removeAncillaryItem,
  } = useCommercialUWStore();

  const yrCols = ["Yr 1", "Yr 2", "Yr 3", "Yr 4", "Yr 5"];

  const assumptions: { label: string; key: "marketRentGrowth" | "physicalVacancy" | "economicVacancy" | "lossToLease"; divider?: boolean }[] = [
    { label: "Market Rent Growth", key: "marketRentGrowth" },
    { label: "VACANCY & LOSS", key: "marketRentGrowth", divider: true },
    { label: "Physical Vacancy", key: "physicalVacancy" },
    { label: "Economic Vacancy", key: "economicVacancy" },
    { label: "Loss to Lease", key: "lossToLease" },
  ];

  const rrTotals = {
    sf: state.rentRoll.reduce((s, u) => s + u.sf, 0),
    rent: state.rentRoll.reduce((s, u) => s + u.rentPerMonth, 0),
    market: state.rentRoll.reduce((s, u) => s + u.marketPerMonth, 0),
    cam: state.rentRoll.reduce((s, u) => s + u.camNNN, 0),
    other: state.rentRoll.reduce((s, u) => s + u.other, 0),
    vacant: state.rentRoll.filter((u) => u.isVacant).length,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Income & Occupancy Assumptions */}
      <UWCard
        title="Income & Occupancy Assumptions"
        subtitle="Annual growth rates and vacancy assumptions for the 5-year pro forma"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b w-[200px]" />
                {yrCols.map((y) => (
                  <th key={y} className="text-center text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b">
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assumptions.map((r, i) => {
                if (r.divider) {
                  return (
                    <tr key={i}>
                      <td colSpan={6} className="pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground border-b">
                        {r.label}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={i}>
                    <td className="py-0 px-0 text-xs font-medium text-muted-foreground border-b h-[42px]">
                      {r.label}
                    </td>
                    {(state[r.key] as number[]).map((v, j) => (
                      <td key={j} className="text-center p-[5px_6px] border-b h-[42px]">
                        <input
                          defaultValue={v}
                          onBlur={(e) => updateArrayField(r.key, j, parseFloat(e.target.value) || 0)}
                          className="w-full max-w-[80px] mx-auto text-center rounded-lg border border-border bg-accent/50 text-foreground px-[7px] py-[5px] text-xs tabular-nums outline-none focus:border-muted-foreground"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3.5 mt-[18px] max-w-[450px]">
          <UWInput label="Stabilized Vacancy %" value={state.stabilizedVacancy} suffix="%" small onChange={(v) => updateField("stabilizedVacancy", v)} />
          <UWInput label="Bad Debt %" value={state.badDebtPct} suffix="%" small onChange={(v) => updateField("badDebtPct", v)} />
        </div>
      </UWCard>

      {/* Rent Roll */}
      <UWCard
        title="Rent Roll"
        action={
          <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg border text-xs font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors">
            <Upload className="w-[13px] h-[13px]" strokeWidth={1.5} />
            Upload Rent Roll
          </button>
        }
        noPad
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-accent/50">
                {["Unit", "Tenant", "SF", "Rent/Mo", "Market/Mo", "CAM/NNN", "Other", "Vac", ""].map((h, i) => (
                  <th
                    key={h || "del"}
                    className={`text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground p-[9px_14px] border-b-2 whitespace-nowrap ${
                      i < 2 ? "text-left" : "text-center"
                    } ${i === 0 ? "pl-[22px]" : ""}`}
                    style={h === "" ? { width: 36 } : h === "Vac" ? { width: 42 } : undefined}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.rentRoll.map((r) => (
                <tr key={r.id} className="group hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-[14px] pl-[22px] h-[42px] text-[13px] border-b">
                    <span className="inline-block px-2 py-0.5 rounded bg-accent/50 text-[11px] font-medium text-muted-foreground border">
                      {r.unit || "—"}
                    </span>
                  </td>
                  <td className="px-[14px] h-[42px] border-b">
                    <input
                      defaultValue={r.tenant}
                      onBlur={(e) => updateRentRollUnit(r.id, "tenant", e.target.value)}
                      className="w-full min-w-[140px] text-left rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs tabular-nums outline-none"
                    />
                  </td>
                  <td className="px-[14px] h-[42px] border-b text-center">
                    <input
                      defaultValue={r.sf}
                      onBlur={(e) => updateRentRollUnit(r.id, "sf", parseFloat(e.target.value) || 0)}
                      className="w-[52px] text-center rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs tabular-nums outline-none"
                    />
                  </td>
                  {(["rentPerMonth", "marketPerMonth", "camNNN", "other"] as const).map((k) => (
                    <td key={k} className="px-[14px] h-[42px] border-b text-center">
                      <div className="flex items-center justify-center">
                        <span className="text-muted-foreground text-[11px] mr-0.5">$</span>
                        <input
                          defaultValue={r[k]}
                          onBlur={(e) => updateRentRollUnit(r.id, k, parseFloat(e.target.value) || 0)}
                          className="w-[58px] text-center rounded-lg border border-border bg-accent/50 px-[7px] py-[5px] text-xs tabular-nums outline-none"
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-[14px] h-[42px] border-b text-center">
                    <input
                      type="checkbox"
                      checked={r.isVacant}
                      onChange={(e) => updateRentRollUnit(r.id, "isVacant", e.target.checked)}
                      className="w-3.5 h-3.5 cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="px-[14px] h-[42px] border-b text-center">
                    <button
                      onClick={() => removeRentRollUnit(r.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-accent/50">
                <td className="px-[14px] pl-[22px] h-[42px] text-[11px] font-semibold text-muted-foreground">
                  TOTALS
                </td>
                <td className="px-[14px] h-[42px]" />
                <td className="px-[14px] h-[42px] text-center font-semibold tabular-nums text-[13px]">{rrTotals.sf}</td>
                <td className="px-[14px] h-[42px] text-center font-semibold tabular-nums text-[13px]">{fmtCurrency(rrTotals.rent)}</td>
                <td className="px-[14px] h-[42px] text-center font-semibold tabular-nums text-[13px]">{fmtCurrency(rrTotals.market * 12)}</td>
                <td className="px-[14px] h-[42px] text-center font-semibold tabular-nums text-[13px]">{fmtCurrency(rrTotals.cam)}</td>
                <td className="px-[14px] h-[42px] text-center font-semibold tabular-nums text-[13px]">{fmtCurrency(rrTotals.other)}</td>
                <td className="px-[14px] h-[42px] text-center text-[10px] text-muted-foreground">{rrTotals.vacant}</td>
                <td className="px-[14px] h-[42px]" />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-[22px] py-3.5">
          <button
            onClick={addRentRollUnit}
            className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Add Unit
          </button>
        </div>
      </UWCard>

      {/* Ancillary Income */}
      <UWCard title="Ancillary Income">
        {state.ancillaryIncome.map((r, i) => (
          <div key={r.id} className="flex gap-3.5 items-end mb-2.5">
            <div className="flex-none w-[180px]">
              {i === 0 && <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">Source</div>}
              <input
                defaultValue={r.source}
                onBlur={(e) => updateAncillaryItem(r.id, "source", e.target.value)}
                className="w-full rounded-lg border border-border bg-accent/50 text-foreground px-3 py-2 text-[13px] outline-none"
              />
            </div>
            <div className="flex-1">
              {i === 0 && <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">Current Annual</div>}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] pointer-events-none">$</span>
                <input
                  defaultValue={new Intl.NumberFormat("en-US").format(r.currentAnnual)}
                  onBlur={(e) => updateAncillaryItem(r.id, "currentAnnual", parseFloat(e.target.value.replace(/,/g, "")) || 0)}
                  className="w-full rounded-lg border border-border bg-accent/50 text-foreground pl-7 pr-3 py-2 text-[13px] tabular-nums outline-none"
                />
              </div>
            </div>
            <div className="flex-1">
              {i === 0 && <div className="text-[11px] font-medium text-muted-foreground mb-[5px]">Stabilized Annual</div>}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] pointer-events-none">$</span>
                <input
                  defaultValue={new Intl.NumberFormat("en-US").format(r.stabilizedAnnual)}
                  onBlur={(e) => updateAncillaryItem(r.id, "stabilizedAnnual", parseFloat(e.target.value.replace(/,/g, "")) || 0)}
                  className="w-full rounded-lg border border-border bg-accent/50 text-foreground pl-7 pr-3 py-2 text-[13px] tabular-nums outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => removeAncillaryItem(r.id)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        ))}
        <div className="mt-3.5">
          <button
            onClick={addAncillaryItem}
            className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg border text-[11px] font-medium cursor-pointer bg-transparent text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            Add Income Source
          </button>
        </div>
      </UWCard>
    </div>
  );
}
