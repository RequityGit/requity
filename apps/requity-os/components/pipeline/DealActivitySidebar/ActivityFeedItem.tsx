"use client";

import { timeAgo } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle,
  Mail,
  Smartphone,
  Monitor,
} from "lucide-react";
import { NoteCard } from "@/components/shared/UnifiedNotes/NoteCard";
import type { ActivityItem } from "@/hooks/useActivityFeed";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ActivityFeedItemProps {
  item: ActivityItem;
  currentUserId: string;
  onToggleLike: (noteId: string, isLiked: boolean) => void;
  onEdit: (noteId: string, body: string, mentionIds: string[]) => void;
  onDelete: (noteId: string) => void;
  onPin: (noteId: string, isPinned: boolean) => void;
}

export function ActivityFeedItem({
  item,
  currentUserId,
  onToggleLike,
  onEdit,
  onDelete,
  onPin,
}: ActivityFeedItemProps) {
  if (item.type === "note" || item.type === "condition_note") {
    const note = item.noteData;
    if (!note) return null;

    // Enrich condition_name from the activity item if not already on noteData
    const enrichedNote =
      item.type === "condition_note" && item.conditionName && !note.condition_name
        ? { ...note, condition_name: item.conditionName }
        : note;

    return (
      <div className="px-2">
        <NoteCard
          note={enrichedNote}
          currentUserId={currentUserId}
          showPinning
          compact
          onToggleLike={onToggleLike}
          onEdit={onEdit}
          onDelete={onDelete}
          onPin={onPin}
        />
      </div>
    );
  }
  if (item.type === "borrower_message") {
    return <MessageItem item={item} />;
  }
  if (item.type === "system_event") {
    return <SystemEventItem item={item} />;
  }
  return null;
}

// ─── Borrower Message ───

function MessageItem({ item }: { item: ActivityItem }) {
  const msg = item.messageData;
  if (!msg) return null;

  const sourceIcon =
    msg.source === "email" ? (
      <Mail className="h-2.5 w-2.5" />
    ) : msg.source === "sms" ? (
      <Smartphone className="h-2.5 w-2.5" />
    ) : (
      <Monitor className="h-2.5 w-2.5" />
    );

  return (
    <div className="group px-4 py-2.5 hover:bg-muted/30 rq-transition">
      <div className="flex gap-2.5">
        {/* Avatar */}
        <Avatar className="h-6 w-6 rounded-lg flex-shrink-0 mt-0.5">
          <AvatarFallback className="rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-semibold">
            {getInitials(msg.sender_name || "?")}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-semibold text-foreground leading-none">
              {msg.sender_name}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none flex items-center gap-0.5">
              {sourceIcon}
              {timeAgo(msg.created_at)}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10">
              <MessageCircle className="h-2.5 w-2.5" />
              {msg.sender_type === "admin" ? "Admin" : "Borrower"}
            </span>
          </div>

          {/* Body */}
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
            {msg.body}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── System Event ───

function SystemEventItem({ item }: { item: ActivityItem }) {
  const event = item.eventData;
  if (!event) return null;

  return (
    <div className="px-4 py-1.5">
      <div className="flex items-center gap-2 ml-8">
        <span className="text-[10px] text-muted-foreground/70 leading-none">
          {event.description}
        </span>
        <span className="text-[10px] text-muted-foreground/50 leading-none">
          {timeAgo(item.timestamp)}
        </span>
      </div>
    </div>
  );
}
