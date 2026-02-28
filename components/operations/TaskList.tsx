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
  PriorityBadge,
  StatusBadge,
  RecurringBadge,
  DueDateLabel,
} from "./badges";
import type { OpsTask } from "./ProjectCard";

interface TaskListProps {
  tasks: OpsTask[];
  projectNames: Record<string, string>;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export function TaskList({ tasks, projectNames, onToggleTask }: TaskListProps) {
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
                <TableCell className="font-medium text-[#1a2b4a]">
                  {task.title}
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
                    <RecurringBadge pattern={task.recurrence_pattern} />
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DueDateLabel dueDate={task.due_date} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
