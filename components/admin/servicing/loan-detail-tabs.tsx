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
  HardHat,
  CreditCard,
  ScrollText,
  FileText,
} from "lucide-react";
import { BudgetDrawsTab } from "@/components/admin/budget-draws/budget-draws-tab";
import type {
  ConstructionBudget,
  BudgetLineItem,
  DrawRequest,
  DrawRequestLineItem,
  BudgetChangeRequest,
  BudgetChangeRequestLineItem,
  BudgetLineItemHistory,
} from "@/components/admin/budget-draws/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface ServicingLoanDetailTabsProps {
  payments: any[];
  auditLog: any[];
  loan: any;
  payoffStatementCount: number;
  // New budget/draws data
  loanUuid: string | null;
  currentUserId: string;
  constructionBudget: ConstructionBudget | null;
  budgetLineItems: BudgetLineItem[];
  drawRequests: DrawRequest[];
  drawRequestLineItems: DrawRequestLineItem[];
  budgetChangeRequests: BudgetChangeRequest[];
  budgetChangeRequestLineItems: BudgetChangeRequestLineItem[];
  budgetAuditLog: BudgetLineItemHistory[];
  totalUnits: number;
}

export function ServicingLoanDetailTabs({
  payments,
  auditLog,
  loan,
  payoffStatementCount,
  loanUuid,
  currentUserId,
  constructionBudget,
  budgetLineItems,
  drawRequests,
  drawRequestLineItems,
  budgetChangeRequests,
  budgetChangeRequestLineItems,
  budgetAuditLog,
  totalUnits,
}: ServicingLoanDetailTabsProps) {
  return (
    <Tabs defaultValue="budget-draws">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="budget-draws" className="gap-1.5">
          <HardHat className="h-3.5 w-3.5" />
          Budget & Draws
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

      <TabsContent value="budget-draws" className="mt-4">
        {loanUuid ? (
          <BudgetDrawsTab
            loanId={loanUuid}
            budget={constructionBudget}
            budgetLineItems={budgetLineItems}
            drawRequests={drawRequests}
            drawRequestLineItems={drawRequestLineItems}
            changeRequests={budgetChangeRequests}
            changeRequestLineItems={budgetChangeRequestLineItems}
            auditLog={budgetAuditLog}
            currentUserId={currentUserId}
            totalUnits={totalUnits}
          />
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>No matching loan record found in the pipeline.</p>
            <p className="text-xs mt-1">Budget & Draws requires a linked pipeline loan.</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="payments" className="mt-4">
        <PaymentsTab payments={payments} />
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
