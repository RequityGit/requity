"use client";

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Users, Calendar, Mail, Pencil, ExternalLink } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
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
  getDealDisplayConfig,
  isCommercialAssetClass,
} from "@/lib/pipeline/deal-display-config";
import { formatDateShort } from "@/lib/format";

// ─── Types ───

interface DealCardProps {
  deal: UnifiedDeal;
  stageConfig?: StageConfig;
  hasRelationships?: boolean;
  formulaMap?: Map<string, string>;
  conditionsProgress?: { completed: number; total: number } | null;
  assigneeName?: string | null;
  onClick: () => void;
}

// ─── Shared helpers ───

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

function getDealAddress(deal: UnifiedDeal): string {
  // Check property_data first
  const pd = deal.property_data;
  if (pd) {
    if (typeof pd.address === "string" && pd.address) return pd.address;
    const pdParts = [pd.street_address, pd.city, pd.state].filter(Boolean);
    if (pdParts.length > 0) {
      let addr = pdParts.join(", ");
      if (pd.zip) addr += ` ${pd.zip}`;
      return addr;
    }
  }
  // Fall back to uw_data address fields
  const uw = deal.uw_data;
  if (uw) {
    const uwParts = [uw.property_address, uw.property_city, uw.property_state].filter(Boolean);
    if (uwParts.length > 0) {
      let addr = uwParts.join(", ");
      if (uw.property_zip) addr += ` ${uw.property_zip}`;
      return addr;
    }
  }
  return "";
}

function getPropertyName(deal: UnifiedDeal): string | null {
  // For commercial deals, deal.name IS the property name
  // Check property_data.property_name first, then fall back to deal.name
  const pd = deal.property_data;
  if (pd && typeof pd.property_name === "string" && pd.property_name) {
    return pd.property_name;
  }
  // deal.name is the property name for commercial deals (set at creation)
  return deal.name || null;
}

function getLoanTypeLabel(deal: UnifiedDeal): string | null {
  const lt = deal.uw_data?.loan_type;
  if (!lt || typeof lt !== "string") return null;
  // Clean up common values for display
  const cleaned = lt
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  // Map common abbreviated forms
  const MAP: Record<string, string> = {
    "Rtl": "Fix & Flip",
    "Fix Flip": "Fix & Flip",
    "Fix And Flip": "Fix & Flip",
    "Dscr": "DSCR",
  };
  return MAP[cleaned] ?? cleaned;
}

function getAmountLabel(deal: UnifiedDeal): string {
  const isEquity = deal.capital_side === "equity";
  const isClosed = deal.stage === "closed";
  const isLateStage = deal.stage === "negotiation" || deal.stage === "execution";

  if (isClosed) return isEquity ? "Equity Committed" : "Funded";
  if (isLateStage) return isEquity ? "Equity Amount" : "Loan Amount";
  return isEquity ? "Target Equity" : "Target Loan Amount";
}

function getCloseDateStatus(dateStr: string | null): "normal" | "soon" | "overdue" {
  if (!dateStr) return "normal";
  const close = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "soon";
  return "normal";
}

function getConditionsBarState(progress: { completed: number; total: number } | null): "normal" | "done" | "warn" {
  if (!progress || progress.total === 0) return "normal";
  if (progress.completed === progress.total) return "done";
  const incompletePct = (progress.total - progress.completed) / progress.total;
  if (incompletePct > 0.7) return "warn";
  return "normal";
}

// ─── Shared card content (used by both DealCard and DealCardOverlay) ───

interface CardContentProps {
  deal: UnifiedDeal;
  days: number;
  alertLevel: "normal" | "warn" | "alert";
  conditionsProgress?: { completed: number; total: number } | null;
  assigneeName?: string | null;
  showHoverActions?: boolean;
}

