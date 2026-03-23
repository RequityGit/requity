"use client";

import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { ActionCenterStream } from "./ActionCenterStream";
import { ActionCenterRail } from "./ActionCenterRail";
import { useActionCenterData } from "./useActionCenterData";
import type { NoteHandlers } from "./ActionCenterStreamItem";
import { useMemo } from "react";

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

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Left: Activity Stream */}
      <div className="flex-1 min-w-0">
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
            noteHandlers={noteHandlers}
          />
        </SectionErrorBoundary>
      </div>

      {/* Right: Execution Rail */}
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
    </div>
  );
}
