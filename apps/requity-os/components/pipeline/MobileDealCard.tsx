"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import {
  type UnifiedDeal,
  type StageConfig,
  ASSET_CLASS_LABELS,
  type AssetClass,
  formatCurrency,
  daysInStage,
  getAlertLevel,
} from "./pipeline-types";
import {
  getPropertyName,
  getDealAddress,
  getLoanTypeLabel,
} from "./DealCard";
import { isCommercialAssetClass } from "@/lib/pipeline/deal-display-config";

interface MobileDealCardProps {
  deal: UnifiedDeal;
  stageConfig?: StageConfig;
  onClick: () => void;
}

function MobileDealCardInner({ deal, stageConfig, onClick }: MobileDealCardProps) {
  const isEquity = deal.capital_side === "equity";
  const isCommercial = isCommercialAssetClass(deal.asset_class);
  const propertyName = getPropertyName(deal) || deal.name;
  const address = getDealAddress(deal);
  const loanType = getLoanTypeLabel(deal);

  const borrowerName = deal.primary_contact
    ? `${deal.primary_contact.first_name} ${deal.primary_contact.last_name}`
    : null;

  const assetLabel = deal.asset_class
    ? (ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ?? deal.asset_class)
    : null;

  const { days, alertLevel } = useMemo(() => {
    const d = daysInStage(deal.stage_entered_at);
    const al = getAlertLevel(d, stageConfig);
    return { days: d, alertLevel: al };
  }, [deal.stage_entered_at, stageConfig]);

  // For residential deals without a named property, show address as primary line
  const primaryLine = isCommercial ? propertyName : (address || propertyName);
  const secondaryLine = isCommercial ? address : (address && address !== primaryLine ? address : null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full text-left overflow-hidden rounded-xl border bg-card",
        "mobile-press rq-transition",
        "active:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* Left accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px]",
          isEquity ? "bg-emerald-500" : "bg-blue-500"
        )}
      />

      <div className="pl-4 pr-3.5 py-3">
        {/* Row 1: Property name + loan type badge */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold leading-tight truncate flex-1 min-w-0">
            {primaryLine}
          </p>
          {loanType ? (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 tracking-wide whitespace-nowrap",
                isEquity
                  ? "bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400"
                  : "bg-blue-500/[0.07] text-blue-600 dark:text-blue-400"
              )}
            >
              {loanType}
            </span>
          ) : (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded shrink-0 border border-dashed border-border text-muted-foreground whitespace-nowrap">
              --
            </span>
          )}
        </div>

        {/* Row 2: Address (if different from primary line) */}
        {secondaryLine && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {secondaryLine}
          </p>
        )}

        {/* Row 3: Borrower + deal number */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3 shrink-0 opacity-50" />
          {borrowerName ? (
            <span className="truncate font-medium text-foreground/80">{borrowerName}</span>
          ) : (
            <span className="italic opacity-40">No borrower</span>
          )}
          {deal.deal_number && (
            <>
              <span className="opacity-30">&middot;</span>
              <span className="num shrink-0 opacity-60">{deal.deal_number}</span>
            </>
          )}
        </div>

        {/* Row 4: Amount + asset class + days pill */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-lg font-bold num tracking-tight leading-none">
            {formatCurrency(deal.amount)}
          </span>
          <div className="flex items-center gap-2">
            {assetLabel && (
              <span className="text-[11px] text-muted-foreground">{assetLabel}</span>
            )}
            <span
              className={cn(
                "text-[10.5px] font-semibold num rounded-full px-2 py-0.5 whitespace-nowrap",
                alertLevel === "alert" &&
                  "text-red-600 dark:text-red-400 bg-red-500/[0.08] border border-red-500/[0.18]",
                alertLevel === "warn" &&
                  "text-amber-600 dark:text-amber-400 bg-amber-500/[0.08] border border-amber-500/[0.18]",
                alertLevel === "normal" &&
                  "text-muted-foreground bg-accent border border-border"
              )}
            >
              {days}d
            </span>
          </div>
        </div>

        {/* Stage label */}
        <div className="mt-1.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            {deal.stage}
          </span>
        </div>
      </div>
    </button>
  );
}

export const MobileDealCard = React.memo(MobileDealCardInner, (prev, next) => {
  return (
    prev.deal.id === next.deal.id &&
    prev.deal.stage === next.deal.stage &&
    prev.deal.stage_entered_at === next.deal.stage_entered_at &&
    prev.deal.name === next.deal.name &&
    prev.deal.amount === next.deal.amount &&
    prev.deal.asset_class === next.deal.asset_class &&
    prev.deal.capital_side === next.deal.capital_side &&
    prev.deal.primary_contact_id === next.deal.primary_contact_id &&
    prev.stageConfig?.stage === next.stageConfig?.stage
  );
});
