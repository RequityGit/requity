"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { useIsMobile } from "@/hooks/use-mobile";
import { storeDealOrder } from "@/hooks/useDealNavigation";
import { cn } from "@/lib/utils";
import { DealFilters, type FilterState, type ClosingDateFilter } from "./DealFilters";
import { filterByDateAdded } from "@/components/ui/date-added-filter";
import { PipelineKanban } from "./PipelineKanban";
import { PipelineTable } from "./PipelineTable";
import { PipelineGroupedTable } from "./PipelineGroupedTable";
import { MobileDealList } from "./MobileDealList";
import { NewDealDialog } from "./NewDealDialog";
import { IntakeReviewModal } from "./IntakeReviewModal";
import { STAGES, ALL_STAGES, type UnifiedDeal } from "./pipeline-types";
import { getDealFlavor } from "@/lib/pipeline/deal-display-config";
import {
  useAllDeals,
  useStageConfigs,
  useTeamMembers,
  useIntakeItems,
  useCurrentUserId,
  useConditionsMap,
} from "@/hooks/usePipelineStore";
import { useDealPreview } from "./deal-preview/DealPreviewProvider";
import { usePipelineKeyboardNav } from "@/hooks/usePipelineKeyboardNav";
import type { IntakeItem } from "@/lib/intake/types";

function filterByClosingDate(dateStr: string | null, filter: ClosingDateFilter): boolean {
  if (filter === "all") return true;
  if (filter === "no_date") return !dateStr;
  if (!dateStr) return false;

  const [y, m, d] = dateStr.split("-").map(Number);
  const close = new Date(y!, m! - 1, d!);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((close.getTime() - now.getTime()) / 86400000);

  switch (filter) {
    case "overdue":
      return diffDays < 0;
    case "this_week":
      return diffDays >= 0 && diffDays <= 7;
    case "next_2_weeks":
      return diffDays >= 0 && diffDays <= 14;
    case "this_month":
      return diffDays >= 0 && diffDays <= 30;
    default:
      return true;
  }
}

/** Sort deals by amount descending */
function sortDeals(a: UnifiedDeal, b: UnifiedDeal): number {
  return (b.amount ?? -Infinity) - (a.amount ?? -Infinity);
}

interface PipelineViewProps {
  showingLostDeals?: boolean;
}

