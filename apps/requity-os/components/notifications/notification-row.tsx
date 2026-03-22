"use client";

import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications";
import { formatRelativeTime } from "@/lib/notifications";
import { stripMentionMarkup } from "@/lib/comment-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NotificationRowProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

// Avatar color palette (deterministic by name)
const AVATAR_COLORS = [
  { bg: "bg-[#2a1f3d]", text: "text-[#a78bfa]" },
  { bg: "bg-[#1a3d2a]", text: "text-[#4ade80]" },
  { bg: "bg-[#3d2a1f]", text: "text-[#fb923c]" },
  { bg: "bg-[#1f2a3d]", text: "text-[#60a5fa]" },
  { bg: "bg-[#3d1f2a]", text: "text-[#f472b6]" },
  { bg: "bg-[#2a3d1f]", text: "text-[#a3e635]" },
  { bg: "bg-[#1f3d3d]", text: "text-[#2dd4bf]" },
  { bg: "bg-[#3d1f1f]", text: "text-[#f87171]" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Common verbs to split actor name from action in notification titles
const ACTION_VERBS = [
  "mentioned",
  "replied",
  "liked",
  "reacted",
  "assigned",
  "requested",
  "uploaded",
  "moved",
  "cleared",
  "updated",
  "changed",
  "completed",
  "created",
  "added",
  "removed",
  "approved",
  "rejected",
];

function parseTitle(title: string): { actor: string; action: string } {
  for (const verb of ACTION_VERBS) {
    const idx = title.indexOf(` ${verb}`);
    if (idx > 0) {
      return {
        actor: title.slice(0, idx),
        action: title.slice(idx + 1),
      };
    }
  }
  // Fallback: first two words as actor
  const words = title.split(" ");
  if (words.length > 2) {
    return {
      actor: words.slice(0, 2).join(" "),
      action: words.slice(2).join(" "),
    };
  }
  return { actor: title, action: "" };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getTypeBadge(
  slug: string
): { label: string; colorClass: string } | null {
  if (slug.includes("mention"))
    return { label: "Mention", colorClass: "bg-blue-500/10 text-blue-500" };
  if (slug.includes("reply") || slug.includes("thread"))
    return { label: "Thread", colorClass: "bg-purple-500/10 text-purple-400" };
  if (slug.includes("like") || slug.includes("reaction"))
    return { label: "Liked", colorClass: "bg-amber-500/10 text-amber-500" };
  if (slug.includes("task"))
    return {
      label: "Task",
      colorClass: "bg-emerald-500/10 text-emerald-500",
    };
  if (slug.includes("condition"))
    return { label: "Condition", colorClass: "bg-teal-500/10 text-teal-400" };
  if (slug.includes("approval"))
    return { label: "Approval", colorClass: "bg-blue-500/10 text-blue-400" };
  return null;
}

export function NotificationRow({
  notification,
  isSelected,
  onSelect,
}: NotificationRowProps) {
  const isUnread = notification.read_at === null;
  const { actor, action } = parseTitle(notification.title);
  const initials = getInitials(actor);
  const avatarColor = getAvatarColor(actor);
  const typeBadge = getTypeBadge(notification.notification_slug);

  return (
    <div
      onClick={() => onSelect(notification.id)}
      className={cn(
        "flex gap-2.5 px-3.5 py-2.5 cursor-pointer rq-transition relative",
        "border-l-[3px] border-l-transparent",
        isSelected && "bg-blue-500/[0.06] border-l-blue-500",
        !isSelected && isUnread && "border-l-blue-500",
        !isSelected && "hover:bg-foreground/[0.02]"
      )}
    >
      <Avatar className="h-7 w-7 rounded-lg flex-shrink-0">
        <AvatarFallback
          className={cn(
            "rounded-lg text-[10px] font-semibold",
            avatarColor.bg,
            avatarColor.text
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
            {actor}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {action}
          </span>
          <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap ml-auto flex-shrink-0">
            {formatRelativeTime(notification.created_at)}
          </span>
        </div>

        {notification.body && (
          <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed mb-1">
            {stripMentionMarkup(notification.body)}
          </p>
        )}

        <div className="flex items-center gap-1">
          {typeBadge && (
            <span
              className={cn(
                "inline-flex items-center text-[9px] font-semibold px-1.5 py-px rounded",
                typeBadge.colorClass
              )}
            >
              {typeBadge.label}
            </span>
          )}
          {notification.entity_label && (
            <span className="text-[9px] text-muted-foreground/60">
              {notification.entity_label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
