"use client";

import { useState, useEffect, useRef } from "react";
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
  fading,
}: {
  task: DashboardTask;
  onToggle: (id: string) => void;
  dueColor?: string;
  fading?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const dueLabel = !task.due_date
    ? "No date"
    : task.due_date === today
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
      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-500 hover:bg-dash-surface-alt ${
        task.status === "Complete" ? "opacity-40" : ""
      } ${fading ? "max-h-0 opacity-0 overflow-hidden py-0 my-0" : "max-h-24"}`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 transition-all duration-150 ${
          task.status === "Complete"
            ? "border-[#1B7A44] bg-[#1B7A44]"
            : "border-dash-surface-hover bg-transparent"
        }`}
      >
        {task.status === "Complete" && (
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`text-[13px] font-medium ${
            task.status === "Complete"
              ? "text-dash-text-faint line-through"
              : "text-foreground"
          }`}
        >
          {task.title}
        </div>
        {task.category && (
          <div className="mt-1 flex items-center gap-2">
            <CatTag category={task.category} />
          </div>
        )}
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
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const prevTasksRef = useRef<DashboardTask[]>(tasks);

  // Detect newly completed tasks and schedule fade-out
  useEffect(() => {
    const prev = prevTasksRef.current;
    const newlyCompleted = tasks.filter((t) => {
      const prevTask = prev.find((p) => p.id === t.id);
      return t.status === "Complete" && prevTask && prevTask.status !== "Complete";
    });

    if (newlyCompleted.length > 0) {
      const idList = newlyCompleted.map((t) => t.id);
      // Start fading after a brief pause to show the checkmark
      const fadeTimer = setTimeout(() => {
        setFadingIds((f) => {
          const next = new Set(Array.from(f));
          idList.forEach((id) => next.add(id));
          return next;
        });
      }, 1200);
      // Remove from DOM after the fade animation completes
      const hideTimer = setTimeout(() => {
        setFadingIds((f) => {
          const next = new Set(Array.from(f));
          idList.forEach((id) => next.delete(id));
          return next;
        });
        setHiddenIds((h) => {
          const next = new Set(Array.from(h));
          idList.forEach((id) => next.add(id));
          return next;
        });
      }, 1800);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [tasks]);

  // Keep ref in sync
  useEffect(() => {
    prevTasksRef.current = tasks;
  }, [tasks]);

  // If a task gets un-completed, bring it back
  useEffect(() => {
    const uncompleted = tasks.filter(
      (t) => t.status !== "Complete" && hiddenIds.has(t.id)
    );
    if (uncompleted.length > 0) {
      setHiddenIds((h) => {
        const next = new Set(h);
        uncompleted.forEach((t) => next.delete(t.id));
        return next;
      });
    }
  }, [tasks, hiddenIds]);

  const today = new Date().toISOString().slice(0, 10);
  const isPastDue = (t: DashboardTask) =>
    t.due_date != null && t.due_date < today && t.status !== "Complete";
  const todayTasks = tasks.filter(
    (t) => t.due_date === today && !isPastDue(t) && !hiddenIds.has(t.id)
  );
  const upcomingTasks = tasks.filter(
    (t) => t.due_date !== today && !isPastDue(t) && !hiddenIds.has(t.id)
  ).sort((a, b) => {
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    return 0;
  });
  const todayRemaining = todayTasks.filter((t) => t.status !== "Complete").length;

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
            dueColor={tk.status !== "Complete" ? "text-[#B8822A]" : undefined}
            fading={fadingIds.has(tk.id)}
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
          <TaskRow
            key={tk.id}
            task={tk}
            onToggle={onToggle}
            fading={fadingIds.has(tk.id)}
          />
        ))
      )}
    </Card>
  );
}
