"use client";

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDraggable } from "@dnd-kit/core";
import {
  type UnifiedDeal,
  type StageConfig,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
  getAlertLevel,
  getCardMetricValue,
} from "./pipeline-types";
import { getDealDisplayConfig } from "@/lib/pipeline/deal-display-config";

interface DealCardProps {
  deal: UnifiedDeal;
  stageConfig?: StageConfig;
  hasRelationships?: boolean;
  formulaMap?: Map<string, string>;
  onClick: () => void;
}

function DealCardInner({
  deal,
  stageConfig,
  hasRelationships,
  formulaMap,
  onClick,
}: DealCardProps) {
  const router = useRouter();
  const dealHref = `/pipeline/${deal.deal_number || deal.id}`;
  const prefetchDeal = useCallback(() => {
    router.prefetch(dealHref);
  }, [router, dealHref]);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });

  // Derive display config from deal data (no DB lookup)
  const dealConfig = useMemo(() => getDealDisplayConfig(deal), [deal.asset_class, deal.capital_side, deal.uw_data]);

  // Memoize expensive computations
  const { days, alertLevel, displayMetrics } = useMemo(() => {
    const d = daysInStage(deal.stage_entered_at);
    const al = getAlertLevel(d, stageConfig);
    const metrics = dealConfig.cardMetrics
      .map((m) => {
        const val = getCardMetricValue(m, deal, formulaMap);
        return m.label ? `${m.label} ${val}` : val;
      })
      .join(" · ");
    return { days: d, alertLevel: al, displayMetrics: metrics };
  }, [deal.stage_entered_at, deal, stageConfig, dealConfig.cardMetrics, formulaMap]);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerEnter={prefetchDeal}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "w-full h-[130px] text-left rounded-lg border bg-card p-3 flex flex-col",
        "hover:border-foreground/20 hover:shadow-sm transition-all cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-50"
      )}
    >
      {/* Row 1: Name + deal type badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight line-clamp-1">
          {deal.name}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] px-1.5 py-0",
            CAPITAL_SIDE_COLORS[deal.capital_side]
          )}
        >
          {dealConfig.shortLabel}
        </Badge>
      </div>

      {/* Row 2: Asset class */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        <span className="text-xs text-muted-foreground">
          {deal.asset_class
            ? (ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ?? deal.asset_class)
            : "--"}
        </span>
      </div>

      {/* Row 3: Amount */}
      <p className={cn("text-sm font-semibold num mt-1", deal.amount == null && "text-muted-foreground/50")}>
        {formatCurrency(deal.amount)}
      </p>

      {/* Row 4: Card metrics */}
      <p className="text-xs text-muted-foreground num mt-0.5 truncate">
        {displayMetrics || "\u00A0"}
      </p>

      {/* Row 5: Footer -- pushed to bottom */}
      <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-border/50">
        <div className="flex items-center gap-2">
          {hasRelationships && (
            <Link2 className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span
          className={cn(
            "text-[11px] num",
            alertLevel === "alert" && "text-[#B23225] font-medium",
            alertLevel === "warn" && "text-[#B8822A]",
            alertLevel === "normal" && "text-muted-foreground"
          )}
        >
          {days}d
        </span>
      </div>
    </div>
  );
}

// Memoized wrapper to prevent unnecessary re-renders
export const DealCard = React.memo(DealCardInner, (prev, next) => {
  return (
    prev.deal.id === next.deal.id &&
    prev.deal.stage === next.deal.stage &&
    prev.deal.stage_entered_at === next.deal.stage_entered_at &&
    prev.deal.name === next.deal.name &&
    prev.deal.amount === next.deal.amount &&
    prev.deal.asset_class === next.deal.asset_class &&
    prev.deal.capital_side === next.deal.capital_side &&
    prev.stageConfig?.stage === next.stageConfig?.stage &&
    prev.hasRelationships === next.hasRelationships &&
    prev.formulaMap === next.formulaMap
  );
});

/** Static card clone for DragOverlay -- no hooks, no interactivity */
export function DealCardOverlay({
  deal,
  stageConfig,
  hasRelationships,
  formulaMap,
}: Omit<DealCardProps, "onClick">) {
  const days = daysInStage(deal.stage_entered_at);
  const alertLevel = getAlertLevel(days, stageConfig);
  const dealConfig = getDealDisplayConfig(deal);

  const displayMetrics = dealConfig.cardMetrics
    .map((m) => {
      const val = getCardMetricValue(m, deal, formulaMap);
      return m.label ? `${m.label} ${val}` : val;
    })
    .join(" · ");

  return (
    <div
      className={cn(
        "w-72 h-[130px] text-left rounded-lg border bg-card p-3 flex flex-col shadow-lg",
        "ring-2 ring-primary/50 cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight line-clamp-1">
          {deal.name}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] px-1.5 py-0",
            CAPITAL_SIDE_COLORS[deal.capital_side]
          )}
        >
          {dealConfig.shortLabel}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        <span className="text-xs text-muted-foreground">
          {deal.asset_class
            ? (ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ?? deal.asset_class)
            : "--"}
        </span>
      </div>
      <p className={cn("text-sm font-semibold num mt-1", deal.amount == null && "text-muted-foreground/50")}>
        {formatCurrency(deal.amount)}
      </p>
      <p className="text-xs text-muted-foreground num mt-0.5 truncate">
        {displayMetrics || "\u00A0"}
      </p>
      <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-border/50">
        <div className="flex items-center gap-2">
          {hasRelationships && (
            <Link2 className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <span
          className={cn(
            "text-[11px] num",
            alertLevel === "alert" && "text-[#B23225] font-medium",
            alertLevel === "warn" && "text-[#B8822A]",
            alertLevel === "normal" && "text-muted-foreground"
          )}
        >
          {days}d
        </span>
      </div>
    </div>
  );
}
