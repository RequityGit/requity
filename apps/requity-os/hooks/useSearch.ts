"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "./useDebounce";

export interface SearchResult {
  id: string;
  entity_type: string;
  metadata: Record<string, unknown>;
  updated_at: string;
  rank: number;
}

const CACHE_TTL = 30_000; // 30 seconds
const cache = new Map<string, { data: SearchResult[]; timestamp: number }>();

function getCacheKey(query: string, filter: string | null): string {
  return `${query}::${filter || "all"}`;
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 200);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (q: string, filter: string | null) => {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Truncate very long queries
      const trimmedQuery = q.trim().slice(0, 100);

      // Check cache
      const cacheKey = getCacheKey(trimmedQuery, filter);
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setResults(cached.data);
        setLoading(false);
        return;
      }

      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: trimmedQuery, limit: "25" });
        if (filter) params.set("filter", filter);

        const res = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Search request failed");
        }

        const data = await res.json();
        const searchResults: SearchResult[] = data.results || [];

        // Update cache
        cache.set(cacheKey, { data: searchResults, timestamp: Date.now() });

        setResults(searchResults);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return; // Ignored — request was cancelled
        }
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    search(debouncedQuery, activeFilter);
  }, [debouncedQuery, activeFilter, search]);

  return { query, setQuery, results, loading, activeFilter, setActiveFilter };
}
