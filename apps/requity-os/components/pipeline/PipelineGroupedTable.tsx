"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  type UnifiedDeal,
  type StageConfig,
  type UnifiedStage,
  PIPELINE_STAGE_GROUPS,
  PIPELINE_LIFECYCLE_STAGE_GROUPS,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
  getAlertLevel,
} from "./pipeline-types";
import { formatCompactCurrency } from "@/lib/format";
import { getDealDisplayConfig } from "@/lib/pipeline/deal-display-config";

// ─── Helpers ───

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

// ─── Types ───

interface PipelineGroupedTableProps {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  onDealClick: (deal: UnifiedDeal) => void;
  showLossReason?: boolean;
  teamMembers: { id: string; full_name: string }[];
  lifecycleView?: boolean;
}

// ─── Component ───

export function PipelineGroupedTable({
  deals,
  stageConfigs,
  onDealClick,
  showLossReason,
  teamMembers,
  lifecycleView = false,
}: PipelineGroupedTableProps) {
  const router = useRouter();
  const stageConfigMap = useMemo(
    () => new Map(stageConfigs.map((sc) => [sc.stage, sc])),
    [stageConfigs]
  );
  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of teamMembers) map.set(m.id, m.full_name);
    return map;
  }, [teamMembers]);

  const stageGroups = lifecycleView ? PIPELINE_LIFECYCLE_STAGE_GROUPS : PIPELINE_STAGE_GROUPS;

  // Group deals by stage
  const groupedDeals = useMemo(() => {
    const map = new Map<UnifiedStage, UnifiedDeal[]>();
    for (const group of stageGroups) {
      map.set(group.key, []);
    }
    for (const deal of deals) {
      if (!lifecycleView && deal.stage === "closed") {
        // In default view, "closed" stage rolls up into the "closed" group
        const arr = map.get("closed");
        if (arr) arr.push(deal);
      } else if (!lifecycleView && deal.stage.startsWith("closed_") && deal.stage !== "closed_lost") {
        // In default view, all closed_* stages roll up into the "closed" group
        const arr = map.get("closed");
        if (arr) arr.push(deal);
      } else {
        const arr = map.get(deal.stage);
        if (arr) arr.push(deal);
      }
    }
    // Sort each group by amount descending
    for (const arr of map.values()) {
      arr.sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity));
    }
    return map;
  }, [deals, stageGroups, lifecycleView]);

  // Collapsed state — tracks user-toggled groups; empty groups auto-collapse
  const [collapsed, setCollapsed] = useState<Set<UnifiedStage>>(new Set());
  const effectiveCollapsed = useMemo(() => {
    const set = new Set(collapsed);
    for (const group of stageGroups) {
      const arr = groupedDeals.get(group.key);
      if (!arr || arr.length === 0) set.add(group.key);
    }
    return set;
  }, [collapsed, stageGroups, groupedDeals]);

  const toggleGroup = useCallback((key: UnifiedStage) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Summary stats
  const totalCount = deals.length;
  const totalAmount = useMemo(
    () => deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
    [deals]
  );

  const colCount = showLossReason ? 7 : 6;

  if (deals.length === 0 && !showLossReason) {
    return <EmptyState title="No deals found" description="Try adjusting your filters or create a new deal." />;
  }

  return (
    <div className="rounded-md border overflow-hidden mobile-scroll">
      <table className="w-full border-collapse text-sm">
        {/* Column header */}
        <thead className="sticky top-0 z-10 bg-background">
          <tr className="border-b border-border">
            <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[40%]">Deal</th>
            <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[120px]">Type</th>
            <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[140px] hidden lg:table-cell">Asset</th>
            <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[130px]">Amount</th>
            <th className="text-center font-medium text-muted-foreground px-3 py-2.5 w-[100px] hidden md:table-cell">Assignee</th>
            {showLossReason && (
              <th className="text-left font-medium text-muted-foreground px-3 py-2.5 max-w-[200px]">Loss Reason</th>
            )}
            <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[70px] hidden sm:table-cell">Days</th>
          </tr>
        </thead>

        <tbody>
          {/* Summary stats row */}
          <tr className="bg-muted/40 border-b border-border">
            <td colSpan={showLossReason ? 4 : 3} className="px-4 py-2 text-xs font-semibold text-muted-foreground">
              Total: {totalCount} deal{totalCount !== 1 ? "s" : ""}
            </td>
            <td className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground num">
              {formatCompactCurrency(totalAmount)}
            </td>
            <td colSpan={showLossReason ? 2 : 1} className="hidden md:table-cell" />
            <td className="hidden sm:table-cell" />
          </tr>

          {/* Stage groups */}
          {stageGroups.map((group) => {
            const groupDeals = groupedDeals.get(group.key) ?? [];
            const isCollapsed = effectiveCollapsed.has(group.key);
            const groupTotal = groupDeals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

            return (
              <StageGroupRows
                key={group.key}
                group={group}
                deals={groupDeals}
                isCollapsed={isCollapsed}
                groupTotal={groupTotal}
                colCount={colCount}
                showLossReason={showLossReason}
                stageConfigMap={stageConfigMap}
                assigneeMap={assigneeMap}
                onToggle={() => toggleGroup(group.key)}
                onDealClick={onDealClick}
                onDealHover={(deal) =>
                  router.prefetch(`/pipeline/${deal.deal_number || deal.id}`)
                }
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Stage Group Rows ───

interface StageGroupRowsProps {
  group: (typeof PIPELINE_STAGE_GROUPS)[number];
  deals: UnifiedDeal[];
  isCollapsed: boolean;
  groupTotal: number;
  colCount: number;
  showLossReason?: boolean;
  stageConfigMap: Map<UnifiedStage, StageConfig>;
  assigneeMap: Map<string, string>;
  onToggle: () => void;
  onDealClick: (deal: UnifiedDeal) => void;
  onDealHover: (deal: UnifiedDeal) => void;
}

function StageGroupRows({
  group,
  deals,
  isCollapsed,
  groupTotal,
  colCount,
  showLossReason,
  stageConfigMap,
  assigneeMap,
  onToggle,
  onDealClick,
  onDealHover,
}: StageGroupRowsProps) {
  return (
    <>
      {/* Group header */}
      <tr
        className="cursor-pointer select-none border-b border-border hover:bg-muted/30 rq-transition"
        onClick={onToggle}
        style={{
          backgroundColor: `${group.color}08`,
        }}
      >
        <td colSpan={showLossReason ? 4 : 3} className="px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-1 h-5 rounded-full shrink-0"
              style={{ backgroundColor: group.color }}
            />
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs font-semibold text-foreground">
              {group.label}
            </span>
            <span className="text-xs text-muted-foreground">
              ({deals.length})
            </span>
          </div>
        </td>
        <td className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground num">
          {formatCompactCurrency(groupTotal)}
        </td>
        <td className="hidden md:table-cell" />
        {showLossReason && <td />}
        <td className="hidden sm:table-cell" />
      </tr>

      {/* Deal rows */}
      {!isCollapsed &&
        deals.map((deal, idx) => (
          <DealRow
            key={deal.id}
            deal={deal}
            isEven={idx % 2 === 0}
            showLossReason={showLossReason}
            stageConfigMap={stageConfigMap}
            assigneeMap={assigneeMap}
            onClick={() => onDealClick(deal)}
            onHover={() => onDealHover(deal)}
          />
        ))}
    </>
  );
}

// ─── Deal Row ───

interface DealRowProps {
  deal: UnifiedDeal;
  isEven: boolean;
  showLossReason?: boolean;
  stageConfigMap: Map<UnifiedStage, StageConfig>;
  assigneeMap: Map<string, string>;
  onClick: () => void;
  onHover: () => void;
}

function DealRow({
  deal,
  isEven,
  showLossReason,
  stageConfigMap,
  assigneeMap,
  onClick,
  onHover,
}: DealRowProps) {
  const dealConfig = getDealDisplayConfig(deal);
  const days = daysInStage(deal.stage_entered_at);
  const alertLevel = getAlertLevel(days, stageConfigMap.get(deal.stage));
  const assigneeName = deal.assigned_to
    ? assigneeMap.get(deal.assigned_to) ?? null
    : null;

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border/50 rq-transition",
        isEven ? "bg-background" : "bg-muted/20",
        "hover:bg-muted/50"
      )}
      onClick={onClick}
      onPointerEnter={onHover}
    >
      {/* Deal name + number */}
      <td className="px-4 py-2.5">
        <div>
          <p className="font-medium text-sm text-foreground">{deal.name}</p>
          {deal.deal_number && (
            <p className="text-xs text-muted-foreground num">
              {deal.deal_number}
            </p>
          )}
        </div>
      </td>

      {/* Type badge */}
      <td className="px-3 py-2.5">
        <Badge
          variant="outline"
          className={cn("text-[10px]", CAPITAL_SIDE_COLORS[deal.capital_side])}
        >
          {dealConfig.shortLabel}
        </Badge>
      </td>

      {/* Asset class */}
      <td className="px-3 py-2.5 text-sm text-muted-foreground hidden lg:table-cell">
        {deal.asset_class
          ? ASSET_CLASS_LABELS[deal.asset_class as AssetClass]
          : "—"}
      </td>

      {/* Amount */}
      <td className="text-right px-3 py-2.5 text-sm font-medium num">
        {formatCurrency(deal.amount)}
      </td>

      {/* Assignee */}
      <td className="px-3 py-2.5 hidden md:table-cell">
        {assigneeName && (
          <div className="flex items-center justify-center">
            <div
              className="w-[24px] h-[24px] rounded-full bg-accent border border-border flex items-center justify-center text-[9px] font-semibold text-muted-foreground shrink-0"
              title={assigneeName}
            >
              {getInitials(assigneeName)}
            </div>
          </div>
        )}
      </td>

      {/* Loss reason */}
      {showLossReason && (
        <td className="px-3 py-2.5 max-w-[200px]">
          <span className="text-xs text-muted-foreground line-clamp-2">
            {deal.loss_reason || "—"}
          </span>
        </td>
      )}

      {/* Days in stage */}
      <td
        className={cn(
          "text-right px-3 py-2.5 text-sm num hidden sm:table-cell",
          alertLevel === "alert" && "text-[#B23225] font-medium",
          alertLevel === "warn" && "text-[#B8822A]"
        )}
      >
        {days}d
      </td>
    </tr>
  );
}
