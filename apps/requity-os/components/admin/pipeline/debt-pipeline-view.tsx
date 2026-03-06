"use client";

import { useState, useMemo } from "react";
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
import { DebtKanban } from "./debt-kanban";
import Link from "next/link";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import type { OpportunityRow } from "./debt-kanban";
import type { StageConfig, LoanRow } from "./unified-pipeline";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DebtPipelineViewProps {
  stageConfigs: StageConfig[];
  opportunities: OpportunityRow[];
  loans: LoanRow[];
  teamMembers: { id: string; full_name: string }[];
}

export function DebtPipelineView({
  stageConfigs,
  opportunities,
  loans,
  teamMembers,
}: DebtPipelineViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [view, setView] = useState<"board" | "list">("board");

  // Filtering
  const filteredOpportunities = useMemo(() => {
    let result = opportunities;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          (o.deal_name ?? "").toLowerCase().includes(q) ||
          (o.property_address ?? "").toLowerCase().includes(q) ||
          (o.borrower_name ?? "").toLowerCase().includes(q)
      );
    }
    if (assignedFilter !== "all") {
      result = result.filter((o) => o.originator_name === assignedFilter);
    }
    return result;
  }, [opportunities, searchQuery, assignedFilter]);

  const filteredLoans = useMemo(() => {
    let result = loans;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          (l.borrower_name ?? "").toLowerCase().includes(q) ||
          (l.property_address ?? "").toLowerCase().includes(q) ||
          (l.loan_number ?? "").toLowerCase().includes(q)
      );
    }
    if (assignedFilter !== "all") {
      result = result.filter((l) => l.originator_name === assignedFilter);
    }
    return result;
  }, [loans, searchQuery, assignedFilter]);

  const debtStageConfigs = stageConfigs.filter((s) => s.pipeline_type === "debt");

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
        <Link href="/admin/originations/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </div>

      {/* Pipeline Board */}
      <DebtKanban
        stageConfigs={debtStageConfigs}
        opportunities={filteredOpportunities}
        loans={filteredLoans}
        view={view}
      />
    </div>
  );
}
