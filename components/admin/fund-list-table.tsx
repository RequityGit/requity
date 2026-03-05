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
        <span className="font-medium text-foreground">{row.name}</span>
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
      cell: (row) => <span className="num">{formatCurrency(row.target_size)}</span>,
    },
    {
      key: "current_aum",
      header: "Current AUM",
      cell: (row) => <span className="num">{formatCurrency(row.current_aum)}</span>,
    },
    {
      key: "vintage_year",
      header: "Vintage",
      cell: (row) => <span className="num">{row.vintage_year ?? "—"}</span>,
    },
    {
      key: "irr_target",
      header: "IRR Target",
      cell: (row) => <span className="num">{formatPercent(row.irr_target)}</span>,
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
