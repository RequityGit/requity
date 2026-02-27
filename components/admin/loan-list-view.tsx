"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { LOAN_STAGES, LOAN_STAGE_LABELS, LOAN_TYPES } from "@/lib/constants";
import { LoanKanban } from "@/components/admin/loan-kanban";
import { Search, LayoutGrid, Table as TableIcon } from "lucide-react";

export interface LoanRow {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  borrower_name: string;
  borrower_id: string;
  loan_type: string | null;
  loan_amount: number;
  ltv: number | null;
  interest_rate: number | null;
  stage: string;
  origination_date: string | null;
  created_at: string;
}

interface LoanListViewProps {
  data: LoanRow[];
}

export function LoanListView({ data }: LoanListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.property_address ?? "").toLowerCase().includes(q) ||
          l.borrower_name.toLowerCase().includes(q) ||
          (l.loan_number ?? "").toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all") {
      result = result.filter((l) => l.stage === stageFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((l) => l.loan_type === typeFilter);
    }
    return result;
  }, [data, search, stageFilter, typeFilter]);

  const columns: Column<LoanRow>[] = [
    {
      key: "property_address",
      header: "Property",
      cell: (row) => (
        <div>
          <p className="font-medium text-[#1a2b4a]">{row.property_address ?? "—"}</p>
          {(row.property_city || row.property_state) && (
            <p className="text-xs text-muted-foreground">
              {[row.property_city, row.property_state]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "borrower_name",
      header: "Borrower",
      cell: (row) => row.borrower_name,
    },
    {
      key: "loan_type",
      header: "Type",
      cell: (row) => (
        <span className="capitalize">{(row.loan_type ?? "").replace(/_/g, " ") || "—"}</span>
      ),
    },
    {
      key: "loan_amount",
      header: "Amount",
      cell: (row) => formatCurrency(row.loan_amount),
    },
    {
      key: "ltv",
      header: "LTV",
      cell: (row) => formatPercent(row.ltv),
    },
    {
      key: "interest_rate",
      header: "Rate",
      cell: (row) => formatPercent(row.interest_rate),
    },
    {
      key: "stage",
      header: "Stage",
      cell: (row) => <StatusBadge status={row.stage} />,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {LOAN_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {LOAN_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LOAN_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban / Table Toggle */}
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <TableIcon className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4">
          <DataTable<LoanRow>
            columns={columns}
            data={filtered}
            emptyMessage="No loans found."
            onRowClick={(row) => router.push(`/admin/loans/${row.id}`)}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <LoanKanban data={filtered} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
