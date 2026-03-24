"use client";

import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { ActionCenterStream } from "./ActionCenterStream";
import { ActionCenterRail } from "./ActionCenterRail";
import { useActionCenterData } from "./useActionCenterData";
import type { NoteHandlers } from "./ActionCenterStreamItem";
import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ActionCenterTabProps {
  dealId: string;
  primaryContactId: string | null;
  currentUserId: string;
  currentUserName: string;
  dealStage: string;
}

export function ActionCenterTab({
  dealId,
  primaryContactId,
  currentUserId,
  currentUserName,
  dealStage,
}: ActionCenterTabProps) {
  const {
    streamItems,
    streamLoading,
    filterCounts,
    activeFilter,
    setActiveFilter,
    postNote,
    replyToNote,
    sendMessage,
    editNote,
    deleteNote,
    toggleLike,
    pinNote,
    conditions,
    conditionDocs,
    conditionProfiles,
    tasks,
    railLoading,
    updateConditionStatus,
    refetchRail,
  } = useActionCenterData({
    dealId,
    primaryContactId,
    currentUserId,
    currentUserName,
  });

  const noteHandlers: NoteHandlers = useMemo(
    () => ({
      currentUserId,
      currentUserName,
      onPin: pinNote,
      onEdit: editNote,
      onDelete: deleteNote,
      onToggleLike: toggleLike,
      onReply: replyToNote,
    }),
    [currentUserId, currentUserName, pinNote, editNote, deleteNote, toggleLike, replyToNote]
  );

  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState<"activity" | "conditions">("activity");

  const clearedCount = conditions.filter(
    (c) => c.status === "approved" || c.status === "waived" || c.status === "not_applicable"
  ).length;

  const streamContent = (
    <SectionErrorBoundary fallbackTitle="Could not load activity stream">
      <ActionCenterStream
        items={streamItems}
        loading={streamLoading}
        filterCounts={filterCounts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onPost={postNote}
        onSendMessage={sendMessage}
        noteHandlers={noteHandlers}
      />
    </SectionErrorBoundary>
  );

  const railContent = (
    <SectionErrorBoundary fallbackTitle="Could not load execution rail">
      <ActionCenterRail
        conditions={conditions}
        conditionDocs={conditionDocs}
        conditionProfiles={conditionProfiles}
        loading={railLoading}
        dealId={dealId}
        dealStage={dealStage}
        onConditionStatusChange={updateConditionStatus}
        onConditionAdded={() => refetchRail(true)}
      />
    </SectionErrorBoundary>
  );

  // Mobile: stacked with segmented toggle
  if (isMobile) {
    return (
      <div className="flex flex-col h-full min-h-0">
        {/* Segmented toggle */}
        <div className="flex gap-1 rounded-lg p-1 bg-muted border mx-3 mt-2 mb-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobilePanel("activity")}
            className={cn(
              "flex-1 py-1.5 text-[13px] font-medium rounded-md rq-transition cursor-pointer",
              mobilePanel === "activity"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Activity
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("conditions")}
            className={cn(
              "flex-1 py-1.5 text-[13px] font-medium rounded-md rq-transition cursor-pointer",
              mobilePanel === "conditions"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Conditions ({clearedCount}/{conditions.length})
          </button>
        </div>

        {/* Panel content */}
        <div className="flex-1 min-h-0">
          {mobilePanel === "activity" ? (
            <div className="h-full min-w-0">{streamContent}</div>
          ) : (
            railContent
          )}
        </div>
      </div>
    );
  }

  // Desktop: side-by-side (unchanged)
  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: Activity Stream */}
      <div className="flex-1 min-w-0">
        {streamContent}
      </div>

      {/* Right: Execution Rail */}
      {railContent}
    </div>
  );
}
