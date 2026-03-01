"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  PriorityBadge,
  StatusBadge,
  RecurringBadge,
  DueDateLabel,
} from "./badges";
import { MessageCircle, MoreHorizontal, Pause, Trash2 } from "lucide-react";
import type { OpsTask } from "./ProjectCard";

interface TaskListProps {
  tasks: OpsTask[];
  projectNames: Record<string, string>;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onStopRecurrence: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  commentCounts: Record<string, number>;
  onOpenTask: (task: OpsTask) => void;
}

export function TaskList({ tasks, projectNames, onToggleTask, onStopRecurrence, onDeleteTask, commentCounts, onOpenTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-md border bg-white">
        <div className="h-24 flex items-center justify-center text-muted-foreground">
          No tasks found.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recurring</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-16"></TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isComplete = task.status === "Complete";
            return (
              <TableRow key={task.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isComplete}
                    onChange={() => onToggleTask(task.id, !isComplete)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onOpenTask(task)}
                    className="font-medium text-[#1a2b4a] hover:underline text-left"
                  >
                    {task.title}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {task.project_id
                    ? projectNames[task.project_id] ?? "—"
                    : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {task.assigned_to_name ?? "—"}
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  {task.is_recurring ? (
                    <RecurringBadge
                      pattern={task.recurrence_pattern}
                      isActive={task.is_active_recurrence ?? false}
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DueDateLabel dueDate={task.due_date} />
                </TableCell>
                <TableCell>
                  {(commentCounts[task.id] ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3" />
                      {commentCounts[task.id]}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-slate-100 text-muted-foreground">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {task.is_recurring && task.is_active_recurrence && (
                        <DropdownMenuItem onClick={() => onStopRecurrence(task.id)}>
                          <Pause className="h-3.5 w-3.5 mr-2" />
                          Stop recurrence
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
