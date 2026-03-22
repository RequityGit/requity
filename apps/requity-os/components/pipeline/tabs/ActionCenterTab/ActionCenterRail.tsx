"use client";

import { useMemo, useState, useRef, useCallback } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { RailConditionItem } from "./RailConditionItem";
import { ConditionDetailPanel } from "./ConditionDetailPanel";
import type {
  DealConditionRow,
  ConditionDocument,
  DealTask,
} from "./useActionCenterData";

interface ActionCenterRailProps {
  conditions: DealConditionRow[];
  conditionDocs: ConditionDocument[];
  tasks: DealTask[];
  loading: boolean;
  dealId: string;
  loanAmount?: number | null;
  ltv?: number | null;
  closeDate?: string | null;
  onToggleTask: (
    taskId: string,
    currentStatus: string
  ) => Promise<{ error?: string; success?: boolean }>;
  onConditionStatusChange: (conditionId: string, newStatus: string) => void;
}

export function ActionCenterRail({
  conditions,
  conditionDocs,
  loading,
  dealId,
  onConditionStatusChange,
}: ActionCenterRailProps) {
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollTop = useRef(0);

  const selectedCondition = useMemo(
    () => conditions.find((c) => c.id === selectedConditionId) ?? null,
    [conditions, selectedConditionId]
  );

  const handleConditionClick = useCallback((conditionId: string) => {
    if (scrollRef.current) {
      savedScrollTop.current = scrollRef.current.scrollTop;
    }
    setSelectedConditionId(conditionId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedConditionId(null);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = savedScrollTop.current;
      }
    });
  }, []);

  const clearedConditions = useMemo(
    () =>
      conditions.filter(
        (c) =>
          c.status === "approved" ||
          c.status === "waived" ||
          c.status === "not_applicable"
      ).length,
    [conditions]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full shrink-0 rounded-xl border bg-card overflow-hidden transition-all duration-normal ease-out-rq",
        selectedCondition ? "w-[520px]" : "w-[360px]"
      )}
    >
      {selectedCondition ? (
        <ConditionDetailPanel
          condition={selectedCondition}
          dealId={dealId}
          onBack={handleBack}
          onStatusChange={onConditionStatusChange}
        />
      ) : (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Execution</h3>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {clearedConditions}/{conditions.length}
              </span>
            </div>
          </div>

          {/* Scrollable list */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div>
                {/* Conditions section header with inline progress */}
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="rq-micro-label">CONDITIONS</span>
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                      {clearedConditions}/{conditions.length}
                    </span>
                    <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-normal"
                        style={{
                          width:
                            conditions.length > 0
                              ? `${Math.round((clearedConditions / conditions.length) * 100)}%`
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {conditions.length === 0 ? (
                  <EmptyState
                    icon={ClipboardCheck}
                    title="No conditions"
                    compact
                  />
                ) : (
                  conditions.map((c) => (
                    <RailConditionItem
                      key={c.id}
                      condition={c}
                      documents={conditionDocs}
                      dealId={dealId}
                      onStatusChange={onConditionStatusChange}
                      onOpenDetail={handleConditionClick}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
