"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Repeat, Check } from "lucide-react";
import { PriorityDot } from "./priority-dot";
import { CategoryPill } from "./category-pill";
import { AnimatedTask } from "./animated-task";
import type { OpsTask, Profile } from "@/lib/tasks";
import { getInitials, isDueOverdue } from "@/lib/tasks";

interface TaskCardProps {
  task: OpsTask;
  profiles: Profile[];
  onComplete: (taskId: string) => void;
  onClick: (task: OpsTask) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  draggable?: boolean;
}

export function TaskCard({
  task,
  profiles,
  onComplete,
  onClick,
  onDragStart,
  draggable = true,
}: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCheckboxClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCompleting) return;
      setIsCompleting(true);
    },
    [isCompleting]
  );

  const handleCollapseComplete = useCallback(() => {
    onComplete(task.id);
  }, [onComplete, task.id]);

  const assignee = task.assigned_to
    ? profiles.find((p) => p.id === task.assigned_to)
    : null;
  const assigneeName = assignee?.full_name || task.assigned_to_name || null;
  const overdue = isDueOverdue(task.due_date);

  return (
    <AnimatedTask
      isCompleting={isCompleting}
      onCollapseComplete={handleCollapseComplete}
    >
      <div
        draggable={draggable && !isCompleting}
        onDragStart={(e) => onDragStart?.(e, task.id)}
        onClick={() => !isCompleting && onClick(task)}
        className={cn(
          "bg-card rounded-lg border border-border hover:border-border/80 p-3 cursor-pointer transition-[border-color,box-shadow] hover:shadow-sm",
          draggable && "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-start gap-2.5">
          {/* Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
            className={cn(
              "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-all duration-150",
              isCompleting
                ? "border-green-600 bg-green-600"
                : "border-border hover:border-muted-foreground"
            )}
          >
            {isCompleting && (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            )}
          </button>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              <PriorityDot priority={task.priority} className="mt-1.5" />
              <span
                className={cn(
                  "text-sm font-medium leading-snug flex-1",
                  isCompleting && "line-through opacity-60"
                )}
              >
                {task.title}
              </span>
              {task.is_recurring && (
                <Repeat
                  className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <CategoryPill category={task.category} />
              {assigneeName && (
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                    {getInitials(assigneeName)}
                  </div>
                </div>
              )}
              <div className="flex-1" />
              {task.due_date && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs num",
                    overdue
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <Calendar className="h-3 w-3" strokeWidth={1.5} />
                  {new Date(task.due_date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}
                </span>
              )}
            </div>

            {/* Linked entity */}
            {task.linked_entity_label && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {task.linked_entity_label}
              </p>
            )}
          </div>
        </div>
      </div>
    </AnimatedTask>
  );
}
