"use client";

import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

interface BorrowerRow {
  id: string;
  full_name: string;
  email: string;
  company: string;
  phone: string;
  activeLoans: number;
  totalOutstanding: number;
}

interface BorrowerListTableProps {
  data: BorrowerRow[];
}

export function BorrowerListTable({ data }: BorrowerListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (b) =>
        b.full_name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.company.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: Column<BorrowerRow>[] = [
    {
      key: "full_name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium text-[#1a2b4a]">{row.full_name}</span>
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
      key: "activeLoans",
      header: "Active Loans",
      cell: (row) => row.activeLoans,
    },
    {
      key: "totalOutstanding",
      header: "Total Outstanding",
      cell: (row) => formatCurrency(row.totalOutstanding),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search borrowers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <DataTable<BorrowerRow>
        columns={columns}
        data={filtered}
        emptyMessage="No borrowers found."
        onRowClick={(row) => router.push(`/admin/borrowers/${row.id}`)}
      />
    </div>
  );
}
