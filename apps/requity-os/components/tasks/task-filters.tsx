"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_TYPE_FILTER,
  type TaskTypeFilter,
} from "@/lib/tasks";

interface TaskFiltersProps {
  assigneeOptions: { value: string; label: string }[];
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  typeFilter: TaskTypeFilter;
  onTypeFilterChange: (value: TaskTypeFilter) => void;
}

const TYPE_LABELS: Record<TaskTypeFilter, string> = {
  all: "All",
  task: "Tasks",
  approval: "Approvals",
};

export function TaskFilters({
  assigneeOptions,
  assigneeFilter,
  onAssigneeChange,
  categoryFilter,
  onCategoryChange,
  priorityFilter,
  onPriorityChange,
  typeFilter,
  onTypeFilterChange,
}: TaskFiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      {/* Segmented type filter */}
      <div className="flex rounded-md overflow-hidden border border-border">
        {TASK_TYPE_FILTER.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeFilterChange(t)}
            className={cn(
              "px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:bg-accent",
              i < TASK_TYPE_FILTER.length - 1 && "border-r border-border"
            )}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-[160px] h-9 text-[13px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {assigneeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[170px] h-9 text-[13px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {TASK_CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px] h-9 text-[13px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
