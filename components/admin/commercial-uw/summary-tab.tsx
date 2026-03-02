"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";
import { COMMERCIAL_PROPERTY_TYPES } from "@/lib/commercial-uw/types";
import type {
  FinancingTerms,
  ProFormaYear,
  ExitAnalysis,
  UWStatus,
} from "@/lib/commercial-uw/types";

interface Props {
  loan: {
    loan_number: string | null;
    property_address: string | null;
    property_type: string | null;
    purchase_price: number | null;
    loan_amount: number | null;
  };
  propertyType: string;
  totalUnits: number;
  totalSf: number;
  purchasePrice: number;
  financing: FinancingTerms;
  proforma: ProFormaYear[];
  exitAnalysis: ExitAnalysis;
  yr1DSCR: number;
  computedGoingInCap: number;
  gpi: { current: number; stabilized: number };
  status: UWStatus;
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SummaryTab({
  loan,
  propertyType,
  totalUnits,
  totalSf,
  purchasePrice,
  financing,
  proforma,
  exitAnalysis,
  yr1DSCR,
  computedGoingInCap,
  gpi,
  status,
}: Props) {
  const yr1 = proforma.find((p) => p.year === 1);
  const yr5 = proforma.find((p) => p.year === 5);
  const stab = proforma.find((p) => p.year === 6);
  const ptLabel =
    COMMERCIAL_PROPERTY_TYPES.find((t) => t.value === propertyType)?.label ??
    propertyType;

  const ltv =
    purchasePrice > 0
      ? (financing.bridge_loan_amount / purchasePrice) * 100
      : 0;

  return (
    <div className="space-y-4">
      {/* Deal Summary */}
      <Card id="deal-summary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Deal Summary</CardTitle>
            <Badge
              className={
                status === "approved"
                  ? "bg-green-100 text-green-800"
                  : status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-slate-100 text-slate-800"
              }
            >
              {status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Property Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-xs text-muted-foreground">Loan Number</p>
              <p className="text-sm font-medium">{loan.loan_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Property Address</p>
              <p className="text-sm font-medium">{loan.property_address ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Property Type</p>
              <p className="text-sm font-medium">{ptLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Units / SF
              </p>
              <p className="text-sm font-medium">
                {totalUnits > 0 ? `${totalUnits} units` : ""}{" "}
                {totalSf > 0 ? `${totalSf.toLocaleString()} SF` : ""}
              </p>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard
              label="Purchase Price"
              value={formatCurrency(purchasePrice)}
            />
            <MetricCard
              label="Loan Amount"
              value={formatCurrency(financing.bridge_loan_amount)}
              sub={`LTV: ${ltv.toFixed(1)}%`}
            />
            <MetricCard
              label="Year 1 NOI"
              value={formatCurrency(yr1?.noi ?? 0)}
            />
            <MetricCard
              label="DSCR"
              value={yr1DSCR > 0 ? `${yr1DSCR.toFixed(2)}x` : "—"}
            />
            <MetricCard
              label="Going-In Cap"
              value={computedGoingInCap > 0 ? `${computedGoingInCap.toFixed(2)}%` : "—"}
            />
          </div>

          <Separator className="my-3" />

          {/* NOI Snapshot */}
          <h4 className="text-sm font-medium mb-2">NOI Projections</h4>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {proforma.map((p) => (
              <div key={p.year} className="text-center">
                <p className="text-[10px] text-muted-foreground">
                  {p.year === 0 ? "T-12" : p.year === 6 ? "Stab" : `Yr ${p.year}`}
                </p>
                <p className="text-xs font-mono font-medium">
                  {formatCurrency(p.noi)}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Financing */}
          <h4 className="text-sm font-medium mb-2">Financing</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Bridge Loan
              </p>
              <div className="text-xs space-y-0.5">
                <p>Amount: {formatCurrency(financing.bridge_loan_amount)}</p>
                <p>Rate: {financing.bridge_rate}% | Term: {financing.bridge_term_months}mo</p>
                <p>IO: {financing.bridge_io_months}mo | Points: {financing.bridge_origination_pts}</p>
              </div>
            </div>
            {financing.exit_loan_amount > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Exit / Perm Loan
                </p>
                <div className="text-xs space-y-0.5">
                  <p>Amount: {formatCurrency(financing.exit_loan_amount)}</p>
                  <p>Rate: {financing.exit_rate}% | Amort: {financing.exit_amortization_years}yr</p>
                </div>
              </div>
            )}
          </div>

          {exitAnalysis.levered_irr !== 0 && (
            <>
              <Separator className="my-3" />
              <h4 className="text-sm font-medium mb-2">Exit Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard label="Exit Value" value={formatCurrency(exitAnalysis.exit_value)} />
                <MetricCard label="Net Proceeds" value={formatCurrency(exitAnalysis.net_proceeds)} />
                <MetricCard label="Equity Invested" value={formatCurrency(exitAnalysis.equity_invested)} />
                <MetricCard label="Levered IRR" value={`${exitAnalysis.levered_irr.toFixed(1)}%`} />
              </div>
            </>
          )}

          <Separator className="my-3" />

          {/* GPI */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Current GPI"
              value={formatCurrency(gpi.current)}
            />
            <MetricCard
              label="Stabilized GPI"
              value={formatCurrency(gpi.stabilized)}
              sub={
                gpi.current > 0
                  ? `${(((gpi.stabilized - gpi.current) / gpi.current) * 100).toFixed(1)}% upside`
                  : ""
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
