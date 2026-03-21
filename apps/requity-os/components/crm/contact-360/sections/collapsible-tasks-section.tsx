"use client";

import { useMemo, forwardRef } from "react";
import { CheckSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CollapsibleSectionCard } from "./collapsible-section-card";
import { DetailTasksTab } from "../tabs/detail-tasks-tab";
import type { OpsTask, Profile } from "@/lib/tasks";

interface Props {
  tasks: OpsTask[];
  contactId: string;
  contactName: string;
  profiles: Profile[];
  currentUserId: string;
  loading?: boolean;
  taskCount: number;
}

export const CollapsibleTasksSection = forwardRef<HTMLDivElement, Props>(
  function CollapsibleTasksSection(props, ref) {
    const { tasks, loading = false, taskCount, ...tabProps } = props;

    const openCount = useMemo(
      () => tasks.filter((t) => t.status !== "Complete").length,
      [tasks]
    );

    const summary = useMemo(() => {
      if (loading && tasks.length === 0) return undefined;
      if (tasks.length === 0) return "No tasks";
      if (openCount === 0) return "All complete";
      return `${openCount} open`;
    }, [tasks.length, openCount, loading]);

    const countBadge = loading && tasks.length === 0 ? taskCount : openCount;

    return (
      <CollapsibleSectionCard
        ref={ref}
        id="tasks-section"
        icon={CheckSquare}
        title="Tasks"
        count={countBadge || undefined}
        summary={summary}
      >
        {loading && tasks.length === 0 ? (
          <div className="px-5 pb-5 space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (
          <DetailTasksTab {...tabProps} tasks={tasks} />
        )}
      </CollapsibleSectionCard>
    );
  }
);
