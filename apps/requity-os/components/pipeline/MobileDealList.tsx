"use client";

import { useMemo } from "react";
import type { UnifiedDeal, StageConfig } from "./pipeline-types";
import { STAGES } from "./pipeline-types";
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

  const stageOrder = useMemo(
    () => new Map(STAGES.map((s, i) => [s.key, i])),
    []
  );

  const sortedDeals = useMemo(
    () =>
      [...deals].sort((a, b) => {
        const stageA = stageOrder.get(a.stage) ?? 999;
        const stageB = stageOrder.get(b.stage) ?? 999;
        if (stageA !== stageB) return stageA - stageB;
        return (b.amount ?? -Infinity) - (a.amount ?? -Infinity);
      }),
    [deals, stageOrder]
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
