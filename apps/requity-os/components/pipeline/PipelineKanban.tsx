"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { showSuccess, showError } from "@/lib/toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DealCard, DealCardOverlay } from "./DealCard";
import { IntakeCard } from "./IntakeCard";
import { advanceStageAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
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

interface PipelineKanbanProps {
  deals: UnifiedDeal[];
  stageConfigs: StageConfig[];
  onDealClick: (deal: UnifiedDeal, e?: React.MouseEvent) => void;
  onDealHover?: (dealId: string) => void;
  onTogglePriority?: (dealId: string, isPriority: boolean) => void;
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
  onTogglePriority,
  intakeItems = [],
  onIntakeClick,
  teamMembers,
  conditionsMap,
  selectedDealId,
}: PipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Use store's moveDeal for optimistic updates instead of local dealOverrides
  const moveDeal = usePipelineStore((s) => s.moveDeal);

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

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);

      const { active, over } = event;
      if (!over) return;

      const dealId = active.id as string;
      const newStage = over.id as UnifiedStage;
      const deal = deals.find((d) => d.id === dealId);
      if (!deal) return;

      if (deal.stage === newStage) return;

      // Save original stage for potential revert
      const originalStage = deal.stage;

      // Optimistic update via store (UI re-renders instantly)
      moveDeal(dealId, newStage);

      // Fire server action (realtime will confirm/correct)
      const result = await advanceStageAction(dealId, newStage);

      if (result.error) {
        // Revert on error
        moveDeal(dealId, originalStage);
        showError("Could not move deal", result.error);
      } else {
        const stageLabel = STAGES.find((s) => s.key === newStage)?.label ?? newStage;
        showSuccess(`${deal.name} moved to ${stageLabel}`);
      }
    },
    [deals, moveDeal]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Find active deal for DragOverlay
  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  // Memoize stage calculations to avoid recomputing on every render
  const stageData = useMemo(() => {
    return STAGES.map((stage) => {
      const stageDeals = deals
        .filter((d) => d.stage === stage.key)
        .sort((a, b) => {
          // Priority deals first, then by amount descending
          if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
          return (b.amount ?? -Infinity) - (a.amount ?? -Infinity);
        });

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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {stageData.map(({ stage, stageDeals, totalAmount, isLead, columnCount }) => {

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

                  {/* Regular deal cards */}
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
                          onTogglePriority={onTogglePriority}
                          isSelected={deal.id === selectedDealId}
                        />
                      );
                    })
                  )}
                </StageColumn>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

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
