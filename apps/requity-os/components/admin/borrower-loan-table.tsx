"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

interface Loan {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  type: string;
  loan_amount: number | null;
  stage: string;
  origination_date: string | null;
}

interface BorrowerLoanTableProps {
  loans: Loan[];
}

const loanColumns: Column<Loan>[] = [
  {
    key: "loan_number",
    header: "Loan #",
    cell: (row) => (
      <Link
        href={`/admin/pipeline/${row.id}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {row.loan_number || "—"}
      </Link>
    ),
  },
  {
    key: "property_address",
    header: "Property",
    cell: (row) =>
      row.property_address
        ? `${row.property_address}, ${row.property_city || ""} ${row.property_state || ""}`
        : "—",
  },
  {
    key: "type",
    header: "Type",
    cell: (row) =>
      row.type ? (
        <span className="capitalize">{row.type.replace(/_/g, " ")}</span>
      ) : (
        "—"
      ),
  },
  {
    key: "loan_amount",
    header: "Amount",
    cell: (row) => formatCurrency(row.loan_amount),
  },
  {
    key: "stage",
    header: "Stage",
    cell: (row) => <StatusBadge status={row.stage} />,
  },
  {
    key: "origination_date",
    header: "Originated",
    cell: (row) => formatDate(row.origination_date),
  },
];

export function BorrowerLoanTable({ loans }: BorrowerLoanTableProps) {
  return (
    <DataTable
      columns={loanColumns}
      data={loans}
      emptyMessage="No loans found for this borrower."
    />
  );
}
