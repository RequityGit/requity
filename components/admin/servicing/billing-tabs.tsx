"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
  formatPercent,
} from "@/lib/format";
import {
  Receipt,
  Play,
  RefreshCw,
  Download,
  CheckCircle,
  Send,
  AlertTriangle,
  FileText,
  DollarSign,
  Search,
} from "lucide-react";
import {
  generateBillingCycleAction,
  runReconciliationAction,
  approveBillingCycleAction,
  submitBillingCycleAction,
  completeBillingCycleAction,
  generateNachaAction,
  applyPaymentAction,
  generatePayoffQuoteAction,
  refreshDelinquencyAction,
  fetchBillingLineItemsAction,
} from "@/app/(authenticated)/admin/servicing/billing/actions";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BillingTabsProps {
  cycles: any[];
  delinquencyRecords: any[];
  activeLoans: any[];
}

export function BillingTabs({
  cycles,
  delinquencyRecords,
  activeLoans,
}: BillingTabsProps) {
  return (
    <Tabs defaultValue="cycles">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="cycles" className="gap-1.5">
          <Receipt className="h-3.5 w-3.5" />
          Billing Cycles
          <span className="ml-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5">
            {cycles.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="generate" className="gap-1.5">
          <Play className="h-3.5 w-3.5" />
          Generate Billing
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Apply Payment
        </TabsTrigger>
        <TabsTrigger value="payoff" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Payoff Quote
        </TabsTrigger>
        <TabsTrigger value="delinquency" className="gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Delinquency
          {delinquencyRecords.filter((d: any) => d.delinquency_status !== "current").length > 0 && (
            <span className="ml-1 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold px-1.5 py-0.5">
              {delinquencyRecords.filter((d: any) => d.delinquency_status !== "current").length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="cycles" className="mt-4">
        <BillingCyclesTab cycles={cycles} />
      </TabsContent>

      <TabsContent value="generate" className="mt-4">
        <GenerateBillingTab activeLoans={activeLoans} />
      </TabsContent>

      <TabsContent value="payments" className="mt-4">
        <ApplyPaymentTab activeLoans={activeLoans} />
      </TabsContent>

      <TabsContent value="payoff" className="mt-4">
        <PayoffQuoteTab activeLoans={activeLoans} />
      </TabsContent>

      <TabsContent value="delinquency" className="mt-4">
        <DelinquencyTab records={delinquencyRecords} />
      </TabsContent>
    </Tabs>
  );
}

// ── Billing Cycles Tab ───────────────────────────────────────────────

function BillingCyclesTab({ cycles }: { cycles: any[] }) {
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [reconResult, setReconResult] = useState<any>(null);
  const [nachaContent, setNachaContent] = useState<string | null>(null);

  async function loadLineItems(cycleId: string) {
    setLoading("items");
    const result = await fetchBillingLineItemsAction(cycleId);
    if (result.success) {
      setLineItems(result.items);
    }
    setLoading(null);
  }

  async function handleReconcile(cycleId: string) {
    setLoading("reconcile");
    const result = await runReconciliationAction(cycleId);
    if (result.success) {
      setReconResult(result.result);
    }
    setLoading(null);
  }

  async function handleApprove(cycleId: string) {
    setLoading("approve");
    const result = await approveBillingCycleAction(cycleId);
    if (result.success) {
      setReconResult(result.reconciliation);
      window.location.reload();
    } else {
      setReconResult(result.reconciliation);
      alert(result.error);
    }
    setLoading(null);
  }

  async function handleSubmit(cycleId: string) {
    setLoading("submit");
    const result = await submitBillingCycleAction(cycleId);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(null);
  }

  async function handleComplete(cycleId: string) {
    setLoading("complete");
    const result = await completeBillingCycleAction(cycleId);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
    setLoading(null);
  }

  async function handleGenerateNacha(cycleId: string) {
    setLoading("nacha");
    const result = await generateNachaAction(cycleId);
    if (result.success) {
      setNachaContent(result.nachaContent);
    } else {
      alert(result.error);
    }
    setLoading(null);
  }

  function downloadNacha(content: string, month: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nacha_${month.replace(/-/g, "")}.ach`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cycleColumns: Column<any>[] = [
    {
      key: "billing_month",
      header: "Month",
      cell: (r) => (
        <span className="font-mono font-medium">
          {new Date(r.billing_month + "T00:00:00").toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "loan_count",
      header: "Loans",
      cell: (r) => r.loan_count,
    },
    {
      key: "total_billed",
      header: "Total Billed",
      cell: (r) => (
        <span className="font-medium">
          {formatCurrencyDetailed(r.total_billed)}
        </span>
      ),
    },
    {
      key: "generated_at",
      header: "Generated",
      cell: (r) => formatDate(r.generated_at),
    },
    {
      key: "submitted_at",
      header: "Submitted",
      cell: (r) => (r.submitted_at ? formatDate(r.submitted_at) : "—"),
    },
  ];

  const lineItemColumns: Column<any>[] = [
    {
      key: "loan_id",
      header: "Loan",
      cell: (r) => <span className="font-mono font-medium">{r.loan_id}</span>,
    },
    {
      key: "interest_method",
      header: "Method",
      cell: (r) => (
        <StatusBadge
          status={r.interest_method === "dutch" ? "Dutch" : "Non Dutch"}
        />
      ),
    },
    {
      key: "funded_balance",
      header: "Funded Bal",
      cell: (r) => formatCurrency(r.funded_balance),
    },
    {
      key: "committed_balance",
      header: "Committed",
      cell: (r) => formatCurrency(r.committed_balance),
    },
    {
      key: "interest_rate",
      header: "Rate",
      cell: (r) =>
        r.interest_rate != null ? formatPercent(r.interest_rate * 100) : "—",
    },
    {
      key: "days_in_period",
      header: "Days",
      cell: (r) => r.days_in_period,
    },
    {
      key: "per_diem",
      header: "Per Diem",
      cell: (r) => `$${Number(r.per_diem).toFixed(4)}`,
    },
    {
      key: "total_interest_billed",
      header: "Interest",
      cell: (r) => (
        <span className="font-medium">
          {formatCurrencyDetailed(r.total_interest_billed)}
        </span>
      ),
    },
    {
      key: "late_fee",
      header: "Late Fee",
      cell: (r) =>
        r.late_fee > 0 ? formatCurrencyDetailed(r.late_fee) : "—",
    },
    {
      key: "total_amount_due",
      header: "Total Due",
      cell: (r) => (
        <span className="font-medium">
          {formatCurrencyDetailed(r.total_amount_due)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cycle List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Billing Cycles</CardTitle>
          <CardDescription>
            Click a row to view line items and take actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={cycleColumns}
            data={cycles}
            emptyMessage="No billing cycles generated yet."
            onRowClick={(row: any) => {
              setSelectedCycle(row);
              setLineItems([]);
              setReconResult(null);
              setNachaContent(null);
              loadLineItems(row.id);
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Cycle Detail */}
      {selectedCycle && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {new Date(
                    selectedCycle.billing_month + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}{" "}
                  Billing
                </CardTitle>
                <CardDescription>
                  {selectedCycle.loan_count} loans &middot;{" "}
                  {formatCurrencyDetailed(selectedCycle.total_billed)} total
                  &middot; Status: {selectedCycle.status}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedCycle.status === "draft" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleReconcile(selectedCycle.id)}
                      disabled={loading === "reconcile"}
                    >
                      <Search className="h-3.5 w-3.5" />
                      {loading === "reconcile"
                        ? "Running..."
                        : "Run Reconciliation"}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleApprove(selectedCycle.id)}
                      disabled={loading === "approve"}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      {loading === "approve" ? "Approving..." : "Approve"}
                    </Button>
                  </>
                )}
                {selectedCycle.status === "reconciled" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleGenerateNacha(selectedCycle.id)}
                      disabled={loading === "nacha"}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {loading === "nacha"
                        ? "Generating..."
                        : "Generate NACHA"}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleSubmit(selectedCycle.id)}
                      disabled={loading === "submit"}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {loading === "submit" ? "Submitting..." : "Submit"}
                    </Button>
                  </>
                )}
                {selectedCycle.status === "submitted" && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleComplete(selectedCycle.id)}
                    disabled={loading === "complete"}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {loading === "complete"
                      ? "Completing..."
                      : "Mark Complete"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reconciliation Results */}
            {reconResult && (
              <div
                className={`p-4 rounded-lg border ${
                  reconResult.passed
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    reconResult.passed
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {reconResult.passed
                    ? "All reconciliation checks passed"
                    : "Reconciliation checks failed"}
                </p>
                {reconResult.errors?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {reconResult.errors.map((e: any, i: number) => (
                      <li
                        key={i}
                        className="text-xs text-red-700 dark:text-red-300"
                      >
                        {e.message}
                      </li>
                    ))}
                  </ul>
                )}
                {reconResult.warnings?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {reconResult.warnings.map((w: any, i: number) => (
                      <li
                        key={i}
                        className="text-xs text-amber-700 dark:text-amber-300"
                      >
                        {w.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* NACHA File Content */}
            {nachaContent && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">NACHA File Generated</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadNacha(
                        nachaContent,
                        selectedCycle.billing_month
                      )
                    }
                    className="gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download .ach
                  </Button>
                </div>
                <pre className="p-3 bg-muted rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                  {nachaContent.slice(0, 2000)}
                  {nachaContent.length > 2000 && "\n... (truncated)"}
                </pre>
              </div>
            )}

            {/* Line Items */}
            {loading === "items" ? (
              <p className="text-sm text-muted-foreground">
                Loading line items...
              </p>
            ) : (
              <DataTable
                columns={lineItemColumns}
                data={lineItems}
                emptyMessage="No line items found."
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Generate Billing Tab ─────────────────────────────────────────────

function GenerateBillingTab({ activeLoans }: { activeLoans: any[] }) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const [billingMonth, setBillingMonth] = useState(defaultMonth);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    const res = await generateBillingCycleAction(billingMonth);
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Generate New Billing Cycle</CardTitle>
        <CardDescription>
          Creates a billing run for all {activeLoans.length} active loans.
          Calculates interest per loan using Dutch/Non-Dutch methods.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label>Billing Month (first of month)</Label>
            <Input
              type="date"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="w-48"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {loading ? "Generating..." : "Generate Billing Cycle"}
          </Button>
        </div>

        {result?.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Billing cycle generated successfully.
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Cycle ID: {result.billingCycleId}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh to view
            </Button>
          </div>
        )}

        {result?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-800">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {result.error}
            </p>
          </div>
        )}

        {/* Active Loans Preview */}
        <div className="pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Active loans that will be billed ({activeLoans.length})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {activeLoans.slice(0, 12).map((loan: any) => (
              <div
                key={loan.loan_id}
                className="text-xs p-2 border rounded-md"
              >
                <span className="font-mono font-medium">{loan.loan_id}</span>
                <span className="text-muted-foreground ml-1">
                  {loan.dutch_interest ? "D" : "ND"}
                </span>
                <div className="text-muted-foreground truncate">
                  {loan.borrower_name}
                </div>
              </div>
            ))}
            {activeLoans.length > 12 && (
              <div className="text-xs p-2 border rounded-md flex items-center justify-center text-muted-foreground">
                +{activeLoans.length - 12} more
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Apply Payment Tab ────────────────────────────────────────────────

function ApplyPaymentTab({ activeLoans }: { activeLoans: any[] }) {
  const [loanId, setLoanId] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleApply() {
    if (!loanId || !amount) return;
    setLoading(true);
    setResult(null);
    const res = await applyPaymentAction(
      loanId,
      paymentDate,
      parseFloat(amount),
      referenceNumber
    );
    setResult(res);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Apply Payment</CardTitle>
        <CardDescription>
          Apply a payment using the waterfall: late fees, then interest, then
          principal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Loan ID</Label>
            <select
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select loan...</option>
              {activeLoans.map((loan: any) => (
                <option key={loan.loan_id} value={loan.loan_id}>
                  {loan.loan_id} — {loan.borrower_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Reference / Trace #</Label>
            <Input
              placeholder="ACH trace number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleApply}
          disabled={loading || !loanId || !amount}
          className="gap-2"
        >
          <DollarSign className="h-4 w-4" />
          {loading ? "Applying..." : "Apply Payment"}
        </Button>

        {result?.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Payment applied successfully
            </p>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">To Fees:</span>{" "}
                <span className="font-medium">
                  {formatCurrencyDetailed(result.result?.applied_to_fees)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">To Interest:</span>{" "}
                <span className="font-medium">
                  {formatCurrencyDetailed(result.result?.applied_to_interest)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">To Principal:</span>{" "}
                <span className="font-medium">
                  {formatCurrencyDetailed(result.result?.applied_to_principal)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Overpayment:</span>{" "}
                <span className="font-medium">
                  {formatCurrencyDetailed(result.result?.overpayment)}
                </span>
              </div>
            </div>
          </div>
        )}

        {result?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              {result.error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Payoff Quote Tab ─────────────────────────────────────────────────

function PayoffQuoteTab({ activeLoans }: { activeLoans: any[] }) {
  const [loanId, setLoanId] = useState("");
  const [payoffDate, setPayoffDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  async function handleGenerate() {
    if (!loanId) return;
    setLoading(true);
    setQuote(null);
    const res = await generatePayoffQuoteAction(loanId, payoffDate);
    if (res.success) {
      setQuote(res.result);
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payoff Quote Generator</CardTitle>
        <CardDescription>
          Generate a payoff quote showing total amount due including accrued
          interest and fees.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label>Loan ID</Label>
            <select
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select loan...</option>
              {activeLoans.map((loan: any) => (
                <option key={loan.loan_id} value={loan.loan_id}>
                  {loan.loan_id} — {loan.borrower_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Payoff Date</Label>
            <Input
              type="date"
              value={payoffDate}
              onChange={(e) => setPayoffDate(e.target.value)}
              className="w-48"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || !loanId}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {loading ? "Generating..." : "Generate Quote"}
          </Button>
        </div>

        {quote && (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-3 border-b">
              <h3 className="font-semibold">
                Payoff Quote — {quote.loan_id}
              </h3>
              <p className="text-xs text-muted-foreground">
                Good through {formatDate(quote.good_through_date)} &middot;
                Expires {formatDate(quote.quote_expires)}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Principal Balance
                  </p>
                  <p className="font-mono font-semibold text-lg">
                    {formatCurrencyDetailed(quote.funded_balance)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Per Diem</p>
                  <p className="font-mono font-medium">
                    ${Number(quote.per_diem_amount).toFixed(4)}/day
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Days Accrued</p>
                  <p className="font-mono font-medium">
                    {quote.days_to_payoff} days
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Accrued Interest
                  </p>
                  <p className="font-mono font-medium">
                    {formatCurrencyDetailed(quote.accrued_interest)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Unpaid Billed Interest
                  </p>
                  <p className="font-mono font-medium">
                    {formatCurrencyDetailed(quote.unpaid_billed_interest)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Outstanding Fees
                  </p>
                  <p className="font-mono font-medium">
                    {formatCurrencyDetailed(quote.outstanding_fees)}
                  </p>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-medium">Total Payoff Amount</p>
                  <p className="font-mono font-bold text-2xl">
                    {formatCurrencyDetailed(quote.total_payoff_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Delinquency Tab ──────────────────────────────────────────────────

function DelinquencyTab({ records }: { records: any[] }) {
  const [loading, setLoading] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  async function handleRefresh() {
    setLoading(true);
    const res = await refreshDelinquencyAction();
    if (res.success) {
      setRefreshResult(res.result);
      window.location.reload();
    } else {
      alert(res.error);
    }
    setLoading(false);
  }

  const bucketStyles: Record<string, string> = {
    current: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "1-30": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "31-60": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "61-90": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    "90+": "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200",
  };

  const columns: Column<any>[] = [
    {
      key: "loan_id",
      header: "Loan",
      cell: (r) => <span className="font-mono font-medium">{r.loan_id}</span>,
    },
    {
      key: "delinquency_status",
      header: "Bucket",
      cell: (r) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            bucketStyles[r.delinquency_status] || ""
          }`}
        >
          {r.delinquency_status}
        </span>
      ),
    },
    {
      key: "days_delinquent",
      header: "Days",
      cell: (r) => (
        <span
          className={
            r.days_delinquent > 30
              ? "text-red-600 font-medium"
              : r.days_delinquent > 0
                ? "text-amber-600"
                : ""
          }
        >
          {r.days_delinquent}
        </span>
      ),
    },
    {
      key: "amount_past_due",
      header: "Past Due",
      cell: (r) => (
        <span className="font-medium">
          {formatCurrencyDetailed(r.amount_past_due)}
        </span>
      ),
    },
    {
      key: "oldest_unpaid_billing_date",
      header: "Oldest Unpaid",
      cell: (r) => formatDate(r.oldest_unpaid_billing_date),
    },
    {
      key: "late_fee_assessed",
      header: "Late Fee",
      cell: (r) =>
        r.late_fee_assessed
          ? formatCurrencyDetailed(r.late_fee_amount)
          : "—",
    },
    {
      key: "last_payment_date",
      header: "Last Payment",
      cell: (r) => formatDate(r.last_payment_date),
    },
    {
      key: "last_payment_amount",
      header: "Last Amt",
      cell: (r) =>
        r.last_payment_amount
          ? formatCurrencyDetailed(r.last_payment_amount)
          : "—",
    },
  ];

  // Summary by bucket
  const buckets = ["current", "1-30", "31-60", "61-90", "90+"];
  const bucketSummary = buckets.map((b) => {
    const inBucket = records.filter(
      (r: any) => r.delinquency_status === b
    );
    return {
      bucket: b,
      count: inBucket.length,
      amount: inBucket.reduce(
        (sum: number, r: any) => sum + (r.amount_past_due ?? 0),
        0
      ),
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Delinquency Aging</CardTitle>
              <CardDescription>
                Loan-level delinquency based on unpaid billing line items.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aging Buckets */}
          <div className="grid grid-cols-5 gap-3">
            {bucketSummary.map((b) => (
              <div
                key={b.bucket}
                className={`p-3 rounded-lg text-center ${
                  bucketStyles[b.bucket] || "bg-muted"
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide">
                  {b.bucket === "current" ? "Current" : `${b.bucket} Days`}
                </p>
                <p className="text-lg font-bold mt-1">{b.count}</p>
                <p className="text-xs mt-0.5">
                  {formatCurrency(b.amount)}
                </p>
              </div>
            ))}
          </div>

          {/* Detail Table */}
          <DataTable
            columns={columns}
            data={records}
            emptyMessage="No delinquency records. Run a refresh after generating billing cycles."
          />
        </CardContent>
      </Card>
    </div>
  );
}
