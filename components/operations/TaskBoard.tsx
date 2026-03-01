"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import {
  PriorityBadge,
  RecurringBadge,
  DueDateLabel,
} from "./badges";
import type { OpsTask } from "./ProjectCard";

const BOARD_COLUMNS = [
  { key: "To Do", color: "border-t-slate-400" },
  { key: "In Progress", color: "border-t-blue-500" },
  { key: "Blocked", color: "border-t-red-500" },
  { key: "Complete", color: "border-t-green-500" },
] as const;

interface TaskBoardProps {
  tasks: OpsTask[];
  projectNames: Record<string, string>;
  commentCounts: Record<string, number>;
  onOpenTask: (task: OpsTask) => void;
}

export function TaskBoard({ tasks, projectNames, commentCounts, onOpenTask }: TaskBoardProps) {
  const columns = BOARD_COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.key),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.key} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1a2b4a]">{col.key}</h3>
            <span className="text-xs text-muted-foreground rounded-full bg-slate-100 px-2 py-0.5">
              {col.tasks.length}
            </span>
          </div>

          <div className={cn("space-y-2 min-h-[200px]")}>
            {col.tasks.length === 0 ? (
              <div className="rounded-md border border-dashed bg-slate-50 p-4 text-center text-sm text-muted-foreground">
                No tasks
              </div>
            ) : (
              col.tasks.map((task) => {
                const count = commentCounts[task.id] ?? 0;
                return (
                  <Card
                    key={task.id}
                    className={cn("border-t-2 cursor-pointer hover:shadow-md transition-shadow", col.color)}
                    onClick={() => onOpenTask(task)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium text-[#1a2b4a] leading-snug">
                        {task.title}
                      </p>

                      {task.project_id && projectNames[task.project_id] && (
                        <p className="text-xs text-muted-foreground">
                          {projectNames[task.project_id]}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PriorityBadge priority={task.priority} />
                        {task.is_recurring && (
                          <RecurringBadge pattern={task.recurrence_pattern} isActive={task.is_active_recurrence ?? false} />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assigned_to_name ? (
                            <span className="text-xs text-muted-foreground">
                              {task.assigned_to_name}
                            </span>
                          ) : (
                            <span />
                          )}
                          {count > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                              <MessageCircle className="h-3 w-3" />
                              {count}
                            </span>
                          )}
                        </div>
                        <DueDateLabel dueDate={task.due_date} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
