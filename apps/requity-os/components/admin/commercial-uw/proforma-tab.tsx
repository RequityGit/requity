"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { ProFormaYear, POHAnalysis } from "@/lib/commercial-uw/types";

interface Props {
  proforma: ProFormaYear[];
  propertyType: string;
  totalUnits: number;
  pohAnalysis: POHAnalysis | null;
  pohRentalIncome: number;
  setPohRentalIncome: (v: number) => void;
  pohExpenseRatio: number;
  setPohExpenseRatio: (v: number) => void;
}

type ViewMode = "dollars" | "pct_egi" | "per_unit";

const YEAR_LABELS: Record<number, string> = {
  0: "T-12",
  1: "Year 1",
  2: "Year 2",
  3: "Year 3",
  4: "Year 4",
  5: "Year 5",
  6: "Stabilized",
};

function dscrColor(dscr: number): string {
  if (dscr === 0) return "";
  if (dscr < 1.25) return "text-red-600 font-bold";
  if (dscr < 1.5) return "text-amber-600 font-medium";
  return "text-green-600 font-medium";
}

export function ProFormaTab({
  proforma,
  propertyType,
  totalUnits,
  pohAnalysis,
  pohRentalIncome,
  setPohRentalIncome,
  pohExpenseRatio,
  setPohExpenseRatio,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("dollars");

  const formatValue = (value: number, egi: number, year: ProFormaYear) => {
    if (viewMode === "pct_egi") {
      return egi > 0 ? `${((value / egi) * 100).toFixed(1)}%` : "—";
    }
    if (viewMode === "per_unit") {
      return totalUnits > 0
        ? `$${Math.round(value / totalUnits).toLocaleString()}`
        : "—";
    }
    return formatCurrency(value);
  };

  const rows: {
    label: string;
    key: keyof ProFormaYear;
    bold?: boolean;
    indent?: boolean;
    separator?: boolean;
  }[] = [
    { label: "Gross Potential Income", key: "gpi", bold: true },
    { label: "Less: Vacancy", key: "vacancy", indent: true },
    { label: "Less: Bad Debt", key: "bad_debt", indent: true },
    { label: "Effective Gross Income", key: "egi", bold: true, separator: true },
    { label: "Management Fee", key: "mgmt_fee", indent: true },
    { label: "Real Estate Taxes", key: "taxes", indent: true },
    { label: "Insurance", key: "insurance", indent: true },
    { label: "Utilities", key: "utilities", indent: true },
    { label: "Repairs & Maintenance", key: "repairs", indent: true },
    { label: "Contract Services", key: "contract_services", indent: true },
    { label: "Payroll", key: "payroll", indent: true },
    { label: "Marketing", key: "marketing", indent: true },
    { label: "General & Admin", key: "ga", indent: true },
    { label: "Replacement Reserve", key: "replacement_reserve", indent: true },
    { label: "Total Operating Expenses", key: "total_opex", bold: true, separator: true },
    { label: "Net Operating Income", key: "noi", bold: true },
    { label: "Debt Service", key: "debt_service", indent: true },
    { label: "Net Cash Flow", key: "net_cash_flow", bold: true, separator: true },
  ];

  const metricRows = [
    { label: "DSCR", key: "dscr" as const },
    { label: "Cap Rate", key: "cap_rate" as const },
    { label: "Expense Ratio", key: "expense_ratio" as const },
  ];

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={viewMode === "dollars" ? "default" : "outline"}
          onClick={() => setViewMode("dollars")}
        >
          $
        </Button>
        <Button
          size="sm"
          variant={viewMode === "pct_egi" ? "default" : "outline"}
          onClick={() => setViewMode("pct_egi")}
        >
          % of EGI
        </Button>
        <Button
          size="sm"
          variant={viewMode === "per_unit" ? "default" : "outline"}
          onClick={() => setViewMode("per_unit")}
        >
          $/Unit
        </Button>
      </div>

      {/* Pro Forma Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">5-Year Pro Forma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium w-48">Line Item</th>
                  {proforma.map((p) => (
                    <th key={p.year} className="text-right p-2 font-medium min-w-[100px]">
                      {YEAR_LABELS[p.year] ?? `Year ${p.year}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className={`border-b ${row.bold ? "font-semibold" : ""} ${
                      row.separator ? "border-t-2" : ""
                    }`}
                  >
                    <td className={`p-2 ${row.indent ? "pl-6" : ""}`}>
                      {row.label}
                    </td>
                    {proforma.map((p) => (
                      <td key={p.year} className="p-2 text-right num">
                        {formatValue(
                          p[row.key] as number,
                          p.egi,
                          p
                        )}
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Metrics */}
                <tr className="border-t-2 bg-slate-50">
                  <td className="p-2 font-semibold" colSpan={proforma.length + 1}>
                    Key Metrics
                  </td>
                </tr>
                {metricRows.map((mr) => (
                  <tr key={mr.key} className="border-b">
                    <td className="p-2 font-medium">{mr.label}</td>
                    {proforma.map((p) => {
                      const val = p[mr.key] as number;
                      return (
                        <td
                          key={p.year}
                          className={`p-2 text-right num ${
                            mr.key === "dscr" ? dscrColor(val) : ""
                          }`}
                        >
                          {val > 0 ? `${val.toFixed(2)}${mr.key !== "dscr" ? "%" : "x"}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* NOI Chart - Simple bar representation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">NOI Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {proforma.map((p) => {
              const maxNOI = Math.max(...proforma.map((x) => x.noi), 1);
              const height = Math.max((p.noi / maxNOI) * 100, 2);
              return (
                <div key={p.year} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] num">
                    {formatCurrency(p.noi)}
                  </span>
                  <div
                    className={`w-full rounded-t ${
                      p.year === 6 ? "bg-purple-500" : "bg-blue-500"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {YEAR_LABELS[p.year]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* MHP POH Section */}
      {propertyType === "mobile_home_park" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              MHP Park-Owned Homes (POH) Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="text-xs">POH Rental Income (Annual)</Label>
                <Input
                  type="number"
                  value={pohRentalIncome || ""}
                  onChange={(e) => setPohRentalIncome(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">POH Expense Ratio %</Label>
                <Input
                  type="number"
                  value={pohExpenseRatio || ""}
                  onChange={(e) => setPohExpenseRatio(Number(e.target.value) || 50)}
                  className="mt-1"
                />
              </div>
            </div>

            {pohAnalysis && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">POH NOI</p>
                  <p className="text-sm font-bold">{formatCurrency(pohAnalysis.poh_noi)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Lot Rent NOI</p>
                  <p className="text-sm font-bold">{formatCurrency(pohAnalysis.lot_rent_noi)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total NOI</p>
                  <p className="text-sm font-bold">{formatCurrency(pohAnalysis.total_noi)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Lot-Only DSCR</p>
                  <p className={`text-sm font-bold ${dscrColor(pohAnalysis.lot_only_dscr)}`}>
                    {pohAnalysis.lot_only_dscr > 0 ? `${pohAnalysis.lot_only_dscr.toFixed(2)}x` : "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total DSCR</p>
                  <p className={`text-sm font-bold ${dscrColor(pohAnalysis.total_dscr)}`}>
                    {pohAnalysis.total_dscr > 0 ? `${pohAnalysis.total_dscr.toFixed(2)}x` : "—"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
