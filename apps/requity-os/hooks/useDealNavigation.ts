"use client";

import { useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "requity_pipeline_deal_order";
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface StoredDealOrder {
  dealIds: string[];
  timestamp: number;
}

/**
 * Store the ordered list of deal IDs from the pipeline view.
 * Called when navigating from pipeline to a deal page.
 */
export function storeDealOrder(dealIds: string[]) {
  if (typeof window === "undefined") return;
  const data: StoredDealOrder = { dealIds, timestamp: Date.now() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable
  }
}

function getStoredDealOrder(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredDealOrder = JSON.parse(raw);
    if (Date.now() - data.timestamp > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.dealIds;
  } catch {
    return null;
  }
}

interface DealNavigation {
  hasPrev: boolean;
  hasNext: boolean;
  prevHref: string | null;
  nextHref: string | null;
  goToPrev: () => void;
  goToNext: () => void;
  currentIndex: number;
  totalDeals: number;
}

/**
 * Provides prev/next deal navigation based on the pipeline's deal ordering.
 * When the user navigates from the pipeline, the ordered deal IDs are stored
 * in sessionStorage. This hook reads them and computes prev/next.
 *
 * @param dealId - The current deal's UUID
 * @param dealNumber - The current deal's display number (used for URL if available)
 */
export function useDealNavigation(dealId: string, dealNumber?: string | null): DealNavigation {
  const router = useRouter();

  const dealIds = useMemo(() => getStoredDealOrder(), []);

  const currentIndex = useMemo(() => {
    if (!dealIds) return -1;
    return dealIds.indexOf(dealId);
  }, [dealIds, dealId]);

  const hasPrev = currentIndex > 0;
  const hasNext = dealIds !== null && currentIndex >= 0 && currentIndex < dealIds.length - 1;

  const prevHref = hasPrev && dealIds ? `/pipeline/${dealIds[currentIndex - 1]}` : null;
  const nextHref = hasNext && dealIds ? `/pipeline/${dealIds[currentIndex + 1]}` : null;

  const goToPrev = useCallback(() => {
    if (prevHref) router.push(prevHref);
  }, [prevHref, router]);

  const goToNext = useCallback(() => {
    if (nextHref) router.push(nextHref);
  }, [nextHref, router]);

  // Prefetch adjacent deals
  useEffect(() => {
    if (prevHref) router.prefetch(prevHref);
    if (nextHref) router.prefetch(nextHref);
  }, [prevHref, nextHref, router]);

  // Keyboard shortcuts: ArrowLeft/ArrowRight for prev/next
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        goToNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, goToPrev, goToNext]);

  return {
    hasPrev,
    hasNext,
    prevHref,
    nextHref,
    goToPrev,
    goToNext,
    currentIndex,
    totalDeals: dealIds?.length ?? 0,
  };
}