export function PipelineView({ showingLostDeals = false }: PipelineViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Read all data from Zustand store
  const deals = useAllDeals();
  const stageConfigs = useStageConfigs();
  const teamMembers = useTeamMembers();
  const intakeItems = useIntakeItems();
  const currentUserId = useCurrentUserId();
  const conditionsMap = useConditionsMap();

  const [filters, setFilters] = useState<FilterState>(() => {
    let savedView: "kanban" | "table" = "table";
    try {
      const stored = localStorage.getItem("pipeline-view-preference");
      if (stored === "kanban" || stored === "table") savedView = stored;
    } catch {
      // SSR or localStorage unavailable
    }
    return {
      search: "",
      capitalSide: "all",
      dealFlavor: "all",
      assetClass: "all",
      dateAdded: "all",
      closingDate: "all",
      view: savedView,
    };
  });

  // Persist view preference
  const setFiltersWithPersist = useCallback((next: FilterState) => {
    setFilters(next);
    try {
      localStorage.setItem("pipeline-view-preference", next.view);
    } catch {
      // ignore
    }
  }, []);

  const effectiveView = isMobile || showingLostDeals ? "table" : filters.view;
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<IntakeItem | null>(null);
  const [lifecycleView, setLifecycleView] = useState(false);

  // Filter deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      if (
        filters.capitalSide !== "all" &&
        d.capital_side !== filters.capitalSide
      )
        return false;

      if (filters.dealFlavor !== "all") {
        if (getDealFlavor(d) !== filters.dealFlavor) return false;
      }

      if (filters.assetClass !== "all" && d.asset_class !== filters.assetClass)
        return false;

      if (filters.dateAdded !== "all" && !filterByDateAdded(d.created_at, filters.dateAdded))
        return false;

      if (filters.closingDate !== "all" && !filterByClosingDate(d.close_date, filters.closingDate))
        return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const match =
          d.name.toLowerCase().includes(q) ||
          d.deal_number?.toLowerCase().includes(q) ||
          d.primary_contact?.first_name?.toLowerCase().includes(q) ||
          d.primary_contact?.last_name?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [deals, filters]);

  // Build ordered deal IDs (stages left-to-right, amount within stage)
  const orderedDealIds = useMemo(() => {
    const ids: string[] = [];
    const stageList = lifecycleView ? ALL_STAGES : STAGES;
    for (const stage of stageList) {
      const stageDeals = filteredDeals
        .filter((d) => {
          if (stage.key === "closed" && !lifecycleView) {
            return d.stage === "closed" || (d.stage.startsWith("closed_") && d.stage !== "closed_lost");
          }
          return d.stage === stage.key;
        })
        .sort(sortDeals);
      for (const d of stageDeals) ids.push(d.id);
    }
    return ids;
  }, [filteredDeals, lifecycleView]);

  const { isOpen: isPreviewOpen } = useDealPreview();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleDealClick = useCallback(
    (deal: UnifiedDeal) => {
      // Store deal order for prev/next navigation on deal pages
      storeDealOrder(orderedDealIds);
      // Always navigate to the full deal page
      router.push(`/pipeline/${deal.deal_number || deal.id}`);
    },
    [router, orderedDealIds]
  );

  const handleDealHover = useCallback(
    (dealId: string) => {
      // Prefetch deal page on hover for faster navigation
      const deal = filteredDeals.find((d) => d.id === dealId);
      router.prefetch(`/pipeline/${deal?.deal_number || dealId}`);
    },
    [filteredDeals, router]
  );

  const handleOpenNewDeal = useCallback(() => {
    setNewDealOpen(true);
  }, []);

  const { selectedDealId } = usePipelineKeyboardNav({
    deals: filteredDeals,
    isModalOpen: isPreviewOpen,
    isKanbanView: effectiveView === "kanban",
    onOpenPreview: useCallback(
      (dealId: string, orderedIds: string[]) => {
        storeDealOrder(orderedIds);
        const deal = filteredDeals.find((d) => d.id === dealId);
        router.push(`/pipeline/${deal?.deal_number || dealId}`);
      },
      [filteredDeals, router]
    ),
    onOpenNewDeal: handleOpenNewDeal,
    searchInputRef,
  });

  const handleIntakeClick = useCallback((item: IntakeItem) => {
    setReviewItem(item);
  }, []);

  const handleToggleLostDeals = useCallback(() => {
    if (showingLostDeals) {
      router.push("/pipeline");
    } else {
      router.push("/pipeline?status=lost");
    }
  }, [showingLostDeals, router]);

  return (
    <div className="space-y-4">
      <DealFilters
        filters={filters}
        onChange={setFiltersWithPersist}
        onNewDeal={handleOpenNewDeal}
        searchInputRef={searchInputRef}
        showingLostDeals={showingLostDeals}
        onToggleLostDeals={handleToggleLostDeals}
        lifecycleView={lifecycleView}
        onToggleLifecycle={() => setLifecycleView((v) => !v)}
      />

      <ErrorBoundary
        FallbackComponent={PipelineFallback}
        onReset={() => window.location.reload()}
      >
        {isMobile ? (
          <MobileDealList
            deals={filteredDeals}
            stageConfigs={stageConfigs}
            onDealClick={handleDealClick}
          />
        ) : effectiveView === "kanban" ? (
          <PipelineKanban
            deals={filteredDeals}
            stageConfigs={stageConfigs}
            onDealClick={handleDealClick}
            onDealHover={handleDealHover}
            intakeItems={intakeItems}
            onIntakeClick={handleIntakeClick}
            teamMembers={teamMembers}
            conditionsMap={conditionsMap}
            selectedDealId={selectedDealId}
            lifecycleView={lifecycleView}
          />
        ) : showingLostDeals ? (
          <PipelineTable
            deals={filteredDeals}
            stageConfigs={stageConfigs}
            onDealClick={handleDealClick}
            showLossReason
          />
        ) : (
          <PipelineGroupedTable
            deals={filteredDeals}
            stageConfigs={stageConfigs}
            onDealClick={handleDealClick}
            teamMembers={teamMembers}
            lifecycleView={lifecycleView}
          />
        )}
      </ErrorBoundary>

      {/* Kanban keyboard hint bar */}
      {effectiveView === "kanban" && (
        <div
          className={cn(
            "flex items-center justify-center border-t border-border bg-muted/30 px-5 py-[7px] rq-transition",
            isPreviewOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <div className="flex items-center gap-3.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Kbd>&larr;</Kbd><Kbd>&rarr;</Kbd> navigate</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="flex items-center gap-1"><Kbd>&uarr;</Kbd><Kbd>&darr;</Kbd> columns</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="flex items-center gap-1"><Kbd>Space</Kbd> open</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="flex items-center gap-1"><Kbd>/</Kbd> search</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="flex items-center gap-1"><Kbd>N</Kbd> new deal</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span className="flex items-center gap-1"><Kbd>?</Kbd> shortcuts</span>
          </div>
        </div>
      )}

      <NewDealDialog
        open={newDealOpen}
        onOpenChange={setNewDealOpen}
        teamMembers={teamMembers}
        currentUserId={currentUserId ?? undefined}
      />

      <IntakeReviewModal
        item={reviewItem}
        open={!!reviewItem}
        onOpenChange={(open) => {
          if (!open) setReviewItem(null);
        }}
      />
    </div>
  );
}

// ─── Pipeline Error Fallback ───

function PipelineFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-sm text-muted-foreground">Something went wrong loading the pipeline.</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Kbd ───

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-background px-[5px] py-px text-[10px] font-medium leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}
