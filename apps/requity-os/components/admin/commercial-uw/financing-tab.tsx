"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { calcMonthlyPayment } from "@/lib/commercial-uw/calculator";
import type { FinancingTerms, ExitAnalysis } from "@/lib/commercial-uw/types";

interface Props {
  financing: FinancingTerms;
  setFinancing: (v: FinancingTerms) => void;
  purchasePrice: number;
  setPurchasePrice: (v: number) => void;
  goingInCapRate: number;
  setGoingInCapRate: (v: number) => void;
  exitCapRate: number;
  setExitCapRate: (v: number) => void;
  dispositionCostPct: number;
  setDispositionCostPct: (v: number) => void;
  equityInvested: number;
  setEquityInvested: (v: number) => void;
  exitAnalysis: ExitAnalysis;
  valuationTable: { capRate: number; value: number }[];
  sensitivityMatrix: { rate: number; noiAdj: number; dscr: number }[];
  yr1NOI: number;
  yr1DSCR: number;
  computedGoingInCap: number;
  loanAmount: number;
}

function dscrColor(dscr: number): string {
  if (dscr === 0) return "";
  if (dscr < 1.25) return "bg-red-100 text-red-800";
  if (dscr < 1.5) return "bg-amber-100 text-amber-800";
  return "bg-green-100 text-green-800";
}

function dscrCellColor(dscr: number): string {
  if (dscr === 0) return "";
  if (dscr < 1.25) return "bg-red-50 text-red-700";
  if (dscr < 1.5) return "bg-amber-50 text-amber-700";
  return "bg-green-50 text-green-700";
}

