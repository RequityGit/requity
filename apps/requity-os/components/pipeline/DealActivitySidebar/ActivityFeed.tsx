"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ActivityFeedItem } from "./ActivityFeedItem";
import type { ActivityItem } from "@/hooks/useActivityFeed";
import type { ActivityFilter } from "./ActivityFilters";

interface ActivityFeedProps {
  items: ActivityItem[];
  loading: boolean;
  filter: ActivityFilter;
  currentUserId: string;
}

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

export function ActivityFeed({
  items,
  loading,
  filter,
  currentUserId,
}: ActivityFeedProps) {
  // Apply filter
  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "notes")
      return items.filter((i) => i.type === "note");
    if (filter === "conditions")
      return items.filter((i) => i.type === "condition_note");
    if (filter === "messages")
      return items.filter((i) => i.type === "borrower_message");
    return items;
  }, [items, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: ActivityItem[] }[] = [];
    let currentLabel = "";

    for (const item of filtered) {
      const label = getDateLabel(item.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }

    return groups;
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <EmptyState
          icon={MessageSquare}
          title="No activity yet"
          description={
            filter === "all"
              ? "Notes, messages, and events will appear here"
              : `No ${filter} to show`
          }
          compact
        />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-1">
        {grouped.map((group) => (
          <div key={group.label}>
            {/* Date divider */}
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex-1 border-t border-border" />
              <span className="rq-micro-label shrink-0">{group.label}</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* Items */}
            {group.items.map((item) => (
              <ActivityFeedItem
                key={item.id}
                item={item}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
