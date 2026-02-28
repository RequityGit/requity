"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

interface DistributionRow {
  id: string;
  fund_name: string;
  investor_name: string;
  distribution_type: string;
  amount: number;
  distribution_date: string;
  description: string | null;
  status: string;
}

interface DistributionListTableProps {
  data: DistributionRow[];
}

export function DistributionListTable({ data }: DistributionListTableProps) {
  const columns: Column<DistributionRow>[] = [
    {
      key: "fund_name",
      header: "Investment",
      cell: (row) => (
        <span className="font-medium text-surface-white">{row.fund_name}</span>
      ),
    },
    {
      key: "investor_name",
      header: "Investor",
      cell: (row) => row.investor_name,
    },
    {
      key: "distribution_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">
          {row.distribution_type.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.amount),
    },
    {
      key: "distribution_date",
      header: "Date",
      cell: (row) => formatDate(row.distribution_date),
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="max-w-[200px] truncate block">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable<DistributionRow>
      columns={columns}
      data={data}
      emptyMessage="No distributions found."
    />
  );
}
