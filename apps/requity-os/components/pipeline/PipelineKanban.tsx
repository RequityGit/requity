"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { showSuccess, showError } from "@/lib/toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DealCard, DealCardOverlay } from "./DealCard";
import { IntakeCard } from "./IntakeCard";
import {
  advanceStageAction,
  regressStageAction,
  reorderDealsAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UnifiedDeal,
  type StageConfig,
  type UnifiedStage,
  STAGES,
} from "./pipeline-types";
import { formatCompactCurrency } from "@/lib/format";
import { usePipelineStore } from "@/stores/pipeline-store";
import type { IntakeItem } from "@/lib/intake/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Layers } from "lucide-react";
import type { ConditionsProgress } from "@/stores/pipeline-store";

// Static set of stage keys for collision detection (module-level, stable reference)
const STAGE_KEY_SET = new Set<string>(STAGES.map((s) => s.key));

/**
 * Custom collision detection that prioritises card-level droppables over
 * stage-column droppables. Without this, closestCorners can resolve to the
 * large column container instead of the sibling card the user is dragging
 * over, which silently discards within-column reorders.
 */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  // 1. Find all droppables whose rect contains the pointer
  const pointerCollisions = pointerWithin(args);

  if (pointerCollisions.length > 0) {
    // 2. Prefer card-level droppables (IDs NOT in STAGE_KEY_SET)
    const cardCollisions = pointerCollisions.filter(
      (c) => !STAGE_KEY_SET.has(String(c.id))
    );

    if (cardCollisions.length > 0) {
      // Among card droppables, pick the closest by center distance
      const cardIds = new Set(cardCollisions.map((c) => String(c.id)));
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) =>
          cardIds.has(String(c.id))
        ),
      });
    }

    // Only container-level hits (empty column or whitespace) — return those
    return pointerCollisions;
  }

  // 3. Fallback for fast pointer movement: use rect intersection
  const rectHits = rectIntersection(args);
  if (rectHits.length > 0) return rectHits;

  // 4. Last resort: closestCenter across stage columns only so drops
  //    never silently fail when the pointer is near the kanban area
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) =>
      STAGE_KEY_SET.has(String(c.id))
    ),
  });
};

interface PipelineKanbanProps {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  onDealClick: (deal: UnifiedDeal, e?: React.MouseEvent) => void;
  onDealHover?: (dealId: string) => void;
  intakeItems?: IntakeItem[];
  onIntakeClick?: (item: IntakeItem) => void;
  teamMembers: { id: string; full_name: string }[];
  conditionsMap: Map<string, ConditionsProgress>;
  selectedDealId?: string | null;
}

function StageColumn({
  stageKey,
  children,
}: {
  stageKey: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stageKey });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 space-y-2 min-h-[200px] rounded-lg bg-muted/30 p-2 transition-colors",
        isOver && "ring-2 ring-primary/50 bg-muted/50"
      )}
    >
      {children}
    </div>
  );
}

