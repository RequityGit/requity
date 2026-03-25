"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  searchContacts,
  searchCompanies,
  type ContactSearchResult,
  type CompanySearchResult,
} from "@/lib/actions/relationship-actions";

export type EntityType = "contact" | "company";
export type SearchResult = ContactSearchResult | CompanySearchResult;

interface UseRelationshipSearchOptions {
  entityType: EntityType;
  excludeIds?: string[];
  debounceMs?: number;
  minChars?: number;
}

interface UseRelationshipSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  loading: boolean;
  searched: boolean;
  reset: () => void;
}

/**
 * Hook for debounced relationship entity search.
 * Works for both contacts and companies via the unified server actions.
 */
export function useRelationshipSearch({
  entityType,
  excludeIds,
  debounceMs = 250,
  minChars = 2,
}: UseRelationshipSearchOptions): UseRelationshipSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const skipNextRef = useRef(false);

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (!debouncedQuery || debouncedQuery.trim().length < minChars) {
      setResults([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const doSearch = async () => {
      if (entityType === "contact") {
        const res = await searchContacts(debouncedQuery, { excludeIds });
        if (!cancelled) {
          setResults(res.contacts);
          setSearched(true);
          setLoading(false);
        }
      } else {
        const res = await searchCompanies(debouncedQuery, { excludeIds });
        if (!cancelled) {
          setResults(res.companies);
          setSearched(true);
          setLoading(false);
        }
      }
    };

    doSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, entityType, excludeIds, minChars]);

  const reset = useCallback(() => {
    skipNextRef.current = true;
    setQuery("");
    setResults([]);
    setSearched(false);
    setLoading(false);
  }, []);

  return { query, setQuery, results, loading, searched, reset };
}
