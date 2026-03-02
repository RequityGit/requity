"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import { useSearch, type SearchResult as SearchResultType } from "@/hooks/useSearch";
import { SearchResult } from "./SearchResult";
import { CategoryChips } from "./CategoryChips";
import { NoResults } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategoriesForRole,
  getEntityUrl,
  saveRecentSearch,
  getRecentSearches,
  type SearchEntityType,
} from "@/lib/search-utils";
import { Clock } from "lucide-react";

interface CommandSearchProps {
  role: string;
}

export function CommandSearch({ role }: CommandSearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { query, setQuery, results, loading, activeFilter, setActiveFilter } =
    useSearch();

  const categories = useMemo(() => getCategoriesForRole(role), [role]);

  // Compute result counts per entity type for chip badges
  const resultCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const result of results) {
      const type = result.entity_type;
      counts[type] = (counts[type] || 0) + 1;
    }
    const chipCounts: Record<string, number> = {};
    for (const cat of categories) {
      if (cat.key) {
        chipCounts[cat.key] = cat.entityTypes.reduce(
          (sum, et) => sum + (counts[et] || 0),
          0
        );
      }
    }
    return chipCounts;
  }, [results, categories]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Reset state when dropdown closes
  useEffect(() => {
    if (!open) {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      setQuery("");
      setActiveFilter(null);
      setSelectedIndex(0);
    }
  }, [open, query, setQuery, setActiveFilter]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Navigate to result
  const navigateToResult = useCallback(
    (result: SearchResultType) => {
      const url = getEntityUrl(
        result.entity_type as SearchEntityType,
        result.id,
        result.metadata,
        role
      );
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      setOpen(false);
      router.push(url);
    },
    [role, query, router]
  );

  // Keyboard navigation within results
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      }
    },
    [results, selectedIndex, navigateToResult]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterKey: string | null) => {
      if (!filterKey) {
        setActiveFilter(null);
        return;
      }
      const category = categories.find((c) => c.key === filterKey);
      if (category && category.entityTypes.length > 0) {
        setActiveFilter(category.entityTypes.join(","));
      } else {
        setActiveFilter(filterKey);
      }
    },
    [categories, setActiveFilter]
  );

  // Derive active chip key from activeFilter
  const activeChipKey = useMemo(() => {
    if (!activeFilter) return null;
    const filterTypes = activeFilter.split(",");
    const matchedCategory = categories.find(
      (c) =>
        c.key &&
        c.entityTypes.length === filterTypes.length &&
        c.entityTypes.every((et) => filterTypes.includes(et))
    );
    return matchedCategory?.key ?? activeFilter;
  }, [activeFilter, categories]);

  const recentSearches = getRecentSearches();
  const showDropdown = open;
  const hasQuery = query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl" onKeyDown={handleKeyDown}>
      {/* Inline search input — always visible */}
      <div
        className={`flex items-center rounded-lg border bg-card px-3 py-1.5 transition-all ${
          open
            ? "border-accent ring-2 ring-accent/20 shadow-sm"
            : "border-border hover:border-muted-foreground/30"
        }`}
      >
        <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search loans, borrowers, investors..."
          className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {loading && (
          <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-slate-400" />
        )}
        {hasQuery && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="ml-1 rounded p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Dropdown results panel */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {/* Category chips — show when there's a query */}
          {hasQuery && (
            <CategoryChips
              categories={categories}
              activeFilter={activeChipKey}
              onFilterChange={handleFilterChange}
              resultCounts={resultCounts}
            />
          )}

          {/* Results area */}
          <div className="max-h-[400px] overflow-y-auto" ref={listRef}>
            {/* Empty state: no query — show recent searches */}
            {!hasQuery && recentSearches.length > 0 && (
              <div className="px-3 py-2">
                <h3 className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Recent Searches
                </h3>
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    type="button"
                    onClick={() => setQuery(search)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state: no query and no recent searches */}
            {!hasQuery && recentSearches.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-slate-400">
                  Start typing to search across your portal
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {hasQuery && loading && results.length === 0 && (
              <div className="space-y-0.5 p-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {/* No results */}
            {hasQuery && !loading && results.length === 0 && (
              <NoResults query={query} />
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="py-0.5">
                {results.map((result, index) => (
                  <div key={`${result.entity_type}-${result.id}`} data-index={index}>
                    <SearchResult
                      id={result.id}
                      entityType={result.entity_type as SearchEntityType}
                      metadata={result.metadata}
                      updatedAt={result.updated_at}
                      isSelected={index === selectedIndex}
                      onClick={() => navigateToResult(result)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-1.5">
            <div className="flex items-center gap-2.5 text-[10px] text-slate-400">
              <span>
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">↑↓</kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">↵</kbd>{" "}
                Open
              </span>
              <span>
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-mono">esc</kbd>{" "}
                Close
              </span>
            </div>
            {results.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
