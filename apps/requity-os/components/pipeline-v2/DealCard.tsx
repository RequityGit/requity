"use client";

import { cn } from "@/lib/utils";
import { Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDraggable } from "@dnd-kit/core";
import {
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  CARD_TYPE_SHORT_LABELS,
  CAPITAL_SIDE_COLORS,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
  getAlertLevel,
  getCardMetricValue,
} from "./pipeline-types";

interface DealCardProps {
  deal: UnifiedDeal;
  cardType: UnifiedCardType;
  stageConfig?: StageConfig;
  hasRelationships?: boolean;
  onClick: () => void;
}

export function DealCard({
  deal,
  cardType,
  stageConfig,
  hasRelationships,
  onClick,
}: DealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });

  const days = daysInStage(deal.stage_entered_at);
  const alertLevel = getAlertLevel(days, stageConfig);

  const metricsString = cardType.card_metrics
    .map((m) => {
      const val = getCardMetricValue(m, deal, cardType);
      if (val === "--") return null;
      return m.label ? `${m.label} ${val}` : val;
    })
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "w-full text-left rounded-lg border bg-card p-3 space-y-2",
        "hover:border-foreground/20 hover:shadow-sm transition-all cursor-grab",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-50"
      )}
    >
      {/* Row 1: Name + card type badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight line-clamp-2">
          {deal.name}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] px-1.5 py-0",
            CAPITAL_SIDE_COLORS[deal.capital_side]
          )}
        >
          {CARD_TYPE_SHORT_LABELS[cardType.slug] ?? cardType.label}
        </Badge>
      </div>

      {/* Row 2: Asset class */}
      {deal.asset_class && (
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">
            {ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ?? deal.asset_class}
          </span>
        </div>
      )}

      {/* Row 3: Amount */}
      {deal.amount != null && (
        <p className="text-sm font-semibold num">
          {formatCurrency(deal.amount)}
        </p>
      )}

      {/* Row 4: Card metrics subtitle */}
      {metricsString && (
        <p className="text-xs text-muted-foreground num">{metricsString}</p>
      )}

      {/* Row 5: Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
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

/** Static card clone for DragOverlay — no hooks, no interactivity */
export function DealCardOverlay({
  deal,
  cardType,
  stageConfig,
  hasRelationships,
}: Omit<DealCardProps, "onClick">) {
  const days = daysInStage(deal.stage_entered_at);
  const alertLevel = getAlertLevel(days, stageConfig);

  const metricsString = cardType.card_metrics
    .map((m) => {
      const val = getCardMetricValue(m, deal, cardType);
      if (val === "--") return null;
      return m.label ? `${m.label} ${val}` : val;
    })
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "w-72 text-left rounded-lg border bg-card p-3 space-y-2 shadow-lg",
        "ring-2 ring-primary/50 cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight line-clamp-2">
          {deal.name}
        </span>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] px-1.5 py-0",
            CAPITAL_SIDE_COLORS[deal.capital_side]
          )}
        >
          {CARD_TYPE_SHORT_LABELS[cardType.slug] ?? cardType.label}
        </Badge>
      </div>
      {deal.asset_class && (
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">
            {ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ?? deal.asset_class}
          </span>
        </div>
      )}
      {deal.amount != null && (
        <p className="text-sm font-semibold num">{formatCurrency(deal.amount)}</p>
      )}
      {metricsString && (
        <p className="text-xs text-muted-foreground num">{metricsString}</p>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
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
