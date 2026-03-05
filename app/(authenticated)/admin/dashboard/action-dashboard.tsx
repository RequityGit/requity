"use client";

import { useState, useCallback } from "react";
import type { ActionDashboardData } from "./actions";
import { toggleTask, approveRequest, followUpBorrowerRequest } from "./actions";
import { ProgressRing } from "./components/progress-ring";
import { StreakBadge } from "./components/streak-badge";
import { PastDueBanner } from "./components/past-due-banner";
import { MorningBriefing } from "./components/morning-briefing";
import { TaskQueue } from "./components/task-queue";
import { PendingApprovals } from "./components/pending-approvals";
import { DealActivityLog } from "./components/deal-activity-log";
import { BorrowerTracker } from "./components/borrower-tracker";
import { WeeklyRhythm } from "./components/weekly-rhythm";
import { QuickActions } from "./components/quick-actions";
import { GuidedStep } from "./components/guided-step";

interface ActionDashboardProps {
  initialData: ActionDashboardData;
}

export function ActionDashboard({ initialData }: ActionDashboardProps) {
  const [data, setData] = useState(initialData);

  const handleToggleTask = useCallback(
    (taskId: string) => {
      const task = data.tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic update
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                is_completed: !t.is_completed,
                completed_at: !t.is_completed
                  ? new Date().toISOString()
                  : null,
              }
            : t
        ),
      }));

      // Server call
      toggleTask(taskId, !task.is_completed).then((result) => {
        if ("error" in result) {
          // Revert on error
          setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    is_completed: task.is_completed,
                    completed_at: task.completed_at,
                  }
                : t
            ),
          }));
        }
      });
    },
    [data.tasks]
  );

  const handleApprove = useCallback((approvalId: string) => {
    // Optimistic removal
    setData((prev) => ({
      ...prev,
      pendingApprovals: prev.pendingApprovals.filter(
        (a) => a.id !== approvalId
      ),
    }));

    approveRequest(approvalId).then((result) => {
      if ("error" in result) {
        // Revert: re-fetch would be ideal but for now just log
        console.error("Approve failed:", result.error);
      }
    });
  }, []);

  const handleFollowUp = useCallback((requestId: string) => {
    setData((prev) => ({
      ...prev,
      borrowerRequests: prev.borrowerRequests.map((b) =>
        b.id === requestId
          ? {
              ...b,
              follow_up_count: b.follow_up_count + 1,
              last_follow_up_at: new Date().toISOString(),
            }
          : b
      ),
    }));

    followUpBorrowerRequest(requestId).then((result) => {
      if ("error" in result) {
        console.error("Follow-up failed:", result.error);
      }
    });
  }, []);

  // Computed values
  const tasks = data.tasks;
  const pastDueTasks = tasks.filter(
    (t) => t.is_past_due && !t.is_completed
  );
  const activeTasks = tasks.filter((t) => !t.is_past_due);
  const totalTasks = tasks.length;
  const doneCount = tasks.filter((t) => t.is_completed).length;
  const pct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground">
            {greeting}, {data.userName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <ProgressRing pct={pct} />
            <div>
              <div className="text-sm font-semibold text-foreground num">
                {doneCount}/{totalTasks} done
              </div>
              <div className="text-[11px] text-muted-foreground">today</div>
            </div>
          </div>
          <StreakBadge
            current={data.streak.current_streak}
            best={data.streak.best_streak}
          />
        </div>
      </div>

      {/* Past Due Banner */}
      <PastDueBanner tasks={pastDueTasks} onToggle={handleToggleTask} />

      {/* Morning Briefing */}
      <MorningBriefing
        tasks={tasks}
        approvals={data.pendingApprovals}
        dealLog={data.dealLog}
      />

      {/* Step 1: Handle what's on your plate */}
      <GuidedStep n={1} label="Handle what's on your plate" />
      <TaskQueue tasks={activeTasks} onToggle={handleToggleTask} />
      <PendingApprovals
        approvals={data.pendingApprovals}
        onApprove={handleApprove}
      />

      {/* Step 2: Catch up on deal movement */}
      <GuidedStep n={2} label="Catch up on deal movement" />
      <DealActivityLog entries={data.dealLog} />

      {/* Step 3: Follow up on outstanding borrower requests */}
      <GuidedStep n={3} label="Follow up on outstanding borrower requests" />
      <BorrowerTracker
        requests={data.borrowerRequests}
        onFollowUp={handleFollowUp}
      />

      {/* Step 4: Check your weekly rhythm */}
      <GuidedStep n={4} label="Check your weekly rhythm" />
      <WeeklyRhythm summary={data.weeklySummary} />

      {/* Step 5: Quick actions */}
      <GuidedStep n={5} label="Quick actions" />
      <QuickActions />
    </div>
  );
}
