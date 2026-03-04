"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import {
  FileSpreadsheet,
  Calculator,
  Hammer,
  CreditCard,
  ShieldCheck,
  CalendarClock,
  Play,
  RefreshCw,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ServicingTabsProps {
  loans: any[];
  draws: any[];
  payments: any[];
  maturities: any[];
  portfolio: any;
}

export function ServicingTabs({
  loans,
  draws,
  payments,
  maturities,
  portfolio,
}: ServicingTabsProps) {
  const router = useRouter();

  return (
    <Tabs defaultValue="loan-tape">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="loan-tape" className="gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Loan Tape
          <span className="ml-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5">
            {loans.filter((l: any) => l.loan_status === "Active").length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="interest" className="gap-1.5">
          <Calculator className="h-3.5 w-3.5" />
          Interest Calculator
        </TabsTrigger>
        <TabsTrigger value="draws" className="gap-1.5">
          <Hammer className="h-3.5 w-3.5" />
          Draws
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          Payments
        </TabsTrigger>
        <TabsTrigger value="maturities" className="gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          Maturities
        </TabsTrigger>
        <TabsTrigger value="reconciliation" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Reconciliation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="loan-tape" className="mt-4">
        <LoanTapeTab
          loans={loans}
          onRowClick={(row: any) =>
            router.push(`/admin/servicing/${row.loan_id}`)
          }
        />
      </TabsContent>

      <TabsContent value="interest" className="mt-4">
        <InterestCalculatorTab />
      </TabsContent>

      <TabsContent value="draws" className="mt-4">
        <DrawsTab draws={draws} />
      </TabsContent>

      <TabsContent value="payments" className="mt-4">
        <PaymentsTab payments={payments} />
      </TabsContent>

      <TabsContent value="maturities" className="mt-4">
        <MaturitiesTab maturities={maturities} />
      </TabsContent>

      <TabsContent value="reconciliation" className="mt-4">
        <ReconciliationTab />
      </TabsContent>
    </Tabs>
  );
}

// ── Loan Tape Tab ──────────────────────────────────────────────────────

function LoanTapeTab({
  loans,
  onRowClick,
}: {
  loans: any[];
  onRowClick: (row: any) => void;
}) {
  const [filter, setFilter] = useState("Active");

  const filtered =
    filter === "All"
      ? loans
      : loans.filter((l: any) => l.loan_status === filter);

  const columns: Column<any>[] = [
    { key: "loan_id", header: "Loan ID", cell: (r) => <span className="font-mono font-medium text-blue-700">{r.loan_id}</span> },
    { key: "borrower_name", header: "Borrower", cell: (r) => r.borrower_name ?? "—" },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span>, className: "max-w-[200px] truncate" },
    { key: "loan_type", header: "Type", cell: (r) => r.loan_type ?? "—" },
    { key: "dutch_interest", header: "Dutch", cell: (r) => <StatusBadge status={r.dutch_interest ? "Dutch" : "Non Dutch"} /> },
    { key: "current_balance", header: "Balance", cell: (r) => formatCurrency(r.current_balance) },
    { key: "interest_rate", header: "Rate", cell: (r) => r.interest_rate != null ? formatPercent(r.interest_rate * 100) : "—" },
    { key: "maturity_date", header: "Maturity", cell: (r) => formatDate(r.maturity_date) },
    { key: "loan_status", header: "Status", cell: (r) => <StatusBadge status={r.loan_status} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["Active", "Paid Off", "Sold", "All"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>
      <DataTable columns={columns} data={filtered} onRowClick={onRowClick} emptyMessage="No loans found." />
    </div>
  );
}

// ── Interest Calculator Tab ────────────────────────────────────────────

function InterestCalculatorTab() {
  const [periodStart, setPeriodStart] = useState("2026-01-01");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalInterest, setTotalInterest] = useState(0);

  async function runCalculation() {
    setLoading(true);
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase.rpc("calculate_monthly_interest", {
        period_start: periodStart,
      });
      if (error) throw error;
      setResults(data ?? []);
      setTotalInterest(
        (data ?? []).reduce((sum: number, r: any) => sum + (r.interest_due ?? 0), 0)
      );
    } catch (err: any) {
      console.error("Interest calculation error:", err);
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<any>[] = [
    { key: "loan_id", header: "Loan", cell: (r) => <span className="font-mono font-medium">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span>, className: "max-w-[180px] truncate" },
    { key: "dutch", header: "Type", cell: (r) => <StatusBadge status={r.dutch} /> },
    { key: "rate", header: "Rate", cell: (r) => r.rate != null ? formatPercent(r.rate * 100) : "—" },
    { key: "start_balance", header: "Start Bal", cell: (r) => formatCurrency(r.start_balance) },
    { key: "mid_month_draw", header: "Mid-Mo Draw", cell: (r) => r.mid_month_draw > 0 ? formatCurrency(r.mid_month_draw) : "—" },
    { key: "total_days", header: "Days", cell: (r) => r.total_days },
    { key: "interest_due", header: "Interest Due", cell: (r) => <span className="font-medium">{formatCurrencyDetailed(r.interest_due)}</span> },
    { key: "audit_trail", header: "Audit", cell: (r) => <span className="text-[11px] font-mono text-muted-foreground">{r.audit_trail}</span> },
    { key: "check_status", header: "Check", cell: (r) => <span className={r.check_status?.includes("PASS") ? "text-green-600 font-medium" : "text-muted-foreground"}>{r.check_status}</span> },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Interest Calculator (30/360)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Billing Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={runCalculation} disabled={loading} className="gap-2">
              <Play className="h-4 w-4" />
              {loading ? "Calculating..." : "Calculate Interest"}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-sm font-medium text-green-800">
                Total Monthly Collection: {formatCurrencyDetailed(totalInterest)} across{" "}
                {results.filter((r: any) => r.interest_due > 0).length} billing loans
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      {results.length > 0 && (
        <DataTable columns={columns} data={results} emptyMessage="No results." />
      )}
    </div>
  );
}

// ── Draws Tab ──────────────────────────────────────────────────────────

function DrawsTab({ draws }: { draws: any[] }) {
  const columns: Column<any>[] = [
    { key: "draw_number", header: "#", cell: (r) => r.draw_number },
    { key: "loan_id", header: "Loan", cell: (r) => <span className="font-mono">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span>, className: "max-w-[200px] truncate" },
    { key: "line_item", header: "Description", cell: (r) => r.line_item },
    { key: "amount", header: "Amount", cell: (r) => formatCurrency(r.amount) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "request_date", header: "Requested", cell: (r) => formatDate(r.request_date) },
    { key: "funded_date", header: "Funded", cell: (r) => formatDate(r.funded_date) },
  ];

  return <DataTable columns={columns} data={draws} emptyMessage="No draw records." />;
}

// ── Payments Tab ───────────────────────────────────────────────────────

function PaymentsTab({ payments }: { payments: any[] }) {
  const columns: Column<any>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.date) },
    { key: "loan_id", header: "Loan", cell: (r) => <span className="font-mono">{r.loan_id}</span> },
    { key: "borrower", header: "Borrower", cell: (r) => r.borrower ?? "—" },
    { key: "type", header: "Type", cell: (r) => r.type },
    { key: "amount_due", header: "Due", cell: (r) => formatCurrencyDetailed(r.amount_due) },
    { key: "amount_paid", header: "Paid", cell: (r) => formatCurrencyDetailed(r.amount_paid) },
    { key: "interest", header: "Interest", cell: (r) => formatCurrencyDetailed(r.interest) },
    { key: "late_fee", header: "Late Fee", cell: (r) => r.late_fee > 0 ? formatCurrencyDetailed(r.late_fee) : "—" },
    { key: "payment_method", header: "Method", cell: (r) => r.payment_method ?? "—" },
    { key: "entry_type", header: "Entry", cell: (r) => <StatusBadge status={r.entry_type} /> },
  ];

  return <DataTable columns={columns} data={payments} emptyMessage="No payment records." />;
}

