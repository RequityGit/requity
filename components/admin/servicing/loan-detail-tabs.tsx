"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatDate,
} from "@/lib/format";
import { PayoffStatementGenerator } from "@/components/admin/servicing/payoff-statement-generator";
import {
  Hammer,
  CreditCard,
  HardHat,
  ScrollText,
  FileText,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface LoanDetailTabsProps {
  draws: any[];
  payments: any[];
  budgetItems: any[];
  auditLog: any[];
  loan: any;
  payoffStatementCount: number;
}

export function LoanDetailTabs({
  draws,
  payments,
  budgetItems,
  auditLog,
  loan,
  payoffStatementCount,
}: LoanDetailTabsProps) {
  return (
    <Tabs defaultValue="draws">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="draws" className="gap-1.5">
          <Hammer className="h-3.5 w-3.5" />
          Draws
          {draws.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
              {draws.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          Payments
          {payments.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
              {payments.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="budget" className="gap-1.5">
          <HardHat className="h-3.5 w-3.5" />
          Budget
          {budgetItems.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
              {budgetItems.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-1.5">
          <ScrollText className="h-3.5 w-3.5" />
          Audit Log
        </TabsTrigger>
        <TabsTrigger value="payoff" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Payoff
          {payoffStatementCount > 0 && (
            <span className="ml-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5">
              {payoffStatementCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="draws" className="mt-4">
        <DrawsTab draws={draws} />
      </TabsContent>

      <TabsContent value="payments" className="mt-4">
        <PaymentsTab payments={payments} />
      </TabsContent>

      <TabsContent value="budget" className="mt-4">
        <BudgetTab budgetItems={budgetItems} />
      </TabsContent>

      <TabsContent value="audit" className="mt-4">
        <AuditLogTab auditLog={auditLog} />
      </TabsContent>

      <TabsContent value="payoff" className="mt-4">
        <PayoffStatementGenerator loanId={loan?.loan_id} loan={loan} />
      </TabsContent>
    </Tabs>
  );
}

// ── Draws Tab ──────────────────────────────────────────────────────────

function DrawsTab({ draws }: { draws: any[] }) {
  const columns: Column<any>[] = [
    { key: "draw_number", header: "#", cell: (r) => r.draw_number },
    { key: "line_item", header: "Description", cell: (r) => r.line_item ?? "—" },
    { key: "amount", header: "Amount", cell: (r) => formatCurrency(r.amount) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { key: "request_date", header: "Requested", cell: (r) => formatDate(r.request_date) },
    { key: "funded_date", header: "Funded", cell: (r) => formatDate(r.funded_date) },
    { key: "approved_by", header: "Approved By", cell: (r) => r.approved_by ?? "—" },
    { key: "notes", header: "Notes", cell: (r) => <span className="text-xs text-muted-foreground">{r.notes ?? "—"}</span>, className: "max-w-[200px] truncate" },
  ];

  return <DataTable columns={columns} data={draws} emptyMessage="No draws for this loan." />;
}

// ── Payments Tab ───────────────────────────────────────────────────────

function PaymentsTab({ payments }: { payments: any[] }) {
  const columns: Column<any>[] = [
    { key: "date", header: "Date", cell: (r) => formatDate(r.date) },
    { key: "type", header: "Type", cell: (r) => r.type },
    { key: "amount_due", header: "Due", cell: (r) => formatCurrencyDetailed(r.amount_due) },
    { key: "amount_paid", header: "Paid", cell: (r) => formatCurrencyDetailed(r.amount_paid) },
    { key: "interest", header: "Interest", cell: (r) => formatCurrencyDetailed(r.interest) },
    { key: "principal", header: "Principal", cell: (r) => r.principal > 0 ? formatCurrencyDetailed(r.principal) : "—" },
    { key: "late_fee", header: "Late Fee", cell: (r) => r.late_fee > 0 ? formatCurrencyDetailed(r.late_fee) : "—" },
    { key: "balance_after", header: "Balance After", cell: (r) => formatCurrency(r.balance_after) },
    { key: "payment_method", header: "Method", cell: (r) => r.payment_method ?? "—" },
    { key: "entry_type", header: "Entry", cell: (r) => <StatusBadge status={r.entry_type} /> },
  ];

  return <DataTable columns={columns} data={payments} emptyMessage="No payments for this loan." />;
}

// ── Budget Tab ─────────────────────────────────────────────────────────

function BudgetTab({ budgetItems }: { budgetItems: any[] }) {
  const columns: Column<any>[] = [
    { key: "line_item", header: "Line Item", cell: (r) => r.line_item },
    { key: "budget_amount", header: "Budget", cell: (r) => formatCurrency(r.budget_amount) },
    { key: "amount_drawn", header: "Drawn", cell: (r) => formatCurrency(r.amount_drawn) },
    { key: "remaining", header: "Remaining", cell: (r) => formatCurrency(r.remaining) },
    {
      key: "pct_complete",
      header: "% Complete",
      cell: (r) => {
        const pct = r.pct_complete ? (r.pct_complete * 100).toFixed(0) : "0";
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(Number(pct), 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    { key: "status", header: "Status", cell: (r) => r.status ?? "—" },
    { key: "inspector_notes", header: "Inspector Notes", cell: (r) => <span className="text-xs text-muted-foreground">{r.inspector_notes ?? "—"}</span>, className: "max-w-[200px] truncate" },
  ];

  return <DataTable columns={columns} data={budgetItems} emptyMessage="No budget items for this loan." />;
}

// ── Audit Log Tab ─────────────────────────────────────────────────────

function AuditLogTab({ auditLog }: { auditLog: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      cell: (r) =>
        r.timestamp
          ? new Date(r.timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "—",
    },
    { key: "action", header: "Action", cell: (r) => <span className="font-mono text-xs">{r.action}</span> },
    { key: "field_changed", header: "Field", cell: (r) => r.field_changed ?? "—" },
    { key: "old_value", header: "Old Value", cell: (r) => <span className="text-xs">{r.old_value ?? "—"}</span> },
    { key: "new_value", header: "New Value", cell: (r) => <span className="text-xs font-medium">{r.new_value ?? "—"}</span> },
    { key: "reference", header: "Reference", cell: (r) => <span className="text-xs text-muted-foreground">{r.reference ?? "—"}</span> },
    { key: "entry_type", header: "Source", cell: (r) => r.entry_type ?? "—" },
  ];

  return <DataTable columns={columns} data={auditLog} emptyMessage="No audit entries for this loan." />;
}
