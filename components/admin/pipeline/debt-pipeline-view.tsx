"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/shared/kpi-card";
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
  Briefcase,
  DollarSign,
  Target,
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

  // Stats
  const debtTerminalStages = ["closed_lost", "withdrawn", "denied"];
  const activeOpportunities = opportunities.filter(
    (o) => !debtTerminalStages.includes(o.stage)
  );
  const loanTerminalStages = [
    "servicing", "payoff", "default", "reo", "paid_off",
    "closed_lost", "withdrawn", "denied",
  ];
  const activeLoans = loans.filter(
    (l) => !loanTerminalStages.includes(l.stage)
  );
  const debtCount = activeOpportunities.length + activeLoans.length;
  const debtVolume =
    activeOpportunities.reduce((sum, o) => sum + (o.proposed_loan_amount || 0), 0) +
    activeLoans.reduce((sum, l) => sum + (l.loan_amount || 0), 0);

  const uwPlusStages = [
    "uw", "uw_needs_approval", "offer_placed",
    "processing", "underwriting", "approved", "clear_to_close",
  ];
  const inUwPlus =
    activeOpportunities.filter((o) => uwPlusStages.includes(o.stage)).length +
    activeLoans.filter((l) => uwPlusStages.includes(l.stage)).length;

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
      {/* View Toggle + New Deal */}
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
          value={debtCount}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <KpiCard
          title="Pipeline Volume"
          value={`$${(debtVolume / 1000000).toFixed(1)}M`}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KpiCard
          title="In Underwriting+"
          value={inUwPlus}
          icon={<Target className="h-5 w-5" />}
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
      <DebtKanban
        stageConfigs={debtStageConfigs}
        opportunities={filteredOpportunities}
        loans={filteredLoans}
        view={view}
      />
    </div>
  );
}
