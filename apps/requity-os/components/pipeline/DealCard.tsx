"use client";

import React, { useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Users, Calendar, Clock, AlertTriangle } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  conditionsProgress?: { completed: number; total: number } | null;
  assigneeName?: string | null;
  onClick: (e?: React.MouseEvent) => void;
  onHover?: () => void;
  isSelected?: boolean;
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

export function getDealAddress(deal: UnifiedDeal): string {
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

export function getPropertyName(deal: UnifiedDeal): string | null {
  // For commercial deals, deal.name IS the property name
  // Check property_data.property_name first, then fall back to deal.name
  const pd = deal.property_data;
  if (pd && typeof pd.property_name === "string" && pd.property_name) {
    return pd.property_name;
  }
  // deal.name is the property name for commercial deals (set at creation)
  return deal.name || null;
}

export function getLoanTypeLabel(deal: UnifiedDeal): string | null {
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

export function getAmountLabel(deal: UnifiedDeal): string {
  const isEquity = deal.capital_side === "equity";
  const isClosed = deal.stage === "closed";
  const isLateStage = deal.stage === "negotiation" || deal.stage === "execution";

  if (isClosed) return isEquity ? "Equity Committed" : "Funded";
  if (isLateStage) return isEquity ? "Equity Amount" : "Loan Amount";
  return isEquity ? "Target Equity" : "Target Loan Amount";
}

function getCloseDateStatus(dateStr: string | null): "normal" | "urgent" | "overdue" {
  if (!dateStr) return "normal";
  // Split ISO date string directly to avoid timezone shift
  const [y, m, d] = dateStr.split("-").map(Number);
  const close = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((close.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 14) return "urgent";
  return "normal";
}


function getConditionsBarColor(progress: { completed: number; total: number }): string {
  if (progress.completed === progress.total) return "bg-emerald-500";
  const pct = (progress.completed / progress.total) * 100;
  return pct > 50 ? "bg-blue-500" : "bg-amber-500";
}

// ─── Shared card content (used by both DealCard and DealCardOverlay) ───

interface CardContentProps {
  deal: UnifiedDeal;
  days: number;
  alertLevel: "normal" | "warn" | "alert";
  conditionsProgress?: { completed: number; total: number } | null;
  assigneeName?: string | null;
}

function CardContent({
  deal,
  days,
  alertLevel,
  conditionsProgress,
  assigneeName,
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
  const isClosed = deal.status === "won" || deal.status === "lost" || deal.stage === "closed";
  const closeDateStatus = isClosed ? "normal" : getCloseDateStatus(deal.close_date);
  const condPct = conditionsProgress && conditionsProgress.total > 0
    ? Math.round((conditionsProgress.completed / conditionsProgress.total) * 100)
    : 0;
  const condAllDone = conditionsProgress != null && conditionsProgress.total > 0 && conditionsProgress.completed === conditionsProgress.total;

  return (
    <>
      {/* Left accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px]",
          isEquity ? "bg-emerald-500" : "bg-blue-500"
        )}
      />

      {/* Approval status badge */}
      {deal.approval_status === "pending" && (
        <div className="mx-3 mt-2.5 mb-0 flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1">
          <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Awaiting Approval</span>
        </div>
      )}
      {deal.approval_status === "changes_requested" && (
        <div className="mx-3 mt-2.5 mb-0 flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1">
          <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Changes Requested</span>
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
              <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full rq-transition",
                    getConditionsBarColor(conditionsProgress)
                  )}
                  style={{ width: `${condPct}%` }}
                />
              </div>
            </div>
            <span
              className={cn(
                "text-[10px] font-semibold num whitespace-nowrap shrink-0",
                condAllDone
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
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
          {deal.close_date && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium",
                (closeDateStatus === "overdue" || closeDateStatus === "urgent") && "text-red-600 dark:text-red-400",
                closeDateStatus === "normal" && "text-muted-foreground"
              )}
            >
              <Calendar className={cn("h-2.5 w-2.5", closeDateStatus === "normal" ? "opacity-50" : "opacity-80")} />
              {formatDateShort(deal.close_date)}
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
  onHover,
  isSelected,
}: DealCardProps) {
  const router = useRouter();
  const dealHref = `/pipeline/${deal.deal_number || deal.id}`;
  const prefetchDeal = useCallback(() => {
    router.prefetch(dealHref);
    onHover?.();
  }, [router, dealHref, onHover]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { stage: deal.stage },
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // dnd-kit's onPointerDown calls preventDefault(), which suppresses the
  // browser click event. Detect clicks manually via pointer position tracking.
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      // Forward to dnd-kit's handler so dragging still works
      (listeners as Record<string, (e: React.PointerEvent) => void> | undefined)
        ?.onPointerDown?.(e);
    },
    [listeners]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;

      // If the pointer landed on the focus ribbon, skip navigation
      const target = e.target as HTMLElement;
      if (target.closest("[data-focus-btn]")) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        onClick(e as unknown as React.MouseEvent);
      }
    },
    [onClick]
  );

  const { days, alertLevel } = useMemo(() => {
    const d = daysInStage(deal.stage_entered_at);
    const al = getAlertLevel(d, stageConfig);
    return { days: d, alertLevel: al };
  }, [deal.stage_entered_at, stageConfig]);

  const isClosed = deal.status === "won" || deal.status === "lost";

  return (
    <div
      ref={setNodeRef}
      data-deal-id={deal.id}
      style={sortableStyle}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...attributes}
      onPointerEnter={prefetchDeal}
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
        isSelected && "ring-2 ring-primary/40",
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
    prev.deal.close_date === next.deal.close_date &&
    prev.deal.assigned_to === next.deal.assigned_to &&
    prev.deal.sort_order === next.deal.sort_order &&
    prev.deal.primary_contact_id === next.deal.primary_contact_id &&
    prev.deal.broker_contact_id === next.deal.broker_contact_id &&
    prev.stageConfig?.stage === next.stageConfig?.stage &&
    prev.conditionsProgress?.completed === next.conditionsProgress?.completed &&
    prev.conditionsProgress?.total === next.conditionsProgress?.total &&
    prev.assigneeName === next.assigneeName &&
    prev.isSelected === next.isSelected
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
