"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StagePill } from "@/components/admin/pipeline/stage-pill";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  LOAN_STAGES,
  LOAN_STAGE_LABELS,
  LOAN_TYPES,
  LOAN_PRIORITIES,
  getDaysInStageColor,
} from "@/lib/constants";
import {
  Search,
  Download,
  X,
  Flame,
  Pause,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { LoanDetailDrawer } from "./loan-detail-drawer";

export interface LendingPipelineRow {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  borrower_name: string;
  borrower_id: string | null;
  loan_type: string | null;
  loan_amount: number;
  stage: string;
  stage_updated_at: string;
  created_at: string;
  priority: string;
  next_action: string | null;
  originator_name: string | null;
  processor_name: string | null;
  document_count: number;
  total_conditions: number;
  interest_rate?: number | null;
  loan_term_months?: number | null;
  ltv?: number | null;
  appraised_value?: number | null;
  property_type?: string | null;
}

interface LendingPipelineTableProps {
  data: LendingPipelineRow[];
  teamMembers: { id: string; full_name: string }[];
}

type SortKey =
  | "borrower_name"
  | "loan_amount"
  | "stage"
  | "days_in_stage"
  | "created_at"
  | null;
type SortDir = "asc" | "desc";

function getDaysInStage(stageUpdatedAt: string): number {
  const updated = new Date(stageUpdatedAt);
  const now = new Date();
  return Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatLoanType(type: string | null): string {
  if (!type) return "--";
  const found = LOAN_TYPES.find((t) => t.value === type);
  return found ? found.label : type.replace(/_/g, " ");
}

export function LendingPipelineTable({
  data,
  teamMembers,
}: LendingPipelineTableProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedLoan, setSelectedLoan] = useState<LendingPipelineRow | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  }

  // Filter
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
          l.originator_name === teamFilter || l.processor_name === teamFilter
      );
    }
    return result;
  }, [data, search, stageFilter, typeFilter, priorityFilter, teamFilter]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "borrower_name":
          cmp = a.borrower_name.localeCompare(b.borrower_name);
          break;
        case "loan_amount":
          cmp = (a.loan_amount ?? 0) - (b.loan_amount ?? 0);
          break;
        case "stage": {
          const stageOrder = LOAN_STAGES as readonly string[];
          cmp =
            stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
          break;
        }
        case "days_in_stage":
          cmp =
            getDaysInStage(a.stage_updated_at) -
            getDaysInStage(b.stage_updated_at);
          break;
        case "created_at":
          cmp =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Stats
  const pipelineStats = useMemo(() => {
    const total = data.length;
    const totalVolume = data.reduce((sum, l) => sum + l.loan_amount, 0);
    const hotCount = data.filter((l) => l.priority === "hot").length;
    return { total, totalVolume, hotCount };
  }, [data]);

  // Unique team names
  const uniqueTeamNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach((l) => {
      if (l.originator_name) names.add(l.originator_name);
      if (l.processor_name) names.add(l.processor_name);
    });
    return Array.from(names).sort();
  }, [data]);

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
    const rows = sorted.map((l) => [
      l.loan_number ?? "",
      l.property_address ?? "",
      l.property_city ?? "",
      l.property_state ?? "",
      l.borrower_name,
      formatLoanType(l.loan_type),
      l.loan_amount.toString(),
      LOAN_STAGE_LABELS[l.stage] ?? l.stage,
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
  }, [sorted]);

  function handleRowClick(row: LendingPipelineRow) {
    setSelectedLoan(row);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Pipeline summary bar */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground num">
            {pipelineStats.total}
          </span>{" "}
          loans
        </span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground num">
            {formatCurrency(pipelineStats.totalVolume)}
          </span>{" "}
          pipeline volume
        </span>
        {pipelineStats.hotCount > 0 && (
          <Badge className="bg-[rgba(212,38,32,0.08)] text-[#D42620] dark:bg-[rgba(239,68,68,0.1)] dark:text-[#EF4444] border-0 gap-1">
            <Flame className="h-3 w-3" />
            {pipelineStats.hotCount} hot
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
                Property
              </TableHead>
              <TableHead
                className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground cursor-pointer select-none"
                onClick={() => toggleSort("borrower_name")}
              >
                <span className="inline-flex items-center">
                  Borrower
                  <SortIcon column="borrower_name" />
                </span>
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
                Type
              </TableHead>
              <TableHead
                className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground text-right cursor-pointer select-none"
                onClick={() => toggleSort("loan_amount")}
              >
                <span className="inline-flex items-center justify-end">
                  Amount
                  <SortIcon column="loan_amount" />
                </span>
              </TableHead>
              <TableHead
                className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground cursor-pointer select-none"
                onClick={() => toggleSort("stage")}
              >
                <span className="inline-flex items-center">
                  Stage
                  <SortIcon column="stage" />
                </span>
              </TableHead>
              <TableHead
                className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground text-right cursor-pointer select-none"
                onClick={() => toggleSort("days_in_stage")}
              >
                <span className="inline-flex items-center justify-end">
                  Days
                  <SortIcon column="days_in_stage" />
                </span>
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
                Team
              </TableHead>
              <TableHead className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
                Next Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No loans found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => {
                const days = getDaysInStage(row.stage_updated_at);
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleRowClick(row)}
                  >
                    {/* Property */}
                    <TableCell className="py-3">
                      <div>
                        <div className="flex items-center gap-1">
                          {row.priority === "hot" && (
                            <Flame className="h-3 w-3 text-[#D42620] dark:text-[#EF4444] flex-shrink-0" />
                          )}
                          {row.priority === "on_hold" && (
                            <Pause className="h-3 w-3 text-[#CC7A00] dark:text-[#F0A030] flex-shrink-0" />
                          )}
                          <p className="font-medium text-foreground text-[13px] truncate max-w-[220px]">
                            {row.property_address ?? "--"}
                          </p>
                        </div>
                        {(row.property_city || row.property_state) && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {[row.property_city, row.property_state]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Borrower */}
                    <TableCell className="py-3 text-[13px]">
                      {row.borrower_name}
                    </TableCell>

                    {/* Type */}
                    <TableCell className="py-3 text-[11px] uppercase tracking-[0.05em] text-muted-foreground">
                      {formatLoanType(row.loan_type)}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="py-3 text-right num text-[13px] font-medium">
                      {formatCurrency(row.loan_amount)}
                    </TableCell>

                    {/* Stage */}
                    <TableCell className="py-3">
                      <StagePill stage={row.stage} />
                    </TableCell>

                    {/* Days in Stage */}
                    <TableCell className="py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium num ${getDaysInStageColor(days)}`}
                      >
                        <Clock className="h-3 w-3" strokeWidth={1.5} />
                        {days}d
                      </span>
                    </TableCell>

                    {/* Team */}
                    <TableCell className="py-3">
                      <div className="text-[12px]">
                        {row.originator_name && (
                          <p className="text-muted-foreground">
                            {row.originator_name}
                          </p>
                        )}
                        {row.processor_name && (
                          <p className="text-muted-foreground">
                            {row.processor_name}
                          </p>
                        )}
                        {!row.originator_name && !row.processor_name && (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Next Action */}
                    <TableCell className="py-3">
                      {row.next_action ? (
                        <span className="text-[12px] text-[#CC7A00] dark:text-[#F0A030] line-clamp-1">
                          {row.next_action}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">
                          --
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Loan Detail Drawer */}
      <LoanDetailDrawer
        loan={selectedLoan}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
