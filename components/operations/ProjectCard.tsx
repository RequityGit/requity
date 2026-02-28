"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Pause } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  PriorityBadge,
  StatusBadge,
  OwnerBadge,
  DueDateLabel,
  RecurringBadge,
} from "./badges";

export interface OpsTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  linked_entity_label: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurring_series_id: string | null;
  source_task_id: string | null;
  recurrence_end_date: string | null;
  is_active_recurrence: boolean;
  created_by: string | null;
  updated_at: string | null;
  created_at: string;
}

export interface OpsProject {
  id: string;
  project_name: string;
  category: string | null;
  owner: string | null;
  status: string | null;
  priority: string | null;
  description: string | null;
  latest_update: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  created_at: string;
}

interface ProjectCardProps {
  project: OpsProject;
  tasks: OpsTask[];
  onToggleTask: (taskId: string, completed: boolean) => void;
  onStopRecurrence: (taskId: string) => void;
}

const priorityOrder: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

export function ProjectCard({ project, tasks, onToggleTask, onStopRecurrence }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);

  const completedCount = tasks.filter((t) => t.status === "Complete").length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const sortedTasks = [...tasks].sort(
    (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
  );

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-start gap-3 text-left w-full"
        >
          <div className="mt-0.5">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-[#1a2b4a]">
                {project.project_name}
              </h3>
              <PriorityBadge priority={project.priority} />
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <OwnerBadge name={project.owner} />
              {project.category && (
                <span className="text-xs text-muted-foreground">
                  {project.category}
                </span>
              )}
            </div>

            {/* Task progress bar */}
            {totalCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {completedCount}/{totalCount} tasks
                </span>
              </div>
            )}
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {/* Latest update */}
          {project.latest_update && (
            <div className="mb-4 rounded-md bg-slate-50 p-3 border border-slate-100">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Latest Update
              </p>
              <p className="text-sm text-foreground">{project.latest_update}</p>
            </div>
          )}

          {/* Linked tasks */}
          {sortedTasks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Tasks</p>
              {sortedTasks.map((task) => {
                const isComplete = task.status === "Complete";
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={isComplete}
                      onChange={() => onToggleTask(task.id, !isComplete)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        isComplete && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={task.priority} />
                      {task.is_recurring && (
                        <div className="flex items-center gap-0.5">
                          <RecurringBadge pattern={task.recurrence_pattern} isActive={task.is_active_recurrence} />
                          {task.is_active_recurrence && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-0.5 rounded hover:bg-slate-200 text-muted-foreground">
                                  <MoreHorizontal className="h-3 w-3" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onStopRecurrence(task.id)}>
                                  <Pause className="h-3.5 w-3.5 mr-2" />
                                  Stop recurrence
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                      <DueDateLabel dueDate={task.due_date} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tasks linked.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
