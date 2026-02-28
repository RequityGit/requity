"use client";

import { KpiCard } from "@/components/shared/kpi-card";
import {
  FolderKanban,
  AlertTriangle,
  CalendarClock,
  RefreshCw,
} from "lucide-react";

interface OperationsStatsProps {
  activeProjects: number;
  criticalTasks: number;
  dueThisWeek: number;
  recurringTasks: number;
}

export function OperationsStats({
  activeProjects,
  criticalTasks,
  dueThisWeek,
  recurringTasks,
}: OperationsStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Active Projects"
        value={activeProjects}
        icon={<FolderKanban className="h-5 w-5" />}
      />
      <KpiCard
        title="Critical Tasks"
        value={criticalTasks}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <KpiCard
        title="Due This Week"
        value={dueThisWeek}
        icon={<CalendarClock className="h-5 w-5" />}
      />
      <KpiCard
        title="Active Recurring"
        value={recurringTasks}
        icon={<RefreshCw className="h-5 w-5" />}
      />
    </div>
  );
}
