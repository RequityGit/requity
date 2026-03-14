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
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DealCard, DealCardOverlay } from "./DealCard";
import { IntakeCard } from "./IntakeCard";
import { advanceStageAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UnifiedDeal,
  type UnifiedCardType,
  type StageConfig,
  type UnifiedStage,
  STAGES,
  formatCurrency,
} from "./pipeline-types";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import type { IntakeItem } from "@/lib/intake/types";

interface PipelineKanbanProps {
  deals: UnifiedDeal[];
  cardTypes: UnifiedCardType[];
  stageConfigs: StageConfig[];
  relationshipDealIds: Set<string>;
  onDealClick: (deal: UnifiedDeal) => void;
  intakeItems?: IntakeItem[];
  onIntakeClick?: (item: IntakeItem) => void;
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
  cardTypes,
  stageConfigs,
  relationshipDealIds,
  onDealClick,
  intakeItems = [],
  onIntakeClick,
}: PipelineKanbanProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dealOverrides, setDealOverrides] = useState<Map<string, UnifiedStage>>(
    () => new Map()
  );

  const { allFields } = useUwFieldConfigs();
  const formulaMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of allFields) {
      if (f.formulaExpression) map.set(f.key, f.formulaExpression);
    }
    return map;
  }, [allFields]);

  const cardTypeMap = new Map(cardTypes.map((ct) => [ct.id, ct]));
  const stageConfigMap = new Map(stageConfigs.map((sc) => [sc.stage, sc]));

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

      const currentStage = dealOverrides.get(dealId) ?? deal.stage;
      if (currentStage === newStage) return;

      // Optimistic update
      setDealOverrides((prev) => new Map(prev).set(dealId, newStage));

      const result = await advanceStageAction(dealId, newStage);

      if (result.error) {
        // Revert on error
        setDealOverrides((prev) => {
          const next = new Map(prev);
          next.delete(dealId);
          return next;
        });
        toast({
          variant: "destructive",
          title: "Failed to move deal",
          description: result.error,
        });
      } else {
        // Clear override — server revalidation provides fresh data
        setDealOverrides((prev) => {
          const next = new Map(prev);
          next.delete(dealId);
          return next;
        });
        const stageLabel = STAGES.find((s) => s.key === newStage)?.label ?? newStage;
        toast({
          title: `${deal.name} moved to ${stageLabel}`,
        });
      }
    },
    [deals, dealOverrides, toast]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Find active deal for DragOverlay
  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;
  const activeCardType = activeDeal
    ? cardTypeMap.get(activeDeal.card_type_id)
    : null;

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
          {STAGES.map((stage) => {
            const stageDeals = deals
              .filter(
                (d) => (dealOverrides.get(d.id) ?? d.stage) === stage.key
              )
              .sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity));
            const totalAmount = stageDeals.reduce(
              (sum, d) => sum + (d.amount ?? 0),
              0
            );
            const isLead = stage.key === "lead";
            const columnCount = stageDeals.length + (isLead ? intakeItems.length : 0);

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
                      {formatCurrency(totalAmount, true)}
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
                    <p className="text-xs text-muted-foreground text-center py-8">
                      No deals
                    </p>
                  ) : (
                    stageDeals.map((deal) => {
                      const ct = cardTypeMap.get(deal.card_type_id);
                      if (!ct) return null;
                      return (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          cardType={ct}
                          stageConfig={stageConfigMap.get(stage.key)}
                          hasRelationships={relationshipDealIds.has(deal.id)}
                          formulaMap={formulaMap}
                          onClick={() => onDealClick(deal)}
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
        {activeDeal && activeCardType ? (
          <DealCardOverlay
            deal={activeDeal}
            cardType={activeCardType}
            stageConfig={stageConfigMap.get(activeDeal.stage)}
            hasRelationships={relationshipDealIds.has(activeDeal.id)}
            formulaMap={formulaMap}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
