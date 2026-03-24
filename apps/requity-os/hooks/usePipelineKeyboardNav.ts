"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type RefObject } from "react";
import { STAGES, type UnifiedDeal } from "@/components/pipeline/pipeline-types";

interface UsePipelineKeyboardNavOptions {
  deals: UnifiedDeal[];
  isModalOpen: boolean;
  isKanbanView: boolean;
  onOpenPreview: (dealId: string, orderedDealIds: string[]) => void;
  onOpenNewDeal: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

interface UsePipelineKeyboardNavReturn {
  selectedColumnIndex: number | null;
  selectedCardIndex: number | null;
  selectedDealId: string | null;
  clearSelection: () => void;
}

export function usePipelineKeyboardNav({
  deals,
  isModalOpen,
  isKanbanView,
  onOpenPreview,
  onOpenNewDeal,
  searchInputRef,
}: UsePipelineKeyboardNavOptions): UsePipelineKeyboardNavReturn {
  const [selectedColIdx, setSelectedColIdx] = useState<number | null>(null);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);

  // Compute columns from deals (same sort order as PipelineKanban)
  const columns = useMemo(
    () =>
      STAGES.map((stage) => ({
        stageKey: stage.key,
        dealIds: deals
          .filter((d) => d.stage === stage.key)
          .sort((a, b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity))
          .map((d) => d.id),
      })),
    [deals]
  );

  // Flat ordered deal IDs across all columns
  const orderedDealIds = useMemo(
    () => columns.flatMap((col) => col.dealIds),
    [columns]
  );

  // Derive selected deal ID
  const selectedDealId = useMemo(() => {
    if (selectedColIdx == null || selectedCardIdx == null) return null;
    return columns[selectedColIdx]?.dealIds[selectedCardIdx] ?? null;
  }, [columns, selectedColIdx, selectedCardIdx]);

  // Refs for reading current state in event handler without stale closures
  const colRef = useRef(selectedColIdx);
  const cardRef = useRef(selectedCardIdx);
  colRef.current = selectedColIdx;
  cardRef.current = selectedCardIdx;

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const orderedRef = useRef(orderedDealIds);
  orderedRef.current = orderedDealIds;

  const onOpenPreviewRef = useRef(onOpenPreview);
  onOpenPreviewRef.current = onOpenPreview;

  const onOpenNewDealRef = useRef(onOpenNewDeal);
  onOpenNewDealRef.current = onOpenNewDeal;

  // Clear selection if selected card no longer exists (deal moved/deleted/filtered)
  useEffect(() => {
    if (selectedColIdx == null || selectedCardIdx == null) return;
    const col = columns[selectedColIdx];
    if (!col || selectedCardIdx >= col.dealIds.length) {
      setSelectedColIdx(null);
      setSelectedCardIdx(null);
    }
  }, [columns, selectedColIdx, selectedCardIdx]);

  // Scroll selected card into view
  useEffect(() => {
    if (!selectedDealId) return;
    const el = document.querySelector(`[data-deal-id="${selectedDealId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedDealId]);

  useEffect(() => {
    if (isModalOpen || !isKanbanView) return;

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.tagName === "SELECT";

      // "/" focuses search (only when not already in an input)
      if (e.key === "/" && !isInput) {
        if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="listbox"]')) return;
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Esc from focused input: blur it and return to board
      if (e.key === "Escape" && isInput) {
        (target as HTMLElement).blur();
        return;
      }

      // All other shortcuts: no input focused, no overlay open
      if (isInput) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="listbox"]')) return;

      const cols = columnsRef.current;
      const curCol = colRef.current;
      const curCard = cardRef.current;

      switch (e.key) {
        case "ArrowRight": {
          e.preventDefault();
          if (curCol == null) {
            const idx = cols.findIndex((c) => c.dealIds.length > 0);
            if (idx >= 0) {
              setSelectedColIdx(idx);
              setSelectedCardIdx(0);
            }
          } else {
            const col = cols[curCol];
            if (col && curCard != null && curCard < col.dealIds.length - 1) {
              setSelectedCardIdx(curCard + 1);
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (curCard != null && curCard > 0) {
            setSelectedCardIdx(curCard - 1);
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (curCol == null) {
            const idx = cols.findIndex((c) => c.dealIds.length > 0);
            if (idx >= 0) {
              setSelectedColIdx(idx);
              setSelectedCardIdx(0);
            }
          } else {
            for (let i = curCol + 1; i < cols.length; i++) {
              if (cols[i].dealIds.length > 0) {
                setSelectedColIdx(i);
                setSelectedCardIdx(Math.min(curCard ?? 0, cols[i].dealIds.length - 1));
                break;
              }
            }
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (curCol != null) {
            for (let i = curCol - 1; i >= 0; i--) {
              if (cols[i].dealIds.length > 0) {
                setSelectedColIdx(i);
                setSelectedCardIdx(Math.min(curCard ?? 0, cols[i].dealIds.length - 1));
                break;
              }
            }
          }
          break;
        }
        case " ": {
          e.preventDefault();
          if (curCol != null && curCard != null) {
            const dealId = cols[curCol]?.dealIds[curCard];
            if (dealId) {
              onOpenPreviewRef.current(dealId, orderedRef.current);
            }
          }
          break;
        }
        case "n":
        case "N": {
          e.preventDefault();
          onOpenNewDealRef.current();
          break;
        }
        case "Escape": {
          setSelectedColIdx(null);
          setSelectedCardIdx(null);
          break;
        }
        case "?": {
          e.preventDefault();
          // TODO: build full shortcut overlay
          console.log("Pipeline keyboard shortcuts");
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isKanbanView, searchInputRef]);

  const clearSelection = useCallback(() => {
    setSelectedColIdx(null);
    setSelectedCardIdx(null);
  }, []);

  return {
    selectedColumnIndex: selectedColIdx,
    selectedCardIndex: selectedCardIdx,
    selectedDealId,
    clearSelection,
  };
}
