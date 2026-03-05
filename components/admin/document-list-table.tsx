"use client";

import { useState, useMemo } from "react";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface DocumentRow {
  id: string;
  file_name: string;
  description: string | null;
  document_type: string | null;
  owner_name: string;
  fund_name: string | null;
  loan_address: string | null;
  status: string;
  created_at: string;
}

interface DocumentListTableProps {
  data: DocumentRow[];
  action?: React.ReactNode;
}

function getDocTypeLabel(value: string): string {
  return (
    DOCUMENT_TYPES.find((dt) => dt.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function DocumentListTable({ data, action }: DocumentListTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.file_name.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false) ||
          d.owner_name.toLowerCase().includes(q) ||
          (d.fund_name?.toLowerCase().includes(q) ?? false) ||
          (d.loan_address?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((d) => d.document_type === typeFilter);
    }
    return result;
  }, [data, search, typeFilter]);

  const columns: Column<DocumentRow>[] = [
    {
      key: "file_name",
      header: "Name",
      cell: (row) => (
        <span className="font-medium">
          {row.description || row.file_name}
        </span>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => (
        <span className="text-sm">{row.document_type ? getDocTypeLabel(row.document_type) : "—"}</span>
      ),
    },
    {
      key: "owner_name",
      header: "Owner",
      cell: (row) => row.owner_name,
    },
    {
      key: "fund_loan",
      header: "Fund / Loan",
      cell: (row) => row.fund_name || row.loan_address || "—",
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOCUMENT_TYPES.map((dt) => (
              <SelectItem key={dt.value} value={dt.value}>
                {dt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {action && <><div className="flex-1" />{action}</>}
      </div>

      <DataTable<DocumentRow>
        columns={columns}
        data={filtered}
        emptyMessage="No documents found."
      />
    </div>
  );
}
