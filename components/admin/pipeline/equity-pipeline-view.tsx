"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EquityKanbanBoard } from "./equity-kanban-board";
import {
  Building2,
  DollarSign,
  TrendingUp,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import type { EquityDealRow } from "./equity-kanban-board";
import type { StageConfig } from "./unified-pipeline";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface EquityPipelineViewProps {
  stageConfigs: StageConfig[];
  equityDeals: EquityDealRow[];
  teamMembers: { id: string; full_name: string }[];
}

export function EquityPipelineView({
  stageConfigs,
  equityDeals,
  teamMembers,
}: EquityPipelineViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [view, setView] = useState<"board" | "list">("board");

  // Stats
  const equityTerminalStages = ["dead"];
  const activeEquityDeals = equityDeals.filter(
    (d) => !equityTerminalStages.includes(d.stage)
  );
  const equityCount = activeEquityDeals.length;
  const equityVolume = activeEquityDeals.reduce(
    (sum, d) => sum + (d.purchase_price || d.offer_price || d.asking_price || 0),
    0
  );
  const underContractPlus = activeEquityDeals.filter((d) =>
    ["under_contract", "closing", "closed"].includes(d.stage)
  ).length;

  // Filtering
  const filteredEquityDeals = useMemo(() => {
    let result = equityDeals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          (d.deal_name ?? "").toLowerCase().includes(q) ||
          (d.property_address ?? "").toLowerCase().includes(q) ||
          (d.deal_number ?? "").toLowerCase().includes(q)
      );
    }
    if (assignedFilter !== "all") {
      result = result.filter((d) => d.assigned_to_name === assignedFilter);
    }
    return result;
  }, [equityDeals, searchQuery, assignedFilter]);

  const equityStageConfigs = stageConfigs.filter((s) => s.pipeline_type === "equity");

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 border rounded-md p-0.5">
          <button
            onClick={() => setView("board")}
            className={cn(
              "p-1.5 rounded-sm transition-colors",
              view === "board"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Board view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn(
              "p-1.5 rounded-sm transition-colors",
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Active Deals"
          value={equityCount}
          icon={<Building2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Total Volume"
          value={`$${(equityVolume / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="Under Contract+"
          value={underContractPlus}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by name, address, or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Assigned To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {teamMembers.map((m) => (
              <SelectItem key={m.id} value={m.full_name}>
                {m.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline Board */}
      <EquityKanbanBoard
        stageConfigs={equityStageConfigs}
        deals={filteredEquityDeals}
        view={view}
      />
    </div>
  );
}
