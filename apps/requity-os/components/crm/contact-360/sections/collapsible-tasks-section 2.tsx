"use client";

import { useMemo, forwardRef } from "react";
import { CheckSquare } from "lucide-react";
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
}

export const CollapsibleTasksSection = forwardRef<HTMLDivElement, Props>(
  function CollapsibleTasksSection(props, ref) {
    const { tasks } = props;

    const openCount = useMemo(
      () => tasks.filter((t) => t.status !== "Complete").length,
      [tasks]
    );

    const summary = useMemo(() => {
      if (tasks.length === 0) return "No tasks";
      if (openCount === 0) return "All complete";
      return `${openCount} open`;
    }, [tasks.length, openCount]);

    return (
      <CollapsibleSectionCard
        ref={ref}
        id="tasks-section"
        icon={CheckSquare}
        title="Tasks"
        count={openCount || undefined}
        summary={summary}
      >
        <DetailTasksTab {...props} />
      </CollapsibleSectionCard>
    );
  }
);
