"use client";

import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatPercent } from "@/lib/format";

interface FundRow {
  id: string;
  name: string;
  fund_type: string;
  target_size: number | null;
  current_aum: number | null;
  vintage_year: number | null;
  status: string;
  irr_target: number | null;
  preferred_return: number | null;
  management_fee: number | null;
}

interface FundListTableProps {
  data: FundRow[];
}

export function FundListTable({ data }: FundListTableProps) {
  const router = useRouter();

  const columns: Column<FundRow>[] = [
    {
      key: "name",
      header: "Investment Name",
      cell: (row) => (
        <span className="font-medium text-[#1a2b4a]">{row.name}</span>
      ),
    },
    {
      key: "fund_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">{row.fund_type.replace(/_/g, " ")}</span>
      ),
    },
    {
      key: "target_size",
      header: "Target Size",
      cell: (row) => formatCurrency(row.target_size),
    },
    {
      key: "current_aum",
      header: "Current AUM",
      cell: (row) => formatCurrency(row.current_aum),
    },
    {
      key: "vintage_year",
      header: "Vintage",
      cell: (row) => row.vintage_year ?? "—",
    },
    {
      key: "irr_target",
      header: "IRR Target",
      cell: (row) => formatPercent(row.irr_target),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable<FundRow>
      columns={columns}
      data={data}
      emptyMessage="No investments found."
      onRowClick={(row) => router.push(`/admin/funds/${row.id}`)}
    />
  );
}
