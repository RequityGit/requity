"use client";

import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Lock,
  FileText,
  MessageCircle,
  Mail,
  Smartphone,
  Monitor,
  Paperclip,
} from "lucide-react";
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
}

export function ActivityFeedItem({ item, currentUserId }: ActivityFeedItemProps) {
  if (item.type === "note" || item.type === "condition_note") {
    return <NoteItem item={item} />;
  }
  if (item.type === "borrower_message") {
    return <MessageItem item={item} />;
  }
  if (item.type === "system_event") {
    return <SystemEventItem item={item} />;
  }
  return null;
}

// ─── Note / Condition Note ───

function NoteItem({ item }: { item: ActivityItem }) {
  const note = item.noteData;
  if (!note) return null;

  const authorName = note.author_name ?? "Unknown";
  const isReply = !!note.parent_note_id;
  const hasAttachments =
    note.note_attachments && note.note_attachments.length > 0;

  return (
    <div className="group px-4 py-2.5 hover:bg-muted/30 rq-transition">
      <div className="flex gap-2.5">
        {/* Avatar */}
        <Avatar className="h-6 w-6 rounded-lg flex-shrink-0 mt-0.5">
          <AvatarFallback className="rounded-lg bg-foreground/[0.06] text-foreground text-[8px] font-semibold">
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header: name + time + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-semibold text-foreground leading-none">
              {authorName}
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              {timeAgo(note.created_at)}
            </span>

            {/* Internal badge */}
            {note.is_internal && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10">
                <Lock className="h-2.5 w-2.5" />
                Internal
              </span>
            )}

            {/* Condition badge */}
            {item.type === "condition_note" && item.conditionName && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-teal-600 dark:text-teal-400 bg-teal-500/10 max-w-[180px] truncate">
                <FileText className="h-2.5 w-2.5 flex-shrink-0" />
                {item.conditionName}
              </span>
            )}

            {/* Reply indicator */}
            {isReply && (
              <span className="text-[9px] text-muted-foreground/60 italic">
                reply
              </span>
            )}
          </div>

          {/* Body */}
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
            {note.body}
          </p>

          {/* Attachments */}
          {hasAttachments && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {note.note_attachments!.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  <Paperclip className="h-2.5 w-2.5" />
                  <span className="max-w-[120px] truncate">{att.file_name}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
