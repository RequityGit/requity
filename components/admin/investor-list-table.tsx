"use client";

import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface InvestorRow {
  id: string;
  full_name: string;
  email: string;
  company: string;
  activationStatus: string;
  totalCommitted: number;
  totalFunded: number;
  fundCount: number;
}

interface InvestorListTableProps {
  data: InvestorRow[];
}

export function InvestorListTable({ data }: InvestorListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (inv) =>
        inv.full_name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        inv.company.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: Column<InvestorRow>[] = [
    {
      key: "full_name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium text-surface-white">{row.full_name}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => row.email,
    },
    {
      key: "company",
      header: "Company",
      cell: (row) => row.company,
    },
    {
      key: "totalCommitted",
      header: "Total Committed",
      cell: (row) => formatCurrency(row.totalCommitted),
    },
    {
      key: "totalFunded",
      header: "Total Funded",
      cell: (row) => formatCurrency(row.totalFunded),
    },
    {
      key: "fundCount",
      header: "Investments",
      cell: (row) => row.fundCount,
    },
    {
      key: "activationStatus",
      header: "Portal Status",
      cell: (row) => <StatusBadge status={row.activationStatus} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
        <Input
          placeholder="Search investors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <DataTable<InvestorRow>
        columns={columns}
        data={filtered}
        emptyMessage="No investors found."
        onRowClick={(row) => router.push(`/admin/investors/${row.id}`)}
      />
    </div>
  );
}
