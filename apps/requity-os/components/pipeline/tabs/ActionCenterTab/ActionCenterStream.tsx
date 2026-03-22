"use client";

import { useRef, useEffect, useMemo } from "react";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StreamFilters } from "./StreamFilters";
import { ActionCenterStreamItem, DateDivider } from "./ActionCenterStreamItem";
import { ActionCenterComposer } from "./ActionCenterComposer";
import type { StreamItem, StreamFilterType, StreamFilterCounts } from "./useActionCenterData";

interface ActionCenterStreamProps {
  items: StreamItem[];
  loading: boolean;
  filterCounts: StreamFilterCounts;
  activeFilter: StreamFilterType;
  onFilterChange: (filter: StreamFilterType) => void;
  onPost: (body: string, isInternal: boolean) => Promise<{ error?: string; success?: boolean }>;
}

// Group items by date for dividers
function groupByDate(items: StreamItem[]): { date: string; items: StreamItem[] }[] {
  const groups: { date: string; items: StreamItem[] }[] = [];
  let currentDate = "";

  for (const item of items) {
    const date = item.timestamp.split("T")[0];
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, items: [] });
    }
    groups[groups.length - 1].items.push(item);
  }

  return groups;
}

export function ActionCenterStream({
  items,
  loading,
  filterCounts,
  activeFilter,
  onFilterChange,
  onPost,
}: ActionCenterStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  // Group by date
  const groups = useMemo(() => groupByDate(items), [items]);

  // Auto-scroll to bottom on first load
  useEffect(() => {
    if (!loading && isFirstLoad.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isFirstLoad.current = false;
    }
  }, [loading]);

  return (
    <div className="flex flex-col h-full rounded-xl border bg-card overflow-hidden">
      {/* Filter bar */}
      <StreamFilters
        active={activeFilter}
        counts={filterCounts}
        onChange={onFilterChange}
      />

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title="No activity yet"
            description="Notes, emails, calls, and system events will appear here"
            compact
          />
        ) : (
          <div className="flex flex-col">
            {groups.map((group) => (
              <div key={group.date}>
                <DateDivider date={group.date} />
                {group.items.map((item) => (
                  <ActionCenterStreamItem key={item.id} item={item} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <ActionCenterComposer onPost={onPost} />
    </div>
  );
}