export function PipelineKanban({
  deals,
  stageConfigs,
  onDealClick,
  onDealHover,
  intakeItems = [],
  onIntakeClick,
  teamMembers,
  conditionsMap,
  selectedDealId,
}: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<UnifiedStage | null>(null);

  // Use store's moveDeal for optimistic updates instead of local dealOverrides
  const moveDeal = usePipelineStore((s) => s.moveDeal);
  const reorderDeal = usePipelineStore((s) => s.reorderDeal);
  const setDraggingDealId = usePipelineStore((s) => s.setDraggingDealId);

  // Build assignee name lookup map
  const assigneeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of teamMembers) {
      map.set(m.id, m.full_name);
    }
    return map;
  }, [teamMembers]);

  // Memoize maps to prevent recreation on every render
  const stageConfigMap = useMemo(
    () => new Map(stageConfigs.map((sc) => [sc.stage, sc])),
    [stageConfigs]
  );

  // Keep a ref to the latest deals to avoid stale closures in drag handlers
  const dealsRef = useRef(deals);
  dealsRef.current = deals;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    setDraggingDealId(id);
  }, [setDraggingDealId]);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setOverStage(null);
        return;
      }
      // Determine which stage the cursor is over
      // over.id could be a deal id or a stage key (droppable column)
      const overId = over.id as string;
      if (STAGE_KEY_SET.has(overId)) {
        setOverStage(overId as UnifiedStage);
      } else {
        // It's a deal card - find which stage that deal belongs to
        const overDeal = dealsRef.current.find((d) => d.id === overId);
        if (overDeal) setOverStage(overDeal.stage);
      }
    },
    []
  );

  // Stage order for determining forward vs backward moves
  const STAGE_ORDER = useMemo(() => STAGES.map((s) => s.key), []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      setOverStage(null);

      const { active, over } = event;
      if (!over) {
        setDraggingDealId(null);
        return;
      }

      const currentDeals = dealsRef.current;
      const dealId = active.id as string;
      const overId = over.id as string;
      const deal = currentDeals.find((d) => d.id === dealId);
      if (!deal) {
        setDraggingDealId(null);
        return;
      }

      // Determine if we dropped on a stage column or on another deal
      const isDropOnStage = STAGE_KEY_SET.has(overId);
      const overDeal = !isDropOnStage ? currentDeals.find((d) => d.id === overId) : null;
      const targetStage = isDropOnStage
        ? (overId as UnifiedStage)
        : overDeal
          ? overDeal.stage
          : deal.stage;

      const sameColumn = deal.stage === targetStage;

      if (sameColumn && !overDeal) {
        setDraggingDealId(null);
        return;
      }
      if (sameColumn && dealId === overId) {
        setDraggingDealId(null);
        return;
      }

      // Build the ordered list for the target stage
      const stageDeals = currentDeals
        .filter((d) => d.stage === targetStage)
        .sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));

      try {
        if (sameColumn) {
          // Reorder within same column
          const oldIndex = stageDeals.findIndex((d) => d.id === dealId);
          const newIndex = stageDeals.findIndex((d) => d.id === overId);
          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

          const reordered = arrayMove(stageDeals, oldIndex, newIndex);
          const orderedIds = reordered.map((d) => d.id);

          // Optimistic update
          reorderDeal(orderedIds, targetStage);

          // Persist
          const result = await reorderDealsAction(orderedIds, targetStage);
          if (result.error) {
            // Revert by re-sorting to original order
            const originalIds = stageDeals.map((d) => d.id);
            reorderDeal(originalIds, targetStage);
            showError("Could not reorder deals", result.error);
          }
        } else {
          // Cross-column move
          const originalStage = deal.stage;

          // Figure out insertion index in target column
          let insertIndex = stageDeals.length; // default: end
          if (overDeal) {
            const overIndex = stageDeals.findIndex((d) => d.id === overId);
            if (overIndex !== -1) insertIndex = overIndex;
          }

          // Build new target column order (insert the moved deal)
          const targetIds = stageDeals
            .filter((d) => d.id !== dealId)
            .map((d) => d.id);
          targetIds.splice(insertIndex, 0, dealId);

          // Optimistic update: move stage + set sort order
          moveDeal(dealId, targetStage);
          reorderDeal(targetIds, targetStage);

          // Use regressStageAction for backward moves (skips approval/close-date gates)
          const fromIndex = STAGE_ORDER.indexOf(deal.stage);
          const toIndex = STAGE_ORDER.indexOf(targetStage);
          const isBackward = toIndex < fromIndex;

          const stageResult = isBackward
            ? await regressStageAction(dealId, targetStage)
            : await advanceStageAction(dealId, targetStage);

          if (stageResult.error) {
            moveDeal(dealId, originalStage);
            showError("Could not move deal", stageResult.error);
            return;
          }

          // Persist new sort order in target column
          const orderResult = await reorderDealsAction(targetIds, targetStage);
          if (orderResult.error) {
            showError("Deal moved but could not save order", orderResult.error);
          } else {
            const stageLabel = STAGES.find((s) => s.key === targetStage)?.label ?? targetStage;
            showSuccess(`${deal.name} moved to ${stageLabel}`);
          }
        }
      } finally {
        // Always clear the dragging guard so realtime resumes for this deal
        setDraggingDealId(null);
      }
    },
    [moveDeal, reorderDeal, setDraggingDealId, STAGE_ORDER]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverStage(null);
    setDraggingDealId(null);
  }, [setDraggingDealId]);

  // Find active deal for DragOverlay
  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  // Memoize stage calculations to avoid recomputing on every render
  const stageData = useMemo(() => {
    return STAGES.map((stage) => {
      const stageDeals = deals
        .filter((d) => d.stage === stage.key)
        .sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity));

      const totalAmount = stageDeals.reduce(
        (sum, d) => sum + (d.amount ?? 0),
        0
      );
      const isLead = stage.key === "lead";
      const columnCount = stageDeals.length + (isLead ? intakeItems.length : 0);

      return { stage, stageDeals, totalAmount, isLead, columnCount };
    });
  }, [deals, intakeItems.length]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {stageData.map(({ stage, stageDeals, totalAmount, isLead, columnCount }) => {
            const dealIds = stageDeals.map((d) => d.id);

            return (
              <div key={stage.key} className="flex flex-col w-72 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{stage.label}</h3>
                    <span className="text-xs text-muted-foreground num">
                      {columnCount}
                    </span>
                  </div>
                  {totalAmount > 0 && (
                    <span className="text-xs text-muted-foreground num">
                      {formatCompactCurrency(totalAmount)}
                    </span>
                  )}
                </div>

                {/* Droppable column */}
                <StageColumn stageKey={stage.key}>
                  {/* Intake cards at the top of the Lead column */}
                  {isLead &&
                    intakeItems.map((item) => (
                      <IntakeCard
                        key={item.id}
                        item={item}
                        onClick={() => onIntakeClick?.(item)}
                      />
                    ))}

                  {/* Sortable deal cards */}
                  <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
                    {stageDeals.length === 0 && (!isLead || intakeItems.length === 0) ? (
                      <EmptyState
                        icon={Layers}
                        title="No deals"
                        compact
                      />
                    ) : (
                      stageDeals.map((deal) => {
                        const stageConfig = stageConfigMap.get(stage.key);
                        return (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            stageConfig={stageConfig}
                            conditionsProgress={conditionsMap.get(deal.id) ?? null}
                            assigneeName={deal.assigned_to ? assigneeMap.get(deal.assigned_to) ?? null : null}
                            onClick={(e) => onDealClick(deal, e)}
                            onHover={() => onDealHover?.(deal.id)}
                            isSelected={deal.id === selectedDealId}
                          />
                        );
                      })
                    )}
                  </SortableContext>
                </StageColumn>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* DragOverlay outside ScrollArea so it's not clipped by scroll container */}
      <DragOverlay>
        {activeDeal ? (
          <DealCardOverlay
            deal={activeDeal}
            stageConfig={stageConfigMap.get(activeDeal.stage)}
            conditionsProgress={conditionsMap.get(activeDeal.id) ?? null}
            assigneeName={activeDeal.assigned_to ? assigneeMap.get(activeDeal.assigned_to) ?? null : null}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
