"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import {
  LOAN_STAGES,
  LOAN_STAGE_LABELS,
  LOAN_TYPES,
  LOAN_PRIORITIES,
  PIPELINE_STAGES,
  getDaysInStageColor,
  LoanStage,
} from "@/lib/constants";
import { LoanKanban, PipelineLoanRow } from "@/components/admin/loan-kanban";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  Download,
  X,
  Flame,
  Pause,
  Clock,
} from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
}

interface LoanListViewProps {
  data: PipelineLoanRow[];
  teamMembers: TeamMember[];
  currentUserId: string;
}

export function LoanListView({
  data,
  teamMembers,
  currentUserId,
}: LoanListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  const hasFilters =
    search !== "" ||
    stageFilter !== "all" ||
    typeFilter !== "all" ||
    priorityFilter !== "all" ||
    teamFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStageFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setTeamFilter("all");
  }

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.property_address ?? "").toLowerCase().includes(q) ||
          l.borrower_name.toLowerCase().includes(q) ||
          (l.loan_number ?? "").toLowerCase().includes(q) ||
          (l.property_city ?? "").toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all") {
      result = result.filter((l) => l.stage === stageFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((l) => l.loan_type === typeFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((l) => l.priority === priorityFilter);
    }
    if (teamFilter !== "all") {
      result = result.filter(
        (l) =>
          l.originator_name === teamFilter ||
          l.processor_name === teamFilter
      );
    }
    return result;
  }, [data, search, stageFilter, typeFilter, priorityFilter, teamFilter]);

  // Pipeline summary stats
  const pipelineStats = useMemo(() => {
    const total = data.length;
    const totalVolume = data.reduce((sum, l) => sum + l.loan_amount, 0);
    const hotCount = data.filter((l) => l.priority === "hot").length;
    return { total, totalVolume, hotCount };
  }, [data]);

  function getDaysInStage(stageUpdatedAt: string): number {
    const updated = new Date(stageUpdatedAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  function formatLoanType(type: string | null): string {
    if (!type) return "—";
    const found = LOAN_TYPES.find((t) => t.value === type);
    return found ? found.label : type.replace(/_/g, " ");
  }

  // CSV export
  const exportCsv = useCallback(() => {
    const headers = [
      "Loan Number",
      "Property Address",
      "City",
      "State",
      "Borrower",
      "Loan Type",
      "Amount",
      "Stage",
      "Priority",
      "Days in Stage",
      "Originator",
      "Processor",
      "Next Action",
      "Created Date",
    ];
    const rows = filtered.map((l) => [
      l.loan_number ?? "",
      l.property_address ?? "",
      l.property_city ?? "",
      l.property_state ?? "",
      l.borrower_name,
      formatLoanType(l.loan_type),
      l.loan_amount.toString(),
      LOAN_STAGE_LABELS[l.stage as LoanStage] ?? l.stage,
      l.priority,
      getDaysInStage(l.stage_updated_at).toString(),
      l.originator_name ?? "",
      l.processor_name ?? "",
      l.next_action ?? "",
      l.created_at ? new Date(l.created_at).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loans-pipeline-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const columns: Column<PipelineLoanRow>[] = [
    {
      key: "property_address",
      header: "Property",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1">
            {row.priority === "hot" && (
              <Flame className="h-3 w-3 text-red-500 flex-shrink-0" />
            )}
            {row.priority === "on_hold" && (
              <Pause className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
            <p className="font-medium text-surface-white">
              {row.property_address ?? "—"}
            </p>
          </div>
          {(row.property_city || row.property_state) && (
            <p className="text-xs text-surface-muted">
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
        <span className="text-sm">{formatLoanType(row.loan_type)}</span>
      ),
    },
    {
      key: "loan_amount",
      header: "Amount",
      cell: (row) => (
        <span className="font-medium">{formatCurrency(row.loan_amount)}</span>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      cell: (row) => <StatusBadge status={row.stage} />,
    },
    {
      key: "days_in_stage",
      header: "Days",
      cell: (row) => {
        const days = getDaysInStage(row.stage_updated_at);
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${getDaysInStageColor(days)}`}
          >
            <Clock className="h-3 w-3" />
            {days}d
          </span>
        );
      },
    },
    {
      key: "originator_name",
      header: "Team",
      cell: (row) => (
        <div className="text-xs">
          {row.originator_name && (
            <p className="text-surface-muted">{row.originator_name}</p>
          )}
          {row.processor_name && (
            <p className="text-surface-muted">{row.processor_name}</p>
          )}
          {!row.originator_name && !row.processor_name && (
            <span className="text-surface-muted">—</span>
          )}
        </div>
      ),
    },
    {
      key: "next_action",
      header: "Next Action",
      cell: (row) =>
        row.next_action ? (
          <span className="text-xs text-amber-700 line-clamp-1">
            {row.next_action}
          </span>
        ) : (
          <span className="text-xs text-surface-muted">—</span>
        ),
    },
  ];

  // Unique team member names for the filter dropdown
  const uniqueTeamNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach((l) => {
      if (l.originator_name) names.add(l.originator_name);
      if (l.processor_name) names.add(l.processor_name);
    });
    return Array.from(names).sort();
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Pipeline summary bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-surface-muted">
          <span className="font-semibold text-surface-white">
            {pipelineStats.total}
          </span>{" "}
          loans
        </span>
        <span className="text-surface-muted">
          <span className="font-semibold text-surface-white">
            {formatCurrency(pipelineStats.totalVolume)}
          </span>{" "}
          pipeline volume
        </span>
        {pipelineStats.hotCount > 0 && (
          <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
            <Flame className="h-3 w-3" />
            {pipelineStats.hotCount} hot
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
          <Input
            placeholder="Search by address, borrower, or loan #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[170px]">
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
          <SelectTrigger className="w-[170px]">
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {LOAN_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {uniqueTeamNames.length > 0 && (
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Team Member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Team</SelectItem>
              {uniqueTeamNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-surface-muted"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Kanban / Table Toggle */}
      <Tabs defaultValue="kanban">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <TableIcon className="h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <TabsContent value="kanban" className="mt-4">
          <LoanKanban data={filtered} currentUserId={currentUserId} />
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <DataTable<PipelineLoanRow>
            columns={columns}
            data={filtered}
            emptyMessage="No loans found."
            onRowClick={(row) => router.push(`/admin/loans/${row.id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