function CardContent({
  deal,
  days,
  alertLevel,
  conditionsProgress,
  assigneeName,
  showHoverActions = false,
}: CardContentProps) {
  const isCommercial = isCommercialAssetClass(deal.asset_class);
  const isEquity = deal.capital_side === "equity";
  const address = getDealAddress(deal);
  // Commercial deals: show deal.name as property name headline + address below
  // Residential: show address as headline, fall back to deal.name if no address
  const hasNamedProperty = isCommercial;
  const propertyName = deal.name;
  const displayAddress = address || (isCommercial ? "" : deal.name);
  const loanType = getLoanTypeLabel(deal);
  const closeDateStatus = getCloseDateStatus(deal.expected_close_date);
  const condState = getConditionsBarState(conditionsProgress ?? null);
  const condPct = conditionsProgress && conditionsProgress.total > 0
    ? Math.round((conditionsProgress.completed / conditionsProgress.total) * 100)
    : 0;

  return (
    <>
      {/* Left accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px]",
          isEquity ? "bg-emerald-500" : "bg-blue-500"
        )}
      />

      {/* Hover quick actions */}
      {showHoverActions && (
        <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto rq-transition bg-card border border-border rounded-md p-0.5 shadow-sm z-10">
          <button
            type="button"
            className="w-[26px] h-[26px] flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground rq-transition"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Mail className="h-[13px] w-[13px]" />
          </button>
          <button
            type="button"
            className="w-[26px] h-[26px] flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground rq-transition"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <Pencil className="h-[13px] w-[13px]" />
          </button>
          <button
            type="button"
            className="w-[26px] h-[26px] flex items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground rq-transition"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <ExternalLink className="h-[13px] w-[13px]" />
          </button>
        </div>
      )}

      {/* Card inner content */}
      <div className="px-4 pt-3.5 pb-0 flex-1 flex flex-col">
        {/* Row 1: Property name + loan type badge */}
        <div className="flex items-start justify-between gap-2">
          {hasNamedProperty ? (
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold leading-tight truncate block">
                {propertyName}
              </span>
              {displayAddress && (
                <span className="text-xs text-muted-foreground truncate block mt-px">
                  {displayAddress}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[13.5px] font-semibold text-foreground leading-tight truncate flex-1 min-w-0">
              {displayAddress || deal.name}
            </span>
          )}
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

        {/* Row 2: Asset class */}
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={cn(
              "h-[5px] w-[5px] rounded-full shrink-0 opacity-60",
              isCommercial ? "bg-emerald-500" : "bg-blue-500"
            )}
          />
          <span className="text-[11px] text-muted-foreground">
            {deal.asset_class
              ? (ASSET_CLASS_LABELS[deal.asset_class as AssetClass] ?? deal.asset_class)
              : "--"}
          </span>
        </div>

        {/* Row 3: Amount */}
        <div className="text-xl font-bold num mt-2.5 leading-none tracking-tight">
          {formatCurrency(deal.amount)}
        </div>
        <div className="text-[10px] font-medium text-muted-foreground mt-0.5">
          {getAmountLabel(deal)}
        </div>

        {/* Row 4: Contacts */}
        <div className="mt-2.5 flex flex-col gap-1">
          {/* Borrower */}
          <div className="flex items-center gap-1.5 text-[11.5px] leading-tight overflow-hidden">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-55" />
            {deal.primary_contact ? (
              <>
                <span className="font-medium text-foreground whitespace-nowrap">
                  {deal.primary_contact.first_name} {deal.primary_contact.last_name}
                </span>
                {deal.company?.name && (
                  <>
                    <span className="text-muted-foreground opacity-35 text-[10px]">/</span>
                    <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {deal.company.name}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-muted-foreground opacity-35 italic">No borrower</span>
            )}
          </div>
          {/* Broker */}
          <div className="flex items-center gap-1.5 text-[11.5px] leading-tight overflow-hidden">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-55" />
            {deal.broker_contact ? (
              <>
                <span className="font-medium text-foreground whitespace-nowrap">
                  {deal.broker_contact.first_name} {deal.broker_contact.last_name}
                </span>
                {deal.broker_contact.broker_company?.name && (
                  <>
                    <span className="text-muted-foreground opacity-35 text-[10px]">/</span>
                    <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                      {deal.broker_contact.broker_company.name}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-muted-foreground opacity-35 italic">No broker</span>
            )}
          </div>
        </div>

        {/* Row 5: Conditions progress bar */}
        {conditionsProgress && conditionsProgress.total > 0 && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1">
              <div className="w-full h-1 rounded-full bg-border overflow-hidden dark:bg-[#2A2A2A]">
                <div
                  className={cn(
                    "h-full rounded-full rq-transition-transform",
                    condState === "done" && "bg-emerald-500 dark:bg-emerald-400",
                    condState === "warn" && "bg-amber-500 dark:bg-amber-400",
                    condState === "normal" && "bg-blue-500 dark:bg-blue-400"
                  )}
                  style={{ width: `${condPct}%` }}
                />
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold num whitespace-nowrap shrink-0",
                condState === "done" && "text-emerald-600 dark:text-emerald-400",
                condState === "warn" && "text-amber-600 dark:text-amber-400",
                condState === "normal" && "text-muted-foreground"
              )}
            >
              {conditionsProgress.completed}/{conditionsProgress.total}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 mt-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          {assigneeName && (
            <>
              <div className="w-[22px] h-[22px] rounded-full bg-accent border border-border flex items-center justify-center text-[8.5px] font-semibold text-muted-foreground shrink-0">
                {getInitials(assigneeName)}
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                {getFirstName(assigneeName)}
              </span>
            </>
          )}
          {deal.expected_close_date && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                closeDateStatus === "overdue" && "text-red-600 dark:text-red-400",
                closeDateStatus === "soon" && "text-amber-600 dark:text-amber-400",
                closeDateStatus === "normal" && "text-muted-foreground"
              )}
            >
              <Calendar className={cn("h-2.5 w-2.5", closeDateStatus === "normal" ? "opacity-50" : "opacity-80")} />
              {formatDateShort(deal.expected_close_date)}
              {closeDateStatus === "overdue" && " (overdue)"}
            </span>
          )}
        </div>
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
    </>
  );
}

// ─── DealCard (interactive, with hooks) ───

function DealCardInner({
  deal,
  stageConfig,
  conditionsProgress,
  assigneeName,
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

  const { days, alertLevel } = useMemo(() => {
    const d = daysInStage(deal.stage_entered_at);
    const al = getAlertLevel(d, stageConfig);
    return { days: d, alertLevel: al };
  }, [deal.stage_entered_at, stageConfig]);

  const isClosed = deal.status === "won" || deal.status === "lost";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onPointerEnter={prefetchDeal}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cn(
        "group w-full text-left rounded-xl border bg-card relative overflow-hidden flex flex-col",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)]",
        "dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.15)]",
        "hover:border-foreground/[0.18] hover:-translate-y-px",
        "rq-transition cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-50",
        isClosed && "opacity-60"
      )}
    >
      <CardContent
        deal={deal}
        days={days}
        alertLevel={alertLevel}
        conditionsProgress={conditionsProgress}
        assigneeName={assigneeName}
        showHoverActions
      />
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
    prev.deal.status === next.deal.status &&
    prev.deal.expected_close_date === next.deal.expected_close_date &&
    prev.deal.assigned_to === next.deal.assigned_to &&
    prev.deal.primary_contact_id === next.deal.primary_contact_id &&
    prev.deal.broker_contact_id === next.deal.broker_contact_id &&
    prev.stageConfig?.stage === next.stageConfig?.stage &&
    prev.hasRelationships === next.hasRelationships &&
    prev.formulaMap === next.formulaMap &&
    prev.conditionsProgress === next.conditionsProgress &&
    prev.assigneeName === next.assigneeName
  );
});

/** Static card clone for DragOverlay -- no hooks, no interactivity */
export function DealCardOverlay({
  deal,
  stageConfig,
  conditionsProgress,
  assigneeName,
}: Omit<DealCardProps, "onClick">) {
  const days = daysInStage(deal.stage_entered_at);
  const alertLevel = getAlertLevel(days, stageConfig);
  const isClosed = deal.status === "won" || deal.status === "lost";

  return (
    <div
      className={cn(
        "w-72 text-left rounded-xl border bg-card relative overflow-hidden flex flex-col shadow-lg",
        "ring-2 ring-primary/50 cursor-grabbing",
        isClosed && "opacity-60"
      )}
    >
      <CardContent
        deal={deal}
        days={days}
        alertLevel={alertLevel}
        conditionsProgress={conditionsProgress}
        assigneeName={assigneeName}
      />
    </div>
  );
}