// ── Maturities Tab ─────────────────────────────────────────────────────

function MaturitiesTab({ maturities }: { maturities: any[] }) {
  const columns: Column<any>[] = [
    { key: "loan_id", header: "Loan", cell: (r) => <span className="font-mono font-medium">{r.loan_id}</span> },
    { key: "borrower_name", header: "Borrower", cell: (r) => r.borrower_name ?? "—" },
    { key: "property_address", header: "Property", cell: (r) => <span className="text-xs">{r.property_address ?? "—"}</span>, className: "max-w-[250px] truncate" },
    { key: "maturity_date", header: "Maturity", cell: (r) => formatDate(r.maturity_date) },
    { key: "days_until_maturity", header: "Days Left", cell: (r) => <span className={r.days_until_maturity < 0 ? "text-red-600 font-medium" : r.days_until_maturity < 30 ? "text-amber-600 font-medium" : ""}>{r.days_until_maturity}</span> },
    { key: "current_balance", header: "Balance", cell: (r) => formatCurrency(r.current_balance) },
    { key: "maturity_status", header: "Status", cell: (r) => {
      const styles: Record<string, string> = {
        MATURED: "bg-red-100 text-red-800",
        MATURING_30: "bg-orange-100 text-orange-800",
        MATURING_60: "bg-yellow-100 text-yellow-800",
        MATURING_90: "bg-blue-100 text-blue-800",
        OK: "bg-green-100 text-green-800",
      };
      return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[r.maturity_status] || ""}`}>{r.maturity_status?.replace(/_/g, " ")}</span>;
    }},
  ];

  return <DataTable columns={columns} data={maturities} emptyMessage="No maturity data." />;
}

// ── Reconciliation Tab ─────────────────────────────────────────────────

function ReconciliationTab() {
  const [drawResults, setDrawResults] = useState<any[]>([]);
  const [interestResults, setInterestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState("2026-01-01");

  async function runDrawReconciliation() {
    setLoading("draws");
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase.rpc("reconcile_draw_balances");
      if (error) throw error;
      setDrawResults(data ?? []);
    } catch (err: any) {
      console.error("Draw reconciliation error:", err);
    } finally {
      setLoading(null);
    }
  }

  async function runInterestReconciliation() {
    setLoading("interest");
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase.rpc(
        "reconcile_interest_vs_payments",
        { p_period_start: periodStart }
      );
      if (error) throw error;
      setInterestResults(data ?? []);
    } catch (err: any) {
      console.error("Interest reconciliation error:", err);
    } finally {
      setLoading(null);
    }
  }

  const drawColumns: Column<any>[] = [
    { key: "loan_id", header: "Loan", cell: (r) => <span className="font-mono">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span> },
    { key: "loan_funds_released", header: "Funds Released", cell: (r) => formatCurrency(r.loan_funds_released) },
    { key: "total_funded_draws", header: "Total Draws", cell: (r) => formatCurrency(r.total_funded_draws) },
    { key: "discrepancy", header: "Discrepancy", cell: (r) => r.discrepancy !== 0 ? <span className="text-red-600 font-medium">{formatCurrency(r.discrepancy)}</span> : "—" },
    { key: "status", header: "Status", cell: (r) => <span className={r.status?.includes("BALANCED") ? "text-green-600 font-medium text-xs" : "text-red-600 font-medium text-xs"}>{r.status}</span> },
  ];

  const interestColumns: Column<any>[] = [
    { key: "loan_id", header: "Loan", cell: (r) => <span className="font-mono">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span> },
    { key: "calculated_interest", header: "Calculated", cell: (r) => formatCurrencyDetailed(r.calculated_interest) },
    { key: "payment_interest", header: "Payment", cell: (r) => formatCurrencyDetailed(r.payment_interest) },
    { key: "difference", header: "Diff", cell: (r) => r.difference !== 0 ? formatCurrencyDetailed(r.difference) : "—" },
    { key: "status", header: "Status", cell: (r) => <span className={r.status?.includes("MATCHED") ? "text-green-600 font-medium text-xs" : r.status?.includes("NO PAYMENT") ? "text-amber-600 text-xs" : "text-red-600 font-medium text-xs"}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Draw Balance Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runDrawReconciliation}
            disabled={loading === "draws"}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading === "draws" ? "animate-spin" : ""}`} />
            {loading === "draws" ? "Running..." : "Run Draw Check"}
          </Button>
          {drawResults.length > 0 && (
            <DataTable columns={drawColumns} data={drawResults} emptyMessage="No results." />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interest vs. Payment Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-48"
              />
            </div>
            <Button
              onClick={runInterestReconciliation}
              disabled={loading === "interest"}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading === "interest" ? "animate-spin" : ""}`} />
              {loading === "interest" ? "Running..." : "Run Interest Check"}
            </Button>
          </div>
          {interestResults.length > 0 && (
            <DataTable columns={interestColumns} data={interestResults} emptyMessage="No results." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
