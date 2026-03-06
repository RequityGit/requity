"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentDownload } from "@/components/borrower/document-download";
import { BorrowerConditionsTab } from "@/components/borrower/borrower-conditions-tab";
import { formatCurrencyDetailed, formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/constants";
import type { LoanPayment, Document, LoanCondition } from "@/lib/supabase/types";
import { FileText, CreditCard, ClipboardList, MessageCircle } from "lucide-react";
import { LoanChatter } from "@/components/shared/loan-chatter";

interface LoanDetailTabsProps {
  payments: LoanPayment[];
  documents: Document[];
  conditions: LoanCondition[];
  loanId: string;
  currentUserId: string;
}

export function LoanDetailTabs({
  payments,
  documents,
  conditions,
  loanId,
  currentUserId,
}: LoanDetailTabsProps) {
  const paymentColumns: Column<LoanPayment>[] = [
    {
      key: "payment_date",
      header: "Date",
      cell: (row) => formatDate(row.payment_date),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatCurrencyDetailed(row.amount),
    },
    {
      key: "principal",
      header: "Principal",
      cell: (row) => formatCurrencyDetailed(row.principal_amount),
    },
    {
      key: "interest",
      header: "Interest",
      cell: (row) => formatCurrencyDetailed(row.interest_amount),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const documentColumns: Column<Document>[] = [
    {
      key: "file_name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate max-w-[200px]">{row.file_name}</span>
        </div>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => {
        const label =
          DOCUMENT_TYPES.find((t) => t.value === row.document_type)?.label ??
          row.document_type?.replace(/_/g, " ") ?? "—";
        return <span className="capitalize text-sm">{label}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status ?? "pending"} />,
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "download",
      header: "",
      cell: (row) => (
        <DocumentDownload
          filePath={row.file_path ?? ""}
          fileName={row.file_name ?? ""}
        />
      ),
    },
  ];

  const outstandingCount = conditions.filter(
    (c) => !["approved", "waived", "not_applicable"].includes(c.status)
  ).length;

  return (
    <Tabs defaultValue="conditions">
      <TabsList>
        <TabsTrigger value="conditions" className="gap-1.5">
          <ClipboardList className="h-4 w-4" />
          Conditions
          {outstandingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 num">
              {outstandingCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-1.5">
          <CreditCard className="h-4 w-4" />
          Payments
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="messages" className="gap-1.5">
          <MessageCircle className="h-4 w-4" />
          Messages
        </TabsTrigger>
      </TabsList>

      <TabsContent value="conditions" className="mt-4">
        <BorrowerConditionsTab
          conditions={conditions}
          loanId={loanId}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="payments" className="mt-4">
        <DataTable
          columns={paymentColumns}
          data={payments}
          emptyMessage="No payments found for this loan."
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <DataTable
          columns={documentColumns}
          data={documents}
          emptyMessage="No documents found for this loan."
        />
      </TabsContent>

      <TabsContent value="messages" className="mt-4">
        <LoanChatter
          loanId={loanId}
          currentUserId={currentUserId}
          isAdmin={false}
        />
      </TabsContent>
    </Tabs>
  );
}
