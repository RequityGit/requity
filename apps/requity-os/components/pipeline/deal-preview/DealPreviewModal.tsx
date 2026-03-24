"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDealPreview } from "./DealPreviewProvider";
import { useDealPreviewData } from "./useDealPreviewData";
import { DealPreviewHeader } from "./DealPreviewHeader";
import { DealPreviewVitals } from "./DealPreviewVitals";
import { DealPreviewActivity } from "./DealPreviewActivity";
import { DealPreviewConditions } from "./DealPreviewConditions";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/lib/toast";
import {
  advanceStageAction,
  regressStageAction,
  addDealConditionAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import type { UnifiedStage } from "../pipeline-types";
import type { DealNote, DealPreviewData } from "./useDealPreviewData";

// ─── Stage order ───
const STAGE_ORDER: UnifiedStage[] = ["lead", "analysis", "negotiation", "execution", "closed"];

const STAGE_LABELS: Record<UnifiedStage, string> = {
  lead: "Lead",
  analysis: "Analysis",
  negotiation: "Negotiation",
  execution: "Execution",
  closed: "Closed",
};

// ─── Component ───

interface DealPreviewModalProps {
  currentUserId: string;
  currentUserName: string;
  /** Map of profile_id -> full_name for team member display */
  teamMemberNames?: Map<string, string>;
}

export function DealPreviewModal({
  currentUserId,
  currentUserName,
  teamMemberNames,
}: DealPreviewModalProps) {
  const router = useRouter();
  const {
    isOpen,
    selectedDealId,
    dealIds,
    currentIndex,
    close,
    cycleNext,
    cyclePrev,
    setCache,
    invalidateCache,
  } = useDealPreview();

  const { data, loading, error, refetch } = useDealPreviewData();
  const [stageLoading, setStageLoading] = useState(false);

  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const conditionInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Keep refs for stage handlers so keyboard effect doesn't go stale
  const handleAdvanceRef = useRef<() => void>(() => {});
  const handleRegressRef = useRef<() => void>(() => {});

  // ── Stage actions ──
  const handleAdvanceStage = useCallback(async () => {
    if (!data?.deal || stageLoading) return;
    const currentIdx = STAGE_ORDER.indexOf(data.deal.stage as UnifiedStage);
    if (currentIdx < 0 || currentIdx >= STAGE_ORDER.length - 1) return;

    const nextStage = STAGE_ORDER[currentIdx + 1];
    const dealId = data.deal.id;
    setStageLoading(true);

    // Optimistic update (immutable)
    const prevDeal = data.deal;
    const optimisticData: DealPreviewData = {
      ...data,
      deal: {
        ...data.deal,
        stage: nextStage,
        stage_entered_at: new Date().toISOString(),
        days_in_stage: 0,
      },
    };
    setCache(dealId, optimisticData);

    try {
      const result = await advanceStageAction(dealId, nextStage);
      if ("error" in result) {
        setCache(dealId, { ...data, deal: prevDeal });
        showError("Could not advance stage", result.error);
      } else {
        showSuccess(`Moved to ${STAGE_LABELS[nextStage]}`);
      }
    } catch {
      setCache(dealId, { ...data, deal: prevDeal });
      showError("Could not advance stage");
    } finally {
      setStageLoading(false);
    }
  }, [data, stageLoading, setCache]);

  const handleRegressStage = useCallback(async () => {
    if (!data?.deal || stageLoading) return;
    const currentIdx = STAGE_ORDER.indexOf(data.deal.stage as UnifiedStage);
    if (currentIdx <= 0) return;

    const prevStageKey = STAGE_ORDER[currentIdx - 1];
    const dealId = data.deal.id;
    setStageLoading(true);

    const prevDeal = data.deal;
    const optimisticData: DealPreviewData = {
      ...data,
      deal: {
        ...data.deal,
        stage: prevStageKey,
        stage_entered_at: new Date().toISOString(),
        days_in_stage: 0,
      },
    };
    setCache(dealId, optimisticData);

    try {
      const result = await regressStageAction(dealId, prevStageKey);
      if ("error" in result) {
        setCache(dealId, { ...data, deal: prevDeal });
        showError("Could not regress stage", result.error);
      }
    } catch {
      setCache(dealId, { ...data, deal: prevDeal });
      showError("Could not regress stage");
    } finally {
      setStageLoading(false);
    }
  }, [data, stageLoading, setCache]);

  // Keep refs in sync
  handleAdvanceRef.current = handleAdvanceStage;
  handleRegressRef.current = handleRegressStage;

  // ── Open full deal page (close modal + navigate) ──
  const handleOpenFullPage = useCallback(() => {
    if (!data?.deal) return;
    close();
    router.push(`/pipeline/${data.deal.deal_number || data.deal.id}`);
  }, [data, close, router]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === " " && !isInput) {
        e.preventDefault();
        if (data?.deal) {
          close();
          router.push(`/pipeline/${data.deal.deal_number || data.deal.id}`);
        }
        return;
      }

      // Disable other shortcuts when in input
      if (isInput) return;

      if (e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        cycleNext();
      } else if (e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        cyclePrev();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleAdvanceRef.current();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleRegressRef.current();
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        noteInputRef.current?.focus();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        conditionInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, data, close, cycleNext, cyclePrev, router]);

  // ── Post note ──
  const handlePostNote = useCallback(
    async (body: string, isInternal: boolean) => {
      if (!data?.deal) return;
      const supabase = createClient();

      // Optimistic insert
      const tempNote: DealNote = {
        id: `temp-${Date.now()}`,
        body,
        author_id: currentUserId,
        author_name: currentUserName,
        is_internal: isInternal,
        is_pinned: false,
        mentions: null,
        created_at: new Date().toISOString(),
        parent_note_id: null,
      };

      const updatedData: DealPreviewData = {
        ...data,
        notes: [tempNote, ...data.notes],
      };
      setCache(data.deal.id, updatedData);

      try {
        const { error: insertError } = await supabase
          .from("notes" as never)
          .insert({
            deal_id: data.deal.id,
            body,
            author_id: currentUserId,
            author_name: currentUserName,
            is_internal: isInternal,
          } as never);

        if (insertError) {
          setCache(data.deal.id, data);
          showError("Could not post note", insertError.message);
        }
      } catch {
        setCache(data.deal.id, data);
        showError("Could not post note");
      }
    },
    [data, currentUserId, currentUserName, setCache]
  );

  // ── Add condition ──
  const handleAddCondition = useCallback(
    async (conditionName: string) => {
      if (!data?.deal) return;

      try {
        const result = await addDealConditionAction(
          data.deal.id,
          conditionName,
          "general",
          data.deal.stage
        );
        if ("error" in result) {
          showError("Could not add condition", result.error);
        } else {
          invalidateCache(data.deal.id);
          refetch();
          showSuccess("Condition added");
        }
      } catch {
        showError("Could not add condition");
      }
    },
    [data, invalidateCache, refetch]
  );

  // ── Render ──
  if (!isOpen) return null;

  // Determine what to show: always show skeleton if no data yet (regardless of loading flag)
  const showSkeleton = !data && !error;
  const showError_ = !data && error;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[3vh]"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[92vh] w-[1120px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl rq-animate-scale-in"
      >
        {showSkeleton ? (
          <ModalSkeleton />
        ) : showError_ ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={refetch} className="mt-2 text-xs text-primary hover:underline">
                Retry
              </button>
            </div>
          </div>
        ) : data ? (
          <>
            <DealPreviewHeader
              data={data}
              currentIndex={currentIndex}
              totalDeals={dealIds.length}
              onCyclePrev={cyclePrev}
              onCycleNext={cycleNext}
              onAdvanceStage={handleAdvanceStage}
              onRegressStage={handleRegressStage}
              onClose={close}
              onOpenFullPage={handleOpenFullPage}
              stageLoading={stageLoading}
              teamMemberNames={teamMemberNames}
            />

            <div className="h-px bg-border" />

            {/* 3-column body */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <DealPreviewVitals data={data} teamMemberNames={teamMemberNames} />
              <DealPreviewActivity
                data={data}
                onPostNote={handlePostNote}
                noteInputRef={noteInputRef}
              />
              <DealPreviewConditions
                conditions={data.conditions}
                dealStage={data.deal.stage}
                onAddCondition={handleAddCondition}
                conditionFormRef={conditionInputRef}
              />
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/30 px-5 py-[7px]">
              <div className="flex items-center gap-3.5 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Kbd>&larr;</Kbd><Kbd>&rarr;</Kbd> cycle deals</span>
                <span className="flex items-center gap-1"><Kbd>&uarr;</Kbd><Kbd>&darr;</Kbd> change stage</span>
                <span className="flex items-center gap-1"><Kbd>N</Kbd> note</span>
                <span className="flex items-center gap-1"><Kbd>C</Kbd> condition</span>
                <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
                <span className="flex items-center gap-1"><Kbd>Space</Kbd> open</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Skeleton ───

function ModalSkeleton() {
  return (
    <div className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="mb-2 h-6 w-80" />
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="mb-4 h-9 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-[400px] w-[280px]" />
        <Skeleton className="h-[400px] flex-1" />
        <Skeleton className="h-[400px] w-[310px]" />
      </div>
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
