"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
            router.push(`/servicing/${row.loan_id}`)
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
    { key: "loan_id", header: "Loan ID", cell: (r) => <span className="num font-medium text-blue-700 dark:text-blue-400">{r.loan_id}</span> },
    { key: "borrower_name", header: "Borrower", cell: (r) => r.borrower_name ?? "—" },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span>, className: "max-w-[200px] truncate" },
    { key: "loan_type", header: "Type", cell: (r) => r.loan_type ?? "—" },
    { key: "dutch_interest", header: "Dutch", cell: (r) => <StatusBadge status={r.dutch_interest ? "Dutch" : "Non Dutch"} /> },
    { key: "current_balance", header: "Balance", cell: (r) => <span className="num">{formatCurrency(r.current_balance)}</span> },
    { key: "interest_rate", header: "Rate", cell: (r) => <span className="num">{r.interest_rate != null ? formatPercent(r.interest_rate * 100) : "—"}</span> },
    { key: "maturity_date", header: "Maturity", cell: (r) => <span className="num">{formatDate(r.maturity_date)}</span> },
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
    { key: "loan_id", header: "Loan", cell: (r) => <span className="num font-medium">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span>, className: "max-w-[180px] truncate" },
    { key: "dutch", header: "Type", cell: (r) => <StatusBadge status={r.dutch} /> },
    { key: "rate", header: "Rate", cell: (r) => <span className="num">{r.rate != null ? formatPercent(r.rate * 100) : "—"}</span> },
    { key: "start_balance", header: "Start Bal", cell: (r) => <span className="num">{formatCurrency(r.start_balance)}</span> },
    { key: "mid_month_draw", header: "Mid-Mo Draw", cell: (r) => <span className="num">{r.mid_month_draw > 0 ? formatCurrency(r.mid_month_draw) : "—"}</span> },
    { key: "total_days", header: "Days", cell: (r) => <span className="num">{r.total_days}</span> },
    { key: "interest_due", header: "Interest Due", cell: (r) => <span className="font-medium num">{formatCurrencyDetailed(r.interest_due)}</span> },
    { key: "audit_trail", header: "Audit", cell: (r) => <span className="text-[11px] num text-muted-foreground">{r.audit_trail}</span> },
    { key: "check_status", header: "Check", cell: (r) => <span className={r.check_status?.includes("PASS") ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>{r.check_status}</span> },
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
              <DatePicker
                value={periodStart}
                onChange={(value) => setPeriodStart(value)}
                className="w-48"
              />
            </div>
            <Button onClick={runCalculation} disabled={loading} className="gap-2">
              <Play className="h-4 w-4" />
              {loading ? "Calculating..." : "Calculate Interest"}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <span className="text-sm font-medium text-green-800 dark:text-green-300">
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
    { key: "loan_id", header: "Loan", cell: (r) => <span className="num">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span>, className: "max-w-[200px] truncate" },
    { key: "line_item", header: "Description", cell: (r) => r.line_item },
    { key: "amount", header: "Amount", cell: (r) => <span className="num">{formatCurrency(r.amount)}</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "request_date", header: "Requested", cell: (r) => <span className="num">{formatDate(r.request_date)}</span> },
    { key: "funded_date", header: "Funded", cell: (r) => <span className="num">{formatDate(r.funded_date)}</span> },
  ];

  return <DataTable columns={columns} data={draws} emptyMessage="No draw records." />;
}

// ── Payments Tab ───────────────────────────────────────────────────────

