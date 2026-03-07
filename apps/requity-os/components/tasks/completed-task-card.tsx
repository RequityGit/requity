"use client";

import { Check } from "lucide-react";
import { CategoryPill } from "./category-pill";
import { relativeTime } from "@/lib/comment-utils";
import type { OpsTask } from "@/lib/tasks";

interface CompletedTaskCardProps {
  task: OpsTask;
  onClick: (task: OpsTask) => void;
}

export function CompletedTaskCard({ task, onClick }: CompletedTaskCardProps) {
  return (
    <div
      onClick={() => onClick(task)}
      className="flex items-center gap-2.5 rounded-lg p-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-green-600">
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </div>
      <span className="text-sm text-muted-foreground line-through flex-1 truncate">
        {task.title}
      </span>
      <CategoryPill category={task.category} />
      {task.completed_at && (
        <span className="text-[11px] text-muted-foreground/60 num flex-shrink-0">
          {relativeTime(task.completed_at)}
        </span>
      )}
    </div>
  );
}
