"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  EQUITY_STAGE_LABELS,
  EQUITY_STAGE_COLORS,
  EQUITY_DEAL_STAGES,
} from "@/lib/constants";
import { Search, ArrowUpDown } from "lucide-react";
import type { EquityDealRow } from "./equity-kanban";

interface EquityListViewProps {
  data: EquityDealRow[];
}

type SortField =
  | "deal_name"
  | "stage"
  | "price"
  | "days_in_stage"
  | "created_at"
  | "target_irr";
type SortDir = "asc" | "desc";

export function EquityListView({ data }: EquityListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function getDisplayPrice(deal: EquityDealRow): number | null {
    return deal.purchase_price || deal.offer_price || deal.asking_price;
  }

  const filtered = useMemo(() => {
    let result = data;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.deal_name?.toLowerCase().includes(q) ||
          d.deal_number?.toLowerCase().includes(q) ||
          d.property_address?.toLowerCase().includes(q) ||
          d.property_city?.toLowerCase().includes(q) ||
          d.asset_type?.toLowerCase().includes(q)
      );
    }

    if (stageFilter !== "all") {
      result = result.filter((d) => d.stage === stageFilter);
    }

    result = [...result].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "deal_name":
          return (
            dir * (a.deal_name || "").localeCompare(b.deal_name || "")
          );
        case "stage":
          return (
            dir *
            EQUITY_DEAL_STAGES.indexOf(a.stage as any) -
            EQUITY_DEAL_STAGES.indexOf(b.stage as any)
          );
        case "price":
          return dir * ((getDisplayPrice(a) || 0) - (getDisplayPrice(b) || 0));
        case "days_in_stage":
          return dir * ((a.days_in_stage || 0) - (b.days_in_stage || 0));
        case "target_irr":
          return dir * ((a.target_irr || 0) - (b.target_irr || 0));
        case "created_at":
          return (
            dir *
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime())
          );
        default:
          return 0;
      }
    });

    return result;
  }, [data, search, stageFilter, sortField, sortDir]);

  function SortHeader({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) {
    return (
      <TableHead
        className="cursor-pointer select-none"
        onClick={() => toggleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableHead>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
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
            {EQUITY_DEAL_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {EQUITY_STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader field="deal_name">Deal</SortHeader>
              <SortHeader field="stage">Stage</SortHeader>
              <TableHead>Property</TableHead>
              <TableHead>Asset Type</TableHead>
              <SortHeader field="price">Price</SortHeader>
              <SortHeader field="target_irr">Target IRR</SortHeader>
              <TableHead>UW Metrics</TableHead>
              <SortHeader field="days_in_stage">Days</SortHeader>
              <TableHead>Tasks</TableHead>
              <TableHead>Assigned</TableHead>
              <SortHeader field="created_at">Created</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center text-muted-foreground py-8"
                >
                  No deals found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((deal) => {
              const price = getDisplayPrice(deal);
              const days = Math.floor(deal.days_in_stage || 0);

              return (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    router.push(`/admin/pipeline/equity/${deal.id}`)
                  }
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {deal.deal_name || "Untitled"}
                      </p>
                      {deal.deal_number && (
                        <p className="text-xs text-muted-foreground">
                          {deal.deal_number}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        EQUITY_STAGE_COLORS[deal.stage] || ""
                      }
                    >
                      {EQUITY_STAGE_LABELS[deal.stage] || deal.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {deal.property_address && (
                        <p className="truncate max-w-[200px]">
                          {deal.property_address}
                        </p>
                      )}
                      {deal.property_city && (
                        <p className="text-xs text-muted-foreground">
                          {deal.property_city}
                          {deal.property_state
                            ? `, ${deal.property_state}`
                            : ""}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {deal.asset_type || "—"}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {price ? formatCurrency(price) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {deal.target_irr ? `${deal.target_irr}%` : "—"}
                  </TableCell>
                  <TableCell>
                    {deal.levered_irr || deal.equity_multiple ? (
                      <div className="text-xs space-y-0.5">
                        {deal.levered_irr && (
                          <p>
                            IRR:{" "}
                            <span className="font-medium">
                              {deal.levered_irr}%
                            </span>
                          </p>
                        )}
                        {deal.equity_multiple && (
                          <p>
                            EM:{" "}
                            <span className="font-medium">
                              {deal.equity_multiple}x
                            </span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded ${
                        days <= 7
                          ? "bg-green-50 text-green-700"
                          : days <= 21
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {days}d
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {deal.total_tasks && deal.total_tasks > 0
                      ? `${deal.completed_tasks ?? 0}/${deal.total_tasks}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[120px]">
                    {deal.assigned_to_name || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(deal.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