function PaymentsTab({ payments }: { payments: any[] }) {
  const columns: Column<any>[] = [
    { key: "date", header: "Date", cell: (r) => <span className="num">{formatDate(r.date)}</span> },
    { key: "loan_id", header: "Loan", cell: (r) => <span className="num">{r.loan_id}</span> },
    { key: "borrower", header: "Borrower", cell: (r) => r.borrower ?? "—" },
    { key: "type", header: "Type", cell: (r) => r.type },
    { key: "amount_due", header: "Due", cell: (r) => <span className="num">{formatCurrencyDetailed(r.amount_due)}</span> },
    { key: "amount_paid", header: "Paid", cell: (r) => <span className="num">{formatCurrencyDetailed(r.amount_paid)}</span> },
    { key: "interest", header: "Interest", cell: (r) => <span className="num">{formatCurrencyDetailed(r.interest)}</span> },
    { key: "late_fee", header: "Late Fee", cell: (r) => <span className="num">{r.late_fee > 0 ? formatCurrencyDetailed(r.late_fee) : "—"}</span> },
    { key: "payment_method", header: "Method", cell: (r) => r.payment_method ?? "—" },
    { key: "entry_type", header: "Entry", cell: (r) => <StatusBadge status={r.entry_type} /> },
  ];

  return <DataTable columns={columns} data={payments} emptyMessage="No payment records." />;
}

// ── Maturities Tab ─────────────────────────────────────────────────────

function MaturitiesTab({ maturities }: { maturities: any[] }) {
  const columns: Column<any>[] = [
    { key: "loan_id", header: "Loan", cell: (r) => <span className="num font-medium">{r.loan_id}</span> },
    { key: "borrower_name", header: "Borrower", cell: (r) => r.borrower_name ?? "—" },
    { key: "property_address", header: "Property", cell: (r) => <span className="text-xs">{r.property_address ?? "—"}</span>, className: "max-w-[250px] truncate" },
    { key: "maturity_date", header: "Maturity", cell: (r) => <span className="num">{formatDate(r.maturity_date)}</span> },
    { key: "days_until_maturity", header: "Days Left", cell: (r) => <span className={`num ${r.days_until_maturity < 0 ? "text-destructive font-medium" : r.days_until_maturity < 30 ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>{r.days_until_maturity}</span> },
    { key: "current_balance", header: "Balance", cell: (r) => <span className="num">{formatCurrency(r.current_balance)}</span> },
    { key: "maturity_status", header: "Status", cell: (r) => {
      const styles: Record<string, string> = {
        MATURED: "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300",
        MATURING_30: "bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300",
        MATURING_60: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300",
        MATURING_90: "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300",
        OK: "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300",
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
    { key: "loan_id", header: "Loan", cell: (r) => <span className="num">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span> },
    { key: "loan_funds_released", header: "Funds Released", cell: (r) => <span className="num">{formatCurrency(r.loan_funds_released)}</span> },
    { key: "total_funded_draws", header: "Total Draws", cell: (r) => <span className="num">{formatCurrency(r.total_funded_draws)}</span> },
    { key: "discrepancy", header: "Discrepancy", cell: (r) => r.discrepancy !== 0 ? <span className="text-destructive font-medium num">{formatCurrency(r.discrepancy)}</span> : "—" },
    { key: "status", header: "Status", cell: (r) => <span className={r.status?.includes("BALANCED") ? "text-green-600 dark:text-green-400 font-medium text-xs" : "text-destructive font-medium text-xs"}>{r.status}</span> },
  ];

  const interestColumns: Column<any>[] = [
    { key: "loan_id", header: "Loan", cell: (r) => <span className="num">{r.loan_id}</span> },
    { key: "entity_name", header: "Entity", cell: (r) => <span className="text-xs">{r.entity_name ?? "—"}</span> },
    { key: "calculated_interest", header: "Calculated", cell: (r) => <span className="num">{formatCurrencyDetailed(r.calculated_interest)}</span> },
    { key: "payment_interest", header: "Payment", cell: (r) => <span className="num">{formatCurrencyDetailed(r.payment_interest)}</span> },
    { key: "difference", header: "Diff", cell: (r) => <span className="num">{r.difference !== 0 ? formatCurrencyDetailed(r.difference) : "—"}</span> },
    { key: "status", header: "Status", cell: (r) => <span className={r.status?.includes("MATCHED") ? "text-green-600 dark:text-green-400 font-medium text-xs" : r.status?.includes("NO PAYMENT") ? "text-amber-600 dark:text-amber-400 text-xs" : "text-destructive font-medium text-xs"}>{r.status}</span> },
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
              <DatePicker
                value={periodStart}
                onChange={(value) => setPeriodStart(value)}
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
