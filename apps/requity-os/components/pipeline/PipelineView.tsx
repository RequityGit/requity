"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { DealFilters, type FilterState } from "./DealFilters";
import { filterByDateAdded } from "@/components/ui/date-added-filter";
import { PipelineKanban } from "./PipelineKanban";
import { PipelineTable } from "./PipelineTable";
import { NewDealDialog } from "./NewDealDialog";
import { IntakeReviewModal } from "./IntakeReviewModal";
import type {
  UnifiedDeal,
  StageConfig,
  DealActivity,
} from "./pipeline-types";
import { getDealFlavor } from "@/lib/pipeline/deal-display-config";
import type { IntakeItem } from "@/lib/intake/types";

interface PipelineViewProps {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  activities: DealActivity[];
  relationshipDealIds: Set<string>;
  teamMembers: { id: string; full_name: string }[];
  intakeItems?: IntakeItem[];
  currentUserId?: string;
}

export function PipelineView({
  deals,
  stageConfigs,
  activities,
  relationshipDealIds,
  teamMembers,
  intakeItems = [],
  currentUserId,
}: PipelineViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
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

  const handleDealClick = useCallback(
    (deal: UnifiedDeal) => {
      router.push(`/pipeline/${deal.deal_number || deal.id}`);
    },
    [router]
  );

  const handleIntakeClick = useCallback((item: IntakeItem) => {
    setReviewItem(item);
  }, []);

  return (
    <div className="space-y-4">
      <DealFilters
        filters={filters}
        onChange={setFilters}
        onNewDeal={() => setNewDealOpen(true)}
      />

      {effectiveView === "kanban" ? (
        <PipelineKanban
          deals={filteredDeals}
          stageConfigs={stageConfigs}
          relationshipDealIds={relationshipDealIds}
          onDealClick={handleDealClick}
          intakeItems={intakeItems}
          onIntakeClick={handleIntakeClick}
        />
      ) : (
        <PipelineTable
          deals={filteredDeals}
          stageConfigs={stageConfigs}
          onDealClick={handleDealClick}
        />
      )}

      <NewDealDialog
        open={newDealOpen}
        onOpenChange={setNewDealOpen}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
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
