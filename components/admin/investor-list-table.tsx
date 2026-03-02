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
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  accreditation_status: string | null;
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
        inv.first_name.toLowerCase().includes(q) ||
        inv.last_name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: Column<InvestorRow>[] = [
    {
      key: "last_name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium text-foreground">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => row.email,
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => row.phone,
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
      key: "accreditation_status",
      header: "Accreditation",
      cell: (row) => <StatusBadge status={row.accreditation_status ?? "pending"} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
