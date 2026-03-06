"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Search,
  LayoutGrid,
  List,
  Plus,
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
      {/* Toolbar: View Toggle + Search + Filter + New Deal */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by name, address, or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={assignedFilter} onValueChange={setAssignedFilter}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
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
        <div className="flex-1" />
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
        <Link href="/admin/pipeline/equity/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </Link>
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
