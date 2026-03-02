"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  PriorityBadge,
  StatusBadge,
  RecurringBadge,
  DueDateLabel,
} from "./badges";
import { OpsCommentThread } from "./OpsCommentThread";
import { Separator } from "@/components/ui/separator";
import type { OpsTask } from "./ProjectCard";

interface TaskDetailDrawerProps {
  task: OpsTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string | null;
  currentUserId: string;
  isSuperAdmin: boolean;
}

export function TaskDetailDrawer({
  task,
  open,
  onOpenChange,
  projectName,
  currentUserId,
  isSuperAdmin,
}: TaskDetailDrawerProps) {
  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base text-foreground leading-snug text-left">
            {task.title}
          </SheetTitle>
        </SheetHeader>

        {/* Task metadata */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.is_recurring && (
              <RecurringBadge
                pattern={task.recurrence_pattern}
                isActive={task.is_active_recurrence ?? false}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {projectName && (
              <>
                <span className="text-muted-foreground">Project</span>
                <span className="font-medium">{projectName}</span>
              </>
            )}
            {task.assigned_to_name && (
              <>
                <span className="text-muted-foreground">Assignee</span>
                <span className="font-medium">{task.assigned_to_name}</span>
              </>
            )}
            {task.category && (
              <>
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{task.category}</span>
              </>
            )}
            <span className="text-muted-foreground">Due Date</span>
            <span>
              <DueDateLabel dueDate={task.due_date} />
            </span>
          </div>

          {task.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Comments */}
        <div className="pt-4">
          <OpsCommentThread
            entityType="task"
            entityId={task.id}
            currentUserId={currentUserId}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
