"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { usePipelineStore } from "@/stores/pipeline-store";
import type {
  UnifiedDeal,
  UnifiedStage,
  StageConfig,
  DealActivity,
} from "@/components/pipeline/pipeline-types";
import type { IntakeItem } from "@/lib/intake/types";
import type { ConditionsProgress } from "@/stores/pipeline-store";

/** All deals as an array (for filtering in PipelineView).
 *  Uses dealsVersion (bumped on every mutation) as the memo trigger
 *  instead of the raw Map reference, giving the store explicit control
 *  over when downstream components re-render. */
export function useAllDeals(): UnifiedDeal[] {
  const deals = usePipelineStore((s) => s.deals);
  const version = usePipelineStore((s) => s.dealsVersion);
  return useMemo(() => {
    const result: UnifiedDeal[] = [];
    deals.forEach((deal) => result.push(deal));
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
}

/** Deals for a specific stage, sorted by amount desc.
 *  Uses dealsVersion as the memo trigger (same pattern as useAllDeals)
 *  so sort-order-only changes don't cause column re-renders. */
export function useStageDeals(stageKey: UnifiedStage): UnifiedDeal[] {
  const deals = usePipelineStore((s) => s.deals);
  const version = usePipelineStore((s) => s.dealsVersion);
  return useMemo(() => {
    const result: UnifiedDeal[] = [];
    deals.forEach((deal) => {
      if (
        deal.stage === stageKey &&
        (deal.status === "active" || deal.status === "on_hold")
      ) {
        result.push(deal);
      }
    });
    return result.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, stageKey]);
}

/** Single deal by ID */
export function useDeal(dealId: string): UnifiedDeal | undefined {
  return usePipelineStore((s) => s.deals.get(dealId));
}

/** Stage totals for column headers.
 *  Uses dealsVersion as memo trigger to avoid re-renders on sort-order-only changes. */
export function useStageTotals(): Map<
  UnifiedStage,
  { count: number; amount: number }
> {
  const deals = usePipelineStore((s) => s.deals);
  const version = usePipelineStore((s) => s.dealsVersion);
  return useMemo(() => {
    const totals = new Map<UnifiedStage, { count: number; amount: number }>();
    deals.forEach((deal) => {
      if (deal.status !== "active" && deal.status !== "on_hold") return;
      const current = totals.get(deal.stage) ?? { count: 0, amount: 0 };
      current.count++;
      current.amount += deal.amount ?? 0;
      totals.set(deal.stage, current);
    });
    return totals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
}

/** Stage configs from store */
export function useStageConfigs(): StageConfig[] {
  return usePipelineStore((s) => s.stageConfigs);
}

/** Relationship deal IDs set */
export function useRelationshipDealIds(): Set<string> {
  return usePipelineStore((s) => s.relationshipDealIds);
}

/** Activities from store */
export function useActivities(): DealActivity[] {
  return usePipelineStore((s) => s.activities);
}

/** Team members from store */
export function useTeamMembers(): { id: string; full_name: string }[] {
  return usePipelineStore((s) => s.teamMembers);
}

/** Intake items from store */
export function useIntakeItems(): IntakeItem[] {
  return usePipelineStore((s) => s.intakeItems);
}

/** Conditions progress map (deal_id -> {completed, total}) */
export function useConditionsMap(): Map<string, ConditionsProgress> {
  return usePipelineStore((s) => s.conditionsMap);
}

/** Current user ID */
export function useCurrentUserId(): string | null {
  return usePipelineStore((s) => s.currentUserId);
}

/** Store actions (stable references, no re-render) */
export function usePipelineActions() {
  return usePipelineStore(
    useShallow((s) => ({
      moveDeal: s.moveDeal,
      updateDeal: s.updateDeal,
      addDeal: s.addDeal,
      removeDeal: s.removeDeal,
    }))
  );
}
