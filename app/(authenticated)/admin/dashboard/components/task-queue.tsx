"use client";

import {
  Check,
  Plus,
  ClipboardCheck,
  FileText,
  HardHat,
  PenLine,
  CircleDot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardTask } from "../actions";

const catMeta: Record<string, { icon: typeof ClipboardCheck; label: string }> = {
  underwriting: { icon: ClipboardCheck, label: "Underwriting" },
  document: { icon: FileText, label: "Document" },
  inspection: { icon: HardHat, label: "Inspection" },
  closing: { icon: PenLine, label: "Closing" },
};

function CatTag({ category }: { category: string }) {
  const m = catMeta[category] || { icon: CircleDot, label: category };
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px text-[11px] font-medium text-muted-foreground">
      <Icon className="h-3 w-3" strokeWidth={1.5} />
      {m.label}
    </span>
  );
}

function TaskRow({
  task,
  onToggle,
  dueColor,
}: {
  task: DashboardTask;
  onToggle: (id: string) => void;
  dueColor?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const dueLabel =
    task.due_date === today
      ? "Today"
      : task.due_date ===
        new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      ? "Tomorrow"
      : new Date(task.due_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-dash-surface-alt ${
        task.is_completed ? "opacity-40" : ""
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all duration-150 ${
          task.is_completed
            ? "border-[#1B7A44] bg-[#1B7A44]"
            : "border-dash-surface-hover bg-transparent"
        }`}
      >
        {task.is_completed && (
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`text-[13px] font-medium ${
            task.is_completed
              ? "text-dash-text-faint line-through"
              : "text-foreground"
          }`}
        >
          {task.title}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <CatTag category={task.category} />
          <span className="text-[11px] text-dash-text-faint">
            {task.loan_name || "No loan"}
          </span>
        </div>
      </div>
      <span
        className={`shrink-0 text-xs font-semibold num ${
          dueColor || "text-dash-text-faint"
        }`}
      >
        {dueLabel}
      </span>
    </div>
  );
}

interface TaskQueueProps {
  tasks: DashboardTask[];
  onToggle: (id: string) => void;
}

export function TaskQueue({ tasks, onToggle }: TaskQueueProps) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(
    (t) => t.due_date === today && !t.is_past_due
  );
  const upcomingTasks = tasks.filter(
    (t) => t.due_date !== today && !t.is_past_due
  );
  const todayRemaining = todayTasks.filter((t) => !t.is_completed).length;

  return (
    <Card className="mb-4 p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Your Tasks
        </span>
        <button className="flex items-center gap-1.5 rounded-md border border-[#1B7A44]/20 bg-[#1B7A44]/5 px-3 py-1.5 text-xs font-semibold text-[#1B7A44] transition-colors hover:bg-[#1B7A44]/10">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add Task
        </button>
      </div>

      {/* Today section */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B8822A]">
          Today
        </span>
        <span className="rounded-full bg-[#B8822A]/10 px-1.5 py-px text-[10px] font-semibold text-[#B8822A] num">
          {todayRemaining} remaining
        </span>
      </div>
      {todayTasks.length === 0 ? (
        <div className="px-3 py-4 text-center text-[13px] text-muted-foreground">
          No tasks due today
        </div>
      ) : (
        todayTasks.map((tk) => (
          <TaskRow
            key={tk.id}
            task={tk}
            onToggle={onToggle}
            dueColor={!tk.is_completed ? "text-[#B8822A]" : undefined}
          />
        ))
      )}

      {/* Upcoming section */}
      <div className="mb-1.5 mt-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-dash-text-faint">
          Upcoming
        </span>
      </div>
      {upcomingTasks.length === 0 ? (
        <div className="px-3 py-4 text-center text-[13px] text-muted-foreground">
          No upcoming tasks
        </div>
      ) : (
        upcomingTasks.map((tk) => (
          <TaskRow key={tk.id} task={tk} onToggle={onToggle} />
        ))
      )}
    </Card>
  );
}
