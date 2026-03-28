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
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { showSuccess, showError, showWarning } from "@/lib/toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DealCard, DealCardOverlay } from "./DealCard";
import { IntakeCard } from "./IntakeCard";
import {
  moveDealAndReorderAction,
  updateDealStageAction,
  reorderDealsAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UnifiedDeal,
  type StageConfig,
  type UnifiedStage,
  STAGES,
  ORIGINATION_STAGES,
  SERVICING_STAGES,
  isServicingStage,
  getStageLabel,
} from "./pipeline-types";
import { formatCompactCurrency } from "@/lib/format";
import { usePipelineStore } from "@/stores/pipeline-store";
import type { IntakeItem } from "@/lib/intake/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { Layers } from "lucide-react";
import type { ConditionsProgress } from "@/stores/pipeline-store";

// Static set of ALL possible stage keys for collision detection
const ALL_STAGE_KEYS = new Set<string>([
  ...STAGES.map((s) => s.key),
  ...SERVICING_STAGES.map((s) => s.key),
]);
// Legacy alias used by collision detection
const STAGE_KEY_SET = ALL_STAGE_KEYS;

/**
 * Custom collision detection that prioritises card-level droppables over
 * stage-column droppables so within-column reorders resolve correctly.
 */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id);

  // 1. Find all droppables whose rect contains the pointer
  const pointerCollisions = pointerWithin(args).filter(
    (collision) => String(collision.id) !== activeId
  );

  if (pointerCollisions.length > 0) {
    // 2. Prefer card-level droppables (IDs NOT in STAGE_KEY_SET),
    // excluding the active card itself to avoid "self-collision" lock.
    const cardCollisions = pointerCollisions.filter(
      (c) => !STAGE_KEY_SET.has(String(c.id)) && String(c.id) !== activeId
    );

    if (cardCollisions.length > 0) {
      const cardIds = new Set(cardCollisions.map((c) => String(c.id)));
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) =>
          cardIds.has(String(c.id))
        ),
      });
    }

    // Only container-level hits (empty column or whitespace). Remove active ID
    // if it appears (defensive) so we can still target a stage.
    const containerHits = pointerCollisions.filter(
      (c) => String(c.id) !== activeId
    );
    if (containerHits.length > 0) return containerHits;
  }

  // 3. Fallback for fast pointer movement: use rect intersection
  const rectHits = rectIntersection(args).filter(
    (collision) => String(collision.id) !== activeId
  );
  if (rectHits.length > 0) return rectHits;

  // 4. Last resort: closestCenter across stage columns only
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
  lifecycleView?: boolean;
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
  lifecycleView = false,
}: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // During drag, track which stage the dragged card is visually in.
  // This lets SortableContext items update so the target column makes room.
  const [dragStageOverride, setDragStageOverride] = useState<{
    dealId: string;
    stage: UnifiedStage;
  } | null>(null);
  const dragStageOverrideRef = useRef(dragStageOverride);
  dragStageOverrideRef.current = dragStageOverride;

  // Store actions for optimistic updates
  const moveDeal = usePipelineStore((s) => s.moveDeal);
  const moveAndReorderDeal = usePipelineStore((s) => s.moveAndReorderDeal);
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

  const stageConfigMap = useMemo(
    () => new Map(stageConfigs.map((sc) => [sc.stage, sc])),
    [stageConfigs]
  );

  // Keep a ref to the latest deals to avoid stale closures in drag handlers
  const dealsRef = useRef(deals);
  dealsRef.current = deals;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      setActiveId(id);
      setDraggingDealId(id);
    },
    [setDraggingDealId]
  );

  /** Move a card between columns visually during drag (before drop). */
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dragId = active.id as string;
    const overId = over.id as string;

    // Determine target stage from the over element
    const isOverStage = STAGE_KEY_SET.has(overId);
    let targetStage: UnifiedStage | null = null;

    if (isOverStage) {
      targetStage = overId as UnifiedStage;
    } else {
      const overDeal = dealsRef.current.find((d) => d.id === overId);
      if (overDeal) targetStage = overDeal.stage;
    }

    if (!targetStage) return;

    // Get the deal's current effective stage (with any existing override)
    const deal = dealsRef.current.find((d) => d.id === dragId);
    if (!deal) return;

    const currentEffective = dragStageOverrideRef.current?.dealId === dragId
      ? dragStageOverrideRef.current.stage
      : deal.stage;

    if (currentEffective === targetStage) return;

    const override = { dealId: dragId, stage: targetStage };
    dragStageOverrideRef.current = override;
    setDragStageOverride(override);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      // Capture the override before clearing — this is the visual destination
      const override = dragStageOverrideRef.current;
      setActiveId(null);
      setDragStageOverride(null);
      dragStageOverrideRef.current = null;

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

      // Determine target: use override stage if we have one, otherwise derive from over element
      const isDropOnStage = STAGE_KEY_SET.has(overId);
      const overDeal = !isDropOnStage
        ? currentDeals.find((d) => d.id === overId)
        : null;
      const targetStage = override?.stage
        ?? (isDropOnStage
          ? (overId as UnifiedStage)
          : overDeal
            ? overDeal.stage
            : deal.stage);

      const sameColumn = deal.stage === targetStage;

      // Dropped in same spot — no-op
      if (sameColumn && dealId === overId) {
        setDraggingDealId(null);
        return;
      }

      // Build ordered list for the target stage
      const stageDeals = currentDeals
        .filter((d) => d.stage === targetStage)
        .sort(
          (a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity)
        );

      try {
        if (sameColumn) {
          // ── Reorder within same column ──
          const oldIndex = stageDeals.findIndex((d) => d.id === dealId);
          // Dropping on column whitespace means "move to end".
          const newIndex = overDeal
            ? stageDeals.findIndex((d) => d.id === overId)
            : stageDeals.length - 1;

          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
            return;
          }

          const reordered = arrayMove(stageDeals, oldIndex, newIndex);
          const orderedIds = reordered.map((d) => d.id);

          // Optimistic update
          reorderDeal(orderedIds, targetStage);

          // Persist
          const result = await reorderDealsAction(orderedIds, targetStage);
          if (result.error) {
            const originalIds = stageDeals.map((d) => d.id);
            reorderDeal(originalIds, targetStage);
            showError("Could not reorder deals", result.error);
          }
        } else {
          // ── Cross-column move ──
          const originalStage = deal.stage;

          // Figure out insertion index in target column
          let insertIndex = stageDeals.length; // default: end
          if (overDeal) {
            const overIndex = stageDeals.findIndex((d) => d.id === overId);
            if (overIndex !== -1) insertIndex = overIndex;
          }

          // Build new target column order
          const targetIds = stageDeals
            .filter((d) => d.id !== dealId)
            .map((d) => d.id);
          targetIds.splice(insertIndex, 0, dealId);

          // Atomic optimistic update — single store mutation, one version bump,
          // one subscriber notification (prevents cascading re-renders)
          moveAndReorderDeal(dealId, targetStage, targetIds);

          // Persist stage + order in a single server action call
          const moveResult = await moveDealAndReorderAction(
            dealId,
            targetStage,
            targetIds,
            insertIndex
          );

          if (moveResult.error) {
            // Fallback: persist stage change only so drops still work even if
            // combined move+reorder path fails.
            const fallback = await updateDealStageAction(
              dealId,
              targetStage,
              insertIndex
            );

            if (fallback.error) {
              // Revert optimistic update only if both primary and fallback fail
              moveDeal(dealId, originalStage);
              showError("Could not move deal", fallback.error);
              return;
            }

            const stageLabel = getStageLabel(targetStage);
            showWarning(
              `${deal.name} moved to ${stageLabel}`,
              "Order could not be saved right now. Stage change was saved."
            );
            return;
          }

          const stageLabel = getStageLabel(targetStage);
          showSuccess(`${deal.name} moved to ${stageLabel}`);
        }
      } finally {
        // Always clear the dragging guard so realtime resumes
        setDraggingDealId(null);
      }
    },
    [moveDeal, moveAndReorderDeal, reorderDeal, setDraggingDealId]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDragStageOverride(null);
    dragStageOverrideRef.current = null;
    setDraggingDealId(null);
  }, [setDraggingDealId]);

  // Find active deal for DragOverlay
  const activeDeal = activeId
    ? deals.find((d) => d.id === activeId)
    : null;

  // Determine columns based on lifecycle view
  const boardColumns = useMemo(() => {
    if (lifecycleView) {
      return [
        ...ORIGINATION_STAGES,
        ...SERVICING_STAGES,
      ];
    }
    return STAGES;
  }, [lifecycleView]);

  // Memoize stage calculations — apply dragStageOverride so the dragged
  // card visually appears in the target column during drag.
  const stageData = useMemo(() => {
    return boardColumns.map((stage) => {
      const stageDeals = deals
        .filter((d) => {
          // Get effective stage for the deal (considering drag override)
          const effectiveStage = (dragStageOverride && d.id === dragStageOverride.dealId)
            ? dragStageOverride.stage
            : d.stage;

          if (stage.key === "closed" && !lifecycleView) {
            // In default view, "Closed" column collects all closed_* stages
            return effectiveStage === "closed" || (effectiveStage.startsWith("closed_") && effectiveStage !== "closed_lost");
          }
          return effectiveStage === stage.key;
        })
        .sort(
          (a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity)
        );

      const totalAmount = stageDeals.reduce(
        (sum, d) => sum + (d.amount ?? 0),
        0
      );
      const isLead = stage.key === "lead";
      const columnCount =
        stageDeals.length + (isLead ? intakeItems.length : 0);
      const isActiveServicing = stage.key === "closed_active";

      return { stage, stageDeals, totalAmount, isLead, columnCount, isActiveServicing };
    });
  }, [deals, intakeItems.length, dragStageOverride, boardColumns, lifecycleView]);

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
          {stageData.map(
            ({ stage, stageDeals, totalAmount, isLead, columnCount, isActiveServicing }) => {
              const dealIds = stageDeals.map((d) => d.id);

              return (
                <div key={stage.key} className="flex flex-col w-72 shrink-0">
                  {/* Column header */}
                  <div className={cn(
                    "flex items-center justify-between mb-3 px-1",
                    isActiveServicing && "px-2 py-1 -mx-1 rounded-md bg-emerald-500/[0.06] border border-emerald-500/15"
                  )}>
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "text-sm font-medium",
                        isActiveServicing && "text-emerald-700 dark:text-emerald-400"
                      )}>{stage.label}</h3>
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
                    <SortableContext
                      items={dealIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {stageDeals.length === 0 &&
                      (!isLead || intakeItems.length === 0) ? (
                        <EmptyState icon={Layers} title="No deals" compact />
                      ) : (
                        stageDeals.map((deal) => {
                          const stageConfig = stageConfigMap.get(stage.key);
                          return (
                            <DealCard
                              key={deal.id}
                              deal={deal}
                              stageConfig={stageConfig}
                              conditionsProgress={
                                conditionsMap.get(deal.id) ?? null
                              }
                              assigneeName={
                                deal.assigned_to
                                  ? assigneeMap.get(deal.assigned_to) ?? null
                                  : null
                              }
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
            }
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* DragOverlay outside ScrollArea so it's not clipped by scroll container */}
      <DragOverlay dropAnimation={null}>
        {activeDeal ? (
          <DealCardOverlay
            deal={activeDeal}
            stageConfig={stageConfigMap.get(
              dragStageOverride?.dealId === activeDeal.id
                ? dragStageOverride.stage
                : activeDeal.stage
            )}
            conditionsProgress={conditionsMap.get(activeDeal.id) ?? null}
            assigneeName={
              activeDeal.assigned_to
                ? assigneeMap.get(activeDeal.assigned_to) ?? null
                : null
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