export function FinancingTab({
  financing,
  setFinancing,
  purchasePrice,
  setPurchasePrice,
  goingInCapRate,
  setGoingInCapRate,
  exitCapRate,
  setExitCapRate,
  dispositionCostPct,
  setDispositionCostPct,
  equityInvested,
  setEquityInvested,
  exitAnalysis,
  valuationTable,
  sensitivityMatrix,
  yr1NOI,
  yr1DSCR,
  computedGoingInCap,
  loanAmount,
}: Props) {
  const updateFinancing = (field: keyof FinancingTerms, value: number) => {
    setFinancing({ ...financing, [field]: value });
  };

  const bridgeIOPayment =
    financing.bridge_loan_amount * (financing.bridge_rate / 100 / 12);
  const bridgeAmortPayment = calcMonthlyPayment(
    financing.bridge_loan_amount,
    financing.bridge_rate,
    financing.bridge_amortization_months
  );
  const exitMonthlyPayment = calcMonthlyPayment(
    financing.exit_loan_amount,
    financing.exit_rate,
    financing.exit_amortization_years * 12
  );

  const ltv =
    purchasePrice > 0 ? (financing.bridge_loan_amount / purchasePrice) * 100 : 0;

  // Sensitivity matrix: 5x5 grid
  const rateOffsets = [-1, -0.5, 0, 0.5, 1];
  const noiOffsets = [-10, -5, 0, 5, 10];

  return (
    <div className="space-y-4">
      {/* Key Metrics Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "LTV", value: ltv > 0 ? `${ltv.toFixed(1)}%` : "—" },
          {
            label: "DSCR (Yr1)",
            value: yr1DSCR > 0 ? `${yr1DSCR.toFixed(2)}x` : "—",
            color: yr1DSCR > 0 ? dscrColor(yr1DSCR) : "",
          },
          {
            label: "Going-In Cap",
            value: computedGoingInCap > 0 ? `${computedGoingInCap.toFixed(2)}%` : "—",
          },
          {
            label: "Levered IRR",
            value:
              exitAnalysis.levered_irr !== 0
                ? `${exitAnalysis.levered_irr.toFixed(1)}%`
                : "—",
          },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-lg border p-4 text-center ${m.color ?? ""}`}
          >
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-xl font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Split: Bridge / Exit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bridge */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Requity Bridge Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Loan Amount</Label>
                <Input
                  type="number"
                  value={financing.bridge_loan_amount || ""}
                  onChange={(e) =>
                    updateFinancing("bridge_loan_amount", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Term (months)</Label>
                <Input
                  type="number"
                  value={financing.bridge_term_months || ""}
                  onChange={(e) =>
                    updateFinancing("bridge_term_months", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Rate %</Label>
                <Input
                  type="number"
                  step="0.125"
                  value={financing.bridge_rate || ""}
                  onChange={(e) =>
                    updateFinancing("bridge_rate", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Amortization (months)</Label>
                <Input
                  type="number"
                  value={financing.bridge_amortization_months || ""}
                  onChange={(e) =>
                    updateFinancing(
                      "bridge_amortization_months",
                      Number(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">IO Period (months)</Label>
                <Input
                  type="number"
                  value={financing.bridge_io_months || ""}
                  onChange={(e) =>
                    updateFinancing("bridge_io_months", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Origination Points</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={financing.bridge_origination_pts || ""}
                  onChange={(e) =>
                    updateFinancing(
                      "bridge_origination_pts",
                      Number(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>IO Monthly Payment:</span>
                <span className="num font-medium">
                  {formatCurrency(bridgeIOPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amortizing Monthly Payment:</span>
                <span className="num font-medium">
                  {formatCurrency(bridgeAmortPayment)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Exit / Perm Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Loan Amount</Label>
                <Input
                  type="number"
                  value={financing.exit_loan_amount || ""}
                  onChange={(e) =>
                    updateFinancing("exit_loan_amount", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Rate %</Label>
                <Input
                  type="number"
                  step="0.125"
                  value={financing.exit_rate || ""}
                  onChange={(e) =>
                    updateFinancing("exit_rate", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Amortization (years)</Label>
                <Input
                  type="number"
                  value={financing.exit_amortization_years || ""}
                  onChange={(e) =>
                    updateFinancing(
                      "exit_amortization_years",
                      Number(e.target.value) || 0
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">IO Period (months)</Label>
                <Input
                  type="number"
                  value={financing.exit_io_months || ""}
                  onChange={(e) =>
                    updateFinancing("exit_io_months", Number(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Monthly Payment:</span>
                <span className="num font-medium">
                  {formatCurrency(exitMonthlyPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Annual Debt Service:</span>
                <span className="num font-medium">
                  {formatCurrency(exitMonthlyPayment * 12)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valuation / Purchase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Purchase & Valuation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Purchase Price</Label>
                <Input
                  type="number"
                  value={purchasePrice || ""}
                  onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Going-In Cap Rate %</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={goingInCapRate || ""}
                  onChange={(e) => setGoingInCapRate(Number(e.target.value) || 0)}
                  placeholder={computedGoingInCap > 0 ? `${computedGoingInCap.toFixed(2)} (computed)` : ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Equity Invested</Label>
                <Input
                  type="number"
                  value={equityInvested || ""}
                  onChange={(e) => setEquityInvested(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Exit Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Exit Cap Rate %</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={exitCapRate || ""}
                  onChange={(e) => setExitCapRate(Number(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Disposition Cost %</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={dispositionCostPct || ""}
                  onChange={(e) => setDispositionCostPct(Number(e.target.value) || 2)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Exit Value:</span>
                <span className="num font-medium">
                  {formatCurrency(exitAnalysis.exit_value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Disposition Costs:</span>
                <span className="num">
                  ({formatCurrency(exitAnalysis.disposition_costs)})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Exit Loan Balance:</span>
                <span className="num">
                  ({formatCurrency(exitAnalysis.exit_loan_balance)})
                </span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1 font-medium">
                <span>Net Proceeds:</span>
                <span className="num">{formatCurrency(exitAnalysis.net_proceeds)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm mt-2 border-t pt-1">
                <span>Levered IRR:</span>
                <span className="num text-green-700">
                  {exitAnalysis.levered_irr !== 0
                    ? `${exitAnalysis.levered_irr.toFixed(1)}%`
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Valuation Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cap Rate Valuation Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Cap Rate</th>
                  {valuationTable.map((v) => (
                    <th
                      key={v.capRate}
                      className={`text-right p-2 font-medium ${
                        Math.abs(v.capRate - (goingInCapRate || computedGoingInCap)) < 0.1
                          ? "bg-blue-100"
                          : ""
                      }`}
                    >
                      {v.capRate}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Value</td>
                  {valuationTable.map((v) => (
                    <td
                      key={v.capRate}
                      className={`p-2 text-right num ${
                        Math.abs(v.capRate - (goingInCapRate || computedGoingInCap)) < 0.1
                          ? "bg-blue-50 font-bold"
                          : ""
                      }`}
                    >
                      {formatCurrency(v.value)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">DSCR Sensitivity Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-2 font-medium">Rate \ NOI</th>
                  {noiOffsets.map((n) => (
                    <th key={n} className="text-center p-2 font-medium">
                      {n >= 0 ? `+${n}%` : `${n}%`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rateOffsets.map((rOff) => {
                  const baseRate = financing.bridge_rate || financing.exit_rate;
                  return (
                    <tr key={rOff} className="border-b">
                      <td className="p-2 font-medium num">
                        {(baseRate + rOff).toFixed(2)}%
                      </td>
                      {noiOffsets.map((nOff) => {
                        const entry = sensitivityMatrix.find(
                          (e) =>
                            Math.abs(e.rate - (baseRate + rOff)) < 0.01 &&
                            e.noiAdj === nOff
                        );
                        const dscr = entry?.dscr ?? 0;
                        return (
                          <td
                            key={nOff}
                            className={`p-2 text-center num ${
                              rOff === 0 && nOff === 0 ? "font-bold ring-2 ring-blue-400" : ""
                            } ${dscrCellColor(dscr)}`}
                          >
                            {dscr > 0 ? dscr.toFixed(2) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-50 border" /> DSCR &gt; 1.50
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-50 border" /> 1.25 - 1.50
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-50 border" /> &lt; 1.25
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
