"use client";

import { useMemo } from "react";
import type { UnifiedDeal, StageConfig } from "./pipeline-types";
import { MobileDealCard } from "./MobileDealCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";

interface MobileDealListProps {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  onDealClick: (deal: UnifiedDeal) => void;
}

export function MobileDealList({
  deals,
  stageConfigs,
  onDealClick,
}: MobileDealListProps) {
  const stageConfigMap = useMemo(
    () => new Map(stageConfigs.map((sc) => [sc.stage, sc])),
    [stageConfigs]
  );

  const sortedDeals = useMemo(
    () => [...deals].sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity)),
    [deals]
  );

  if (sortedDeals.length === 0) {
    return (
      <EmptyState
        compact
        icon={Inbox}
        title="No deals found"
        description="Try adjusting your search"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sortedDeals.map((deal) => (
        <MobileDealCard
          key={deal.id}
          deal={deal}
          stageConfig={stageConfigMap.get(deal.stage)}
          onClick={() => onDealClick(deal)}
        />
      ))}
    </div>
  );
}
