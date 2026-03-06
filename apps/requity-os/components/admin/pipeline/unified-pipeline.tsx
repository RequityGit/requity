"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
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
import { EquityKanbanBoard } from "./equity-kanban-board";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  DollarSign,
  Target,
  TrendingUp,
  Plus,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { OpportunityRow } from "./debt-kanban";
import type { EquityDealRow } from "./equity-kanban-board";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface StageConfig {
  id: string;
  pipeline_type: string;
  stage_key: string;
  label: string;
  color: string;
  sort_order: number;
  is_terminal: boolean;
  sla_days: number | null;
}

export interface LoanRow {
  id: string;
  loan_number: string | null;
  borrower_name: string;
  borrower_id: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  loan_type: string | null;
  loan_amount: number | null;
  stage: string;
  stage_updated_at: string | null;
  created_at: string;
  priority: string;
  originator_name: string | null;
  total_conditions: number;
  approved_conditions: number;
}

interface UnifiedPipelineProps {
  stageConfigs: StageConfig[];
  opportunities: OpportunityRow[];
  loans: LoanRow[];
  equityDeals: EquityDealRow[];
  teamMembers: { id: string; full_name: string }[];
}

export function UnifiedPipeline({
  stageConfigs,
  opportunities,
  loans,
  equityDeals,
  teamMembers,
}: UnifiedPipelineProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") === "equity" ? "equity" : "debt";
  const [activeTab, setActiveTab] = useState<"debt" | "equity">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [view, setView] = useState<"board" | "list">("board");

  // ── Tab switching with URL state ──────────────────────────────────

  function switchTab(tab: "debt" | "equity") {
    setActiveTab(tab);
    setSearchQuery("");
    setAssignedFilter("all");
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/admin/pipeline?${params.toString()}`, { scroll: false });
  }

  // ── Debt pipeline stats ───────────────────────────────────────────

  const debtTerminalStages = ["closed_lost", "withdrawn", "denied"];
  const activeOpportunities = opportunities.filter(
    (o) => !debtTerminalStages.includes(o.stage)
  );
  const loanTerminalStages = [
    "servicing",
    "payoff",
    "default",
    "reo",
    "paid_off",
    "closed_lost",
    "withdrawn",
    "denied",
  ];
  const activeLoans = loans.filter(
    (l) => !loanTerminalStages.includes(l.stage)
  );
  const debtCount = activeOpportunities.length + activeLoans.length;

  const debtVolume =
    activeOpportunities.reduce(
      (sum, o) => sum + (o.proposed_loan_amount || 0),
      0
    ) + activeLoans.reduce((sum, l) => sum + (l.loan_amount || 0), 0);

  const uwPlusStages = [
    "uw",
    "uw_needs_approval",
    "offer_placed",
    "processing",
    "underwriting",
    "approved",
    "clear_to_close",
  ];
  const inUwPlus =
    activeOpportunities.filter((o) => uwPlusStages.includes(o.stage)).length +
    activeLoans.filter((l) => uwPlusStages.includes(l.stage)).length;

  // ── Equity pipeline stats ─────────────────────────────────────────

  const equityTerminalStages = ["closed_won", "closed_lost"];
  const activeEquityDeals = equityDeals.filter(
    (d) => !equityTerminalStages.includes(d.stage)
  );
  const equityCount = activeEquityDeals.length;

  const equityVolume = activeEquityDeals.reduce(
    (sum, d) =>
      sum + (d.purchase_price || d.offer_price || d.asking_price || 0),
    0
  );

  const underContractPlus = activeEquityDeals.filter((d) =>
    ["under_contract", "closed_won"].includes(d.stage)
  ).length;

  // ── Filtering ─────────────────────────────────────────────────────

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
      result = result.filter(
        (o) => o.originator_name === assignedFilter
      );
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
      result = result.filter(
        (l) => l.originator_name === assignedFilter
      );
    }
    return result;
  }, [loans, searchQuery, assignedFilter]);

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
      result = result.filter(
        (d) => d.assigned_to_name === assignedFilter
      );
    }
    return result;
  }, [equityDeals, searchQuery, assignedFilter]);

  // ── Stage configs per pipeline type ───────────────────────────────

  const debtStageConfigs = stageConfigs.filter(
    (s) => s.pipeline_type === "debt"
  );
  const equityStageConfigs = stageConfigs.filter(
    (s) => s.pipeline_type === "equity"
  );

  // ── Stats for active tab ──────────────────────────────────────────

  const stats =
    activeTab === "debt"
      ? [
          {
            title: "Active Deals",
            value: debtCount,
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            title: "Pipeline Volume",
            value: `$${(debtVolume / 1000000).toFixed(1)}M`,
            icon: <DollarSign className="h-5 w-5" />,
          },
          {
            title: "In Underwriting+",
            value: inUwPlus,
            icon: <Target className="h-5 w-5" />,
          },
        ]
      : [
          {
            title: "Active Deals",
            value: equityCount,
            icon: <Building2 className="h-5 w-5" />,
          },
          {
            title: "Total Volume",
            value: `$${(equityVolume / 1000000).toFixed(1)}M`,
            icon: <DollarSign className="h-5 w-5" />,
          },
          {
            title: "Under Contract+",
            value: underContractPlus,
            icon: <TrendingUp className="h-5 w-5" />,
          },
        ];

  return (
    <div className="space-y-6">
      {/* Page Header with Toggle and New Deal */}
      <PageHeader
        title="Pipeline"
        description="Track and manage deals from new deals through close."
        action={
          <Link
            href={
              activeTab === "debt"
                ? "/admin/originations/new"
                : "/admin/pipeline?tab=equity&new=1"
            }
          >
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </Link>
        }
      />

      {/* Debt / Equity Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="inline-flex items-center rounded-lg border bg-card p-1">
          <button
            onClick={() => switchTab("debt")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "debt"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Briefcase className="h-4 w-4" />
            Debt
            <span
              className={cn(
                "num text-xs px-1.5 py-0.5 rounded-md",
                activeTab === "debt"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {debtCount}
            </span>
          </button>
          <button
            onClick={() => switchTab("equity")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "equity"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Building2 className="h-4 w-4" />
            Equity
            <span
              className={cn(
                "num text-xs px-1.5 py-0.5 rounded-md",
                activeTab === "equity"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {equityCount}
            </span>
          </button>
        </div>

        {/* View Toggle */}
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
        {stats.map((stat) => (
          <KpiCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
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
      {activeTab === "debt" ? (
        <DebtKanban
          stageConfigs={debtStageConfigs}
          opportunities={filteredOpportunities}
          loans={filteredLoans}
          view={view}
        />
      ) : (
        <EquityKanbanBoard
          stageConfigs={equityStageConfigs}
          deals={filteredEquityDeals}
          view={view}
        />
      )}
    </div>
  );
}
