"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { TaskCard } from "./task-card";
import { CompletedTaskCard } from "./completed-task-card";
import type { OpsTask, Profile } from "@/lib/tasks";
import { sortTasksByColumn } from "@/lib/tasks";
import { ListChecks } from "lucide-react";

const COMPLETED_SHOW_COUNT = 5;

interface TaskColumnProps {
  status: string;
  label: string;
  tasks: OpsTask[];
  profiles: Profile[];
  onComplete: (taskId: string) => void;
  onTaskClick: (task: OpsTask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  isDragTarget?: boolean;
}

export function TaskColumn({
  status,
  label,
  tasks,
  profiles,
  onComplete,
  onTaskClick,
  onDragStart,
  onDrop,
}: TaskColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const isComplete = status === "Complete";
  const sortedTasks = sortTasksByColumn(tasks, status);

  const visibleTasks = isComplete && !showAllCompleted
    ? sortedTasks.slice(0, COMPLETED_SHOW_COUNT)
    : sortedTasks;
  const hiddenCount = isComplete
    ? sortedTasks.length - COMPLETED_SHOW_COUNT
    : 0;

  const handleDragOver = (e: React.DragEvent) => {
    if (isComplete) return;
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    if (isComplete) return;
    e.preventDefault();
    setDragOver(false);
    onDrop(e, status);
  };

  return (
    <div className="flex-1 min-w-[280px] max-w-[440px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground/60 num">
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        className={cn(
          "flex-1 flex flex-col gap-1.5 rounded-lg p-1 min-h-[60px] transition-colors",
          dragOver && !isComplete && "bg-accent border border-dashed border-border"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {visibleTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ListChecks className="h-8 w-8 text-muted-foreground/30 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground/60">
              {isComplete ? "No completed tasks" : "No tasks"}
            </p>
          </div>
        )}

        {isComplete
          ? visibleTasks.map((task) => (
              <CompletedTaskCard
                key={task.id}
                task={task}
                onClick={onTaskClick}
              />
            ))
          : visibleTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                profiles={profiles}
                onComplete={onComplete}
                onClick={onTaskClick}
                onDragStart={onDragStart}
              />
            ))}

        {/* "View all completed" expander */}
        {isComplete && hiddenCount > 0 && !showAllCompleted && (
          <button
            onClick={() => setShowAllCompleted(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 mt-1 rounded-lg border border-dashed border-border text-[12px] font-medium text-muted-foreground hover:border-ring/50 hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            View all {sortedTasks.length} completed
          </button>
        )}
      </div>
    </div>
  );
}
