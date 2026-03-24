"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DealFilters, type FilterState } from "./DealFilters";
import { filterByDateAdded } from "@/components/ui/date-added-filter";
import { PipelineKanban } from "./PipelineKanban";
import { PipelineTable } from "./PipelineTable";
import { NewDealDialog } from "./NewDealDialog";
import { IntakeReviewModal } from "./IntakeReviewModal";
import { STAGES, type UnifiedDeal } from "./pipeline-types";
import { getDealFlavor } from "@/lib/pipeline/deal-display-config";
import {
  useAllDeals,
  useStageConfigs,
  useRelationshipDealIds,
  useTeamMembers,
  useIntakeItems,
  useCurrentUserId,
  useConditionsMap,
} from "@/hooks/usePipelineStore";
import { useDealPreview } from "./deal-preview/DealPreviewProvider";
import { usePipelineKeyboardNav } from "@/hooks/usePipelineKeyboardNav";
import type { IntakeItem } from "@/lib/intake/types";

export function PipelineView() {
  const router = useRouter();
  const isMobile = useIsMobile();

  // Read all data from Zustand store
  const deals = useAllDeals();
  const stageConfigs = useStageConfigs();
  const relationshipDealIds = useRelationshipDealIds();
  const teamMembers = useTeamMembers();
  const intakeItems = useIntakeItems();
  const currentUserId = useCurrentUserId();
  const conditionsMap = useConditionsMap();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    capitalSide: "all",
    dealFlavor: "all",
    assetClass: "all",
    dateAdded: "all",
    view: "kanban",
  });

  const effectiveView = isMobile ? "table" : filters.view;
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [reviewItem, setReviewItem] = useState<IntakeItem | null>(null);

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

  // Build ordered deal IDs (stages left-to-right, by amount within stage)
  const orderedDealIds = useMemo(() => {
    const ids: string[] = [];
    for (const stage of STAGES) {
      const stageDeals = filteredDeals
        .filter((d) => d.stage === stage.key)
        .sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity));
      for (const d of stageDeals) ids.push(d.id);
    }
    return ids;
  }, [filteredDeals]);

  const { open: openPreview, setPrefetchDealId, isOpen: isPreviewOpen } = useDealPreview();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleDealClick = useCallback(
    (deal: UnifiedDeal, e?: React.MouseEvent) => {
      // Modifier+click opens full page
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey)) {
        router.push(`/pipeline/${deal.deal_number || deal.id}`);
        return;
      }
      openPreview(deal.id, orderedDealIds);
    },
    [router, openPreview, orderedDealIds]
  );

  const handleDealHover = useCallback(
    (dealId: string) => {
      setPrefetchDealId(dealId);
    },
    [setPrefetchDealId]
  );

  const handleOpenNewDeal = useCallback(() => {
    setNewDealOpen(true);
  }, []);

  const { selectedDealId } = usePipelineKeyboardNav({
    deals: filteredDeals,
    isModalOpen: isPreviewOpen,
    isKanbanView: effectiveView === "kanban",
    onOpenPreview: useCallback(
      (dealId: string, orderedIds: string[]) => openPreview(dealId, orderedIds),
      [openPreview]
    ),
    onOpenNewDeal: handleOpenNewDeal,
    searchInputRef,
  });

  const handleIntakeClick = useCallback((item: IntakeItem) => {
    setReviewItem(item);
  }, []);

  return (
    <div className="space-y-4">
      <DealFilters
        filters={filters}
        onChange={setFilters}
        onNewDeal={handleOpenNewDeal}
        searchInputRef={searchInputRef}
      />

      {effectiveView === "kanban" ? (
        <PipelineKanban
          deals={filteredDeals}
          stageConfigs={stageConfigs}
          relationshipDealIds={relationshipDealIds}
          onDealClick={handleDealClick}
          onDealHover={handleDealHover}
          intakeItems={intakeItems}
          onIntakeClick={handleIntakeClick}
          teamMembers={teamMembers}
          conditionsMap={conditionsMap}
          selectedDealId={selectedDealId}
        />
      ) : (
        <PipelineTable
          deals={filteredDeals}
          stageConfigs={stageConfigs}
          onDealClick={handleDealClick}
        />
      )}

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

// ─── Kbd ───

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-background px-[5px] py-px text-[10px] font-medium leading-4 text-muted-foreground">
      {children}
    </kbd>
  );
}
