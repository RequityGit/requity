"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Loader2, MessageSquarePlus, ArrowDown } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StreamFilters } from "./StreamFilters";
import { ActionCenterStreamItem, DateDivider } from "./ActionCenterStreamItem";
import type { NoteHandlers } from "./ActionCenterStreamItem";
import { ActionCenterComposer } from "./ActionCenterComposer";
import type { StreamItem, StreamFilterType, StreamFilterCounts } from "./useActionCenterData";
import type { UploadedAttachment } from "@/components/shared/attachments";

interface ActionCenterStreamProps {
  items: StreamItem[];
  loading: boolean;
  filterCounts: StreamFilterCounts;
  activeFilter: StreamFilterType;
  onFilterChange: (filter: StreamFilterType) => void;
  // Composer
  currentUserId: string;
  currentUserName: string;
  onPost: (body: string, isInternal: boolean, mentionIds: string[], attachments?: UploadedAttachment[]) => Promise<void>;
  onSendMessage: (body: string) => Promise<void>;
  // Note handlers
  noteHandlers: NoteHandlers;
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
  currentUserId,
  currentUserName,
  onPost,
  onSendMessage,
  noteHandlers,
}: ActionCenterStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Group by date
  const groups = useMemo(() => groupByDate(items), [items]);

  // Track scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 120);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

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
      <div className="relative flex-1 overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto">
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
                    <ActionCenterStreamItem
                      key={item.id}
                      item={item}
                      noteHandlers={noteHandlers}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll to bottom */}
        <button
          type="button"
          onClick={scrollToBottom}
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm rq-transition hover:text-foreground hover:shadow-md ${
            showScrollDown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          } duration-normal ease-out-rq`}
          aria-label="Scroll to latest"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Composer */}
      <ActionCenterComposer
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onPost={onPost}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
