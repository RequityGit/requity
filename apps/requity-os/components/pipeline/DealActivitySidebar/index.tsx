"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronsRight } from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { ActivityFilters, type ActivityFilter } from "./ActivityFilters";
import { ActivityFeed } from "./ActivityFeed";
import { ActivityComposer } from "./ActivityComposer";

interface DealActivitySidebarProps {
  dealId: string;
  loanId?: string;
  opportunityId?: string;
  currentUserId: string;
  currentUserName: string;
  conditions: { id: string; condition_name: string }[];
  onClose: () => void;
}

export function DealActivitySidebar({
  dealId,
  loanId,
  opportunityId,
  currentUserId,
  currentUserName,
  conditions,
  onClose,
}: DealActivitySidebarProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const { items, loading, counts, refetch } = useActivityFeed({
    dealId,
    loanId,
    opportunityId,
  });

  return (
    <aside className="w-[380px] border-l flex flex-col bg-background flex-shrink-0 h-full overflow-hidden rq-animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-semibold">Activity</span>
          <span className="text-[11px] text-muted-foreground bg-foreground/[0.06] px-1.5 py-0.5 rounded-full">
            {counts.all}
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <ActivityFilters active={filter} onChange={setFilter} counts={counts} />

      {/* Feed */}
      <ActivityFeed
        items={items}
        loading={loading}
        filter={filter}
        currentUserId={currentUserId}
      />

      {/* Composer */}
      <ActivityComposer
        dealId={dealId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        conditions={conditions}
        onNotePosted={refetch}
      />
    </aside>
  );
}
