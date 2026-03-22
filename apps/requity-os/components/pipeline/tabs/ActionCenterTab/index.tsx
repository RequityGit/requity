"use client";

import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { ActionCenterStream } from "./ActionCenterStream";
import { ActionCenterRail } from "./ActionCenterRail";
import { useActionCenterData } from "./useActionCenterData";

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
    addNote,
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

  return (
    <div className="flex gap-4 h-[calc(100vh-340px)] min-h-[500px]">
      {/* Left: Activity Stream */}
      <div className="flex-1 min-w-0">
        <SectionErrorBoundary fallbackTitle="Could not load activity stream">
          <ActionCenterStream
            items={streamItems}
            loading={streamLoading}
            filterCounts={filterCounts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onPost={addNote}
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
