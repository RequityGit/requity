"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
  APPROVAL_STATUS_COLORS,
  LOAN_DB_TYPES,
} from "@/lib/constants";
import { Search, ArrowUpDown } from "lucide-react";
import type { OpportunityRow } from "./opportunity-kanban";

interface OpportunityListViewProps {
  data: OpportunityRow[];
}

type SortField =
  | "deal_name"
  | "proposed_loan_amount"
  | "stage"
  | "created_at"
  | "stage_changed_at";

export function OpportunityListView({ data }: OpportunityListViewProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  const filtered = useMemo(() => {
    let result = data;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.deal_name?.toLowerCase().includes(q) ||
          o.property_address?.toLowerCase().includes(q) ||
          o.borrower_name?.toLowerCase().includes(q) ||
          o.entity_name?.toLowerCase().includes(q)
      );
    }

    if (stageFilter !== "all") {
      result = result.filter((o) => o.stage === stageFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((o) => o.loan_type === typeFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, search, stageFilter, typeFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function formatLoanType(type: string | null): string {
    if (!type) return "—";
    const found = LOAN_DB_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(OPPORTUNITY_STAGE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LOAN_DB_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => toggleSort("deal_name")}
                >
                  Deal <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                </Button>
              </TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => toggleSort("proposed_loan_amount")}
                >
                  Amount <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                </Button>
              </TableHead>
              <TableHead>LTV</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold"
                  onClick={() => toggleSort("created_at")}
                >
                  Created <ArrowUpDown className="ml-1 h-3 w-3 inline" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  No deals found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((opp) => (
                <TableRow
                  key={opp.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() =>
                    router.push(`/admin/originations/${opp.id}`)
                  }
                >
                  <TableCell className="font-medium">
                    <div>
                      <p className="text-sm truncate max-w-[200px]">
                        {opp.deal_name || opp.property_address || "Untitled"}
                      </p>
                      {opp.property_city && opp.property_state && (
                        <p className="text-xs text-muted-foreground">
                          {opp.property_city}, {opp.property_state}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${OPPORTUNITY_STAGE_COLORS[opp.stage] || ""}`}
                    >
                      {OPPORTUNITY_STAGE_LABELS[opp.stage] || opp.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatLoanType(opp.loan_type)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(opp.proposed_loan_amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {opp.proposed_ltv ? `${opp.proposed_ltv}%` : "—"}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">
                    {opp.borrower_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[150px]">
                    {opp.entity_name || "—"}
                  </TableCell>
                  <TableCell>
                    {opp.approval_status &&
                      opp.approval_status !== "not_required" && (
                        <Badge
                          className={`text-xs ${APPROVAL_STATUS_COLORS[opp.approval_status] || ""}`}
                        >
                          {opp.approval_status
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(opp.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {data.length} deals
      </p>
    </div>
  );
}
