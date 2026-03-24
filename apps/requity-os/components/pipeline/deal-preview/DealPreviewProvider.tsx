"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { DealPreviewData } from "./useDealPreviewData";

// ─── Types ───

interface DealPreviewState {
  isOpen: boolean;
  selectedDealId: string | null;
  /** Ordered list of deal IDs from the kanban view */
  dealIds: string[];
  /** Index of selected deal within dealIds */
  currentIndex: number;
  /** Cached preview data */
  cache: Map<string, { data: DealPreviewData; fetchedAt: number }>;
  open: (dealId: string, orderedDealIds: string[]) => void;
  close: () => void;
  cycleNext: () => void;
  cyclePrev: () => void;
  /** Get cached data for a deal */
  getCached: (dealId: string) => DealPreviewData | null;
  /** Store fetched data in cache */
  setCache: (dealId: string, data: DealPreviewData) => void;
  /** Invalidate a specific deal's cache (after writes) */
  invalidateCache: (dealId: string) => void;
  /** Prefetch trigger — call to signal that a deal should be fetched */
  prefetchDealId: string | null;
  setPrefetchDealId: (dealId: string | null) => void;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

const DealPreviewContext = createContext<DealPreviewState | null>(null);

// ─── Provider ───

export function DealPreviewProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dealIds, setDealIds] = useState<string[]>([]);
  const [prefetchDealId, setPrefetchDealId] = useState<string | null>(null);
  const cacheRef = useRef(new Map<string, { data: DealPreviewData; fetchedAt: number }>());

  const currentIndex = selectedDealId ? dealIds.indexOf(selectedDealId) : -1;

  const open = useCallback((dealId: string, orderedDealIds: string[]) => {
    setSelectedDealId(dealId);
    setDealIds(orderedDealIds);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedDealId(null);
    setPrefetchDealId(null);
  }, []);

  const cycleNext = useCallback(() => {
    setSelectedDealId((prev) => {
      if (!prev) return prev;
      const ids = dealIds;
      const idx = ids.indexOf(prev);
      if (idx < 0 || idx >= ids.length - 1) return prev;
      return ids[idx + 1];
    });
  }, [dealIds]);

  const cyclePrev = useCallback(() => {
    setSelectedDealId((prev) => {
      if (!prev) return prev;
      const ids = dealIds;
      const idx = ids.indexOf(prev);
      if (idx <= 0) return prev;
      return ids[idx - 1];
    });
  }, [dealIds]);

  const getCached = useCallback((dealId: string): DealPreviewData | null => {
    const entry = cacheRef.current.get(dealId);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
      cacheRef.current.delete(dealId);
      return null;
    }
    return entry.data;
  }, []);

  const setCache = useCallback((dealId: string, data: DealPreviewData) => {
    cacheRef.current.set(dealId, { data, fetchedAt: Date.now() });
  }, []);

  const invalidateCache = useCallback((dealId: string) => {
    cacheRef.current.delete(dealId);
  }, []);

  const value: DealPreviewState = {
    isOpen,
    selectedDealId,
    dealIds,
    currentIndex,
    cache: cacheRef.current,
    open,
    close,
    cycleNext,
    cyclePrev,
    getCached,
    setCache,
    invalidateCache,
    prefetchDealId,
    setPrefetchDealId,
  };

  return (
    <DealPreviewContext.Provider value={value}>
      {children}
    </DealPreviewContext.Provider>
  );
}

// ─── Consumer hook ───

export function useDealPreview() {
  const context = useContext(DealPreviewContext);
  if (!context) {
    throw new Error("useDealPreview must be used within a DealPreviewProvider");
  }
  return context;
}
