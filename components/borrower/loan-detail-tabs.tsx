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
import { formatCurrencyDetailed, formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/constants";
import type { LoanPayment, Document } from "@/lib/supabase/types";
import { FileText, CreditCard } from "lucide-react";

interface LoanDetailTabsProps {
  payments: LoanPayment[];
  documents: Document[];
}

export function LoanDetailTabs({ payments, documents }: LoanDetailTabsProps) {
  const paymentColumns: Column<LoanPayment>[] = [
    {
      key: "due_date",
      header: "Due Date",
      cell: (row) => formatDate(row.due_date),
    },
    {
      key: "amount_due",
      header: "Amount Due",
      cell: (row) => formatCurrencyDetailed(row.amount_due),
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
      key: "amount_paid",
      header: "Amount Paid",
      cell: (row) =>
        row.amount_paid != null
          ? formatCurrencyDetailed(row.amount_paid)
          : "\u2014",
    },
    {
      key: "paid_date",
      header: "Paid Date",
      cell: (row) => formatDate(row.paid_date),
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
          <FileText className="h-4 w-4 text-surface-muted flex-shrink-0" />
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
          row.document_type.replace(/_/g, " ");
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
          filePath={row.file_path}
          fileName={row.file_name}
        />
      ),
    },
  ];

  return (
    <Tabs defaultValue="payments">
      <TabsList>
        <TabsTrigger value="payments" className="gap-1.5">
          <CreditCard className="h-4 w-4" />
          Payments
        </TabsTrigger>
        <TabsTrigger value="documents" className="gap-1.5">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
      </TabsList>

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
    </Tabs>
  );
}
