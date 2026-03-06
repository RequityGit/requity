"use client";

import { cn } from "@/lib/utils";
import {
  Calendar,
  MessageSquare,
  Paperclip,
  Repeat,
  Building2,
  FileText,
  Users,
  Landmark,
} from "lucide-react";
import { relativeTime } from "@/lib/comment-utils";
import type { OpsTask, Profile } from "./tasks-board";

const ENTITY_ICONS: Record<string, { icon: typeof Building2; color: string }> = {
  loan: { icon: Building2, color: "text-blue-400" },
  borrower: { icon: Users, color: "text-purple-400" },
  investor: { icon: Users, color: "text-purple-400" },
  fund: { icon: Landmark, color: "text-amber-400" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DueTag({ date }: { date: string | null }) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  const colorClass =
    diff < 0
      ? "text-red-400"
      : diff <= 2
        ? "text-amber-400"
        : "text-muted-foreground";

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-[11px] font-medium num", colorClass)}
    >
      <Calendar className="h-[11px] w-[11px]" strokeWidth={1.5} />
      {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      {diff < 0 && " — overdue"}
    </span>
  );
}

function LinkedTag({
  type,
  label,
}: {
  type: string | null;
  label: string | null;
}) {
  if (!type || !label) return null;
  const config = ENTITY_ICONS[type];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium bg-secondary rounded px-1.5 py-0.5 max-w-[200px]",
        config.color
      )}
    >
      <Icon className="h-[11px] w-[11px] flex-shrink-0" strokeWidth={1.5} />
      <span className="truncate">{label}</span>
    </span>
  );
}

interface TaskCardProps {
  task: OpsTask;
  profiles: Profile[];
  commentCount: number;
  attachmentCount: number;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onClick: () => void;
}

export function TaskCard({
  task,
  profiles,
  commentCount,
  attachmentCount,
  onDragStart,
  onClick,
}: TaskCardProps) {
  const stale =
    task.updated_at &&
    Date.now() - new Date(task.updated_at).getTime() > 5 * 86400000;

  const assignee = task.assigned_to
    ? profiles.find((p) => p.id === task.assigned_to)
    : null;
  const assigneeName =
    assignee?.full_name || task.assigned_to_name || null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className="bg-card rounded-lg border border-border hover:border-border/80 p-3.5 cursor-grab active:cursor-grabbing transition-[border-color,box-shadow] hover:shadow-sm flex flex-col gap-2"
    >
      {/* Title + recurring icon */}
      <div className="flex items-start gap-2">
        <span className="text-[13px] font-semibold leading-snug flex-1">
          {task.title}
        </span>
        {task.is_recurring && (
          <Repeat
            className="h-[13px] w-[13px] text-blue-400 flex-shrink-0 mt-0.5"
            strokeWidth={1.5}
          />
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <DueTag date={task.due_date} />
        <LinkedTag
          type={task.linked_entity_type}
          label={task.linked_entity_label}
        />
        {attachmentCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Paperclip className="h-[11px] w-[11px]" strokeWidth={1.5} />
            {attachmentCount}
          </span>
        )}
        {commentCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageSquare
              className="h-[11px] w-[11px]"
              strokeWidth={1.5}
            />
            {commentCount}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-0.5">
        {assigneeName ? (
          <div className="flex items-center gap-1.5">
            <div className="w-[22px] h-[22px] rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
              {getInitials(assigneeName)}
            </div>
            <span className="text-[12px] font-medium text-muted-foreground">
              {assigneeName}
            </span>
          </div>
        ) : (
          <div />
        )}
        {task.updated_at && (
          <span
            className={cn(
              "text-[10px] font-medium num",
              stale
                ? "text-amber-400"
                : "text-muted-foreground/60"
            )}
          >
            {stale && "stale \u00B7 "}
            {relativeTime(task.updated_at)}
          </span>
        )}
      </div>
    </div>
  );
}
