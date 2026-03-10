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
  entity_name: string | null;
  source: "loan" | "contact" | "company" | "deal";
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

const SOURCE_LABELS: Record<DocumentRow["source"], string> = {
  loan: "Loan / Fund",
  contact: "Contact",
  company: "Company",
  deal: "Deal",
};

export function DocumentListTable({ data, action }: DocumentListTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.file_name.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false) ||
          d.owner_name.toLowerCase().includes(q) ||
          (d.entity_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((d) => d.document_type === typeFilter);
    }
    if (sourceFilter !== "all") {
      result = result.filter((d) => d.source === sourceFilter);
    }
    return result;
  }, [data, search, typeFilter, sourceFilter]);

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
      key: "source",
      header: "Source",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {SOURCE_LABELS[row.source]}
        </span>
      ),
    },
    {
      key: "entity_name",
      header: "Entity",
      cell: (row) => row.entity_name || "—",
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
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {(Object.entries(SOURCE_LABELS) as [DocumentRow["source"], string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
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
