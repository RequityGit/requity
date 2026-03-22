"use client";

import { useMemo } from "react";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { ActionCenterStream } from "./ActionCenterStream";
import { ActionCenterRail } from "./ActionCenterRail";
import { useActionCenterData } from "./useActionCenterData";
import type { NoteHandlers } from "./ActionCenterStreamItem";

interface ActionCenterTabProps {
  dealId: string;
  primaryContactId: string | null;
  currentUserId: string;
  currentUserName: string;
  // KPI pass-through from deal data
  loanAmount?: number | null;
  ltv?: number | null;
  closeDate?: string | null;
}

export function ActionCenterTab({
  dealId,
  primaryContactId,
  currentUserId,
  currentUserName,
  loanAmount,
  ltv,
  closeDate,
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
    tasks,
    railLoading,
    toggleTask,
    updateConditionStatus,
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
          tasks={tasks}
          loading={railLoading}
          dealId={dealId}
          loanAmount={loanAmount}
          ltv={ltv}
          closeDate={closeDate}
          onToggleTask={toggleTask}
          onConditionStatusChange={updateConditionStatus}
        />
      </SectionErrorBoundary>
    </div>
  );
}
