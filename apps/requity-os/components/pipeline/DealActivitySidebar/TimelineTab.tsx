"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import {
  useUnifiedTimeline,
  TIMELINE_FILTER_TYPES,
  type TimelineFilter,
  type TimelineFilterCounts,
} from "@/hooks/useUnifiedTimeline";
import { QuickActions } from "./QuickActions";
import {
  SidebarCrmActivityItem,
  SidebarDealActivityItem,
  SidebarEmailItem,
} from "./TimelineItems";

// ── Date grouping helper ──

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = today.getTime() - dateOnly.getTime();
  const dayMs = 86400000;

  if (diff < dayMs) return "Today";
  if (diff < dayMs * 2) return "Yesterday";
  if (diff < dayMs * 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ── Filter Chips ──

function TimelineFilters({
  active,
  onChange,
  counts,
}: {
  active: TimelineFilter;
  onChange: (f: TimelineFilter) => void;
  counts: TimelineFilterCounts;
}) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border flex-shrink-0 overflow-x-auto">
      {TIMELINE_FILTER_TYPES.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "px-2 py-1 rounded-md text-[11px] font-medium rq-transition cursor-pointer whitespace-nowrap",
            active === f
              ? "bg-foreground/[0.06] text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
          )}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
          {counts[f] > 0 && (
            <span className="ml-1 text-muted-foreground/60 text-[9px]">
              {counts[f]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Timeline Feed ──

interface TimelineTabProps {
  dealId: string;
  primaryContactId: string | null;
  onSwitchToNotes: () => void;
}

export function TimelineTab({
  dealId,
  primaryContactId,
  onSwitchToNotes,
}: TimelineTabProps) {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const { items, loading, counts, refetch } = useUnifiedTimeline({
    dealId,
    primaryContactId,
  });

  // Apply filter
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((t) => t.filterCategory === filter);
  }, [items, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof filtered }[] = [];
    let currentLabel = "";

    for (const item of filtered) {
      const label = getDateLabel(item.created_at);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }

    return groups;
  }, [filtered]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Quick action buttons */}
      <QuickActions
        dealId={dealId}
        primaryContactId={primaryContactId}
        onNoteClick={onSwitchToNotes}
        onActivityLogged={refetch}
      />

      {/* Filter chips */}
      <TimelineFilters active={filter} onChange={setFilter} counts={counts} />

      {/* Feed */}
      {loading ? (
        <div className="flex-1 px-3 pt-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="h-6 w-6 rounded-md shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            icon={Activity}
            title="No activity"
            description={
              filter !== "all"
                ? `No ${filter} activity. Try a different filter.`
                : "Activity will appear here as you work on this deal."
            }
            compact
          />
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="pt-1 pb-1">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Date divider */}
                <div className="flex items-center gap-3 px-3 py-1.5">
                  <div className="flex-1 border-t border-border" />
                  <span className="rq-micro-label shrink-0">{group.label}</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                {/* Items */}
                {group.items.map((item, i) => {
                  const isLast =
                    i === group.items.length - 1;

                  if (item.kind === "email" && item.email) {
                    return (
                      <SidebarEmailItem
                        key={item.id}
                        email={item.email}
                        isLast={isLast}
                      />
                    );
                  }

                  if (item.kind === "activity" && item.activity) {
                    return (
                      <SidebarCrmActivityItem
                        key={item.id}
                        activity={item.activity}
                        isLast={isLast}
                      />
                    );
                  }

                  if (item.kind === "deal_activity" && item.dealActivity) {
                    return (
                      <SidebarDealActivityItem
                        key={item.id}
                        activity={item.dealActivity}
                        isLast={isLast}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
