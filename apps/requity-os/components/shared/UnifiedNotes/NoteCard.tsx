"use client";

import { useState } from "react";
import { Pin, PinOff, Pencil, Trash2, Lock, ThumbsUp } from "lucide-react";
import { parseComment, relativeTime } from "@/lib/comment-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MentionInput } from "@/components/shared/mention-input";
import type { NoteData } from "./types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface NoteCardProps {
  note: NoteData;
  currentUserId: string;
  showPinning: boolean;
  compact: boolean;
  onPin: (noteId: string, isPinned: boolean) => void;
  onEdit: (noteId: string, body: string, mentionIds: string[]) => void;
  onDelete: (noteId: string) => void;
  onToggleLike: (noteId: string, isLiked: boolean) => void;
}

export function NoteCard({
  note,
  currentUserId,
  showPinning,
  compact,
  onPin,
  onEdit,
  onDelete,
  onToggleLike,
}: NoteCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const isOwn = note.author_id === currentUserId;
  const canEdit =
    isOwn &&
    Date.now() - new Date(note.created_at).getTime() < 15 * 60 * 1000;
  const segments = parseComment(note.body);
  const initials = note.author_name ? getInitials(note.author_name) : "??";

  const likes = note.note_likes ?? [];
  const isLiked = likes.some((l) => l.user_id === currentUserId);
  const likeCount = likes.length;
  const likeNames = likes.map((l) => l.profiles?.full_name ?? "Unknown").join(", ");

  const pad = compact ? "p-3" : "p-4";
  const avatarSize = compact ? "h-6 w-6" : "h-8 w-8";
  const avatarText = compact ? "text-[9px]" : "text-[10px]";
  const bodyText = compact ? "text-[12px]" : "text-[13px]";

  if (editing) {
    return (
      <div className={`rounded-xl border border-border bg-card ${pad}`}>
        <MentionInput
          value={editText}
          onChange={setEditText}
          onSubmit={(text, ids) => {
            onEdit(note.id, text, ids);
            setEditing(false);
            setEditText("");
          }}
          submitLabel="Save"
          submitIcon={<Pencil className="h-3 w-3" />}
          rows={2}
          extraControls={
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditText("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border bg-card ${pad} relative group ${
        note.is_internal
          ? "border-l-[3px] border-l-[rgba(184,130,42,0.25)] border-t-border border-r-border border-b-border"
          : "border-border"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-2.5">
        <Avatar className={`${avatarSize} rounded-lg flex-shrink-0`}>
          <AvatarFallback
            className={`rounded-lg bg-foreground/[0.06] text-foreground ${avatarText} font-semibold`}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-foreground">
              {note.author_name || "Unknown"}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground num">
              {relativeTime(note.created_at)}
            </span>
            {note.is_internal && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-px">
                <Lock className="h-2.5 w-2.5" strokeWidth={2} />
                Internal
              </span>
            )}
            {note.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full px-1.5 py-px">
                <Pin className="h-2.5 w-2.5" strokeWidth={2} />
                Pinned
              </span>
            )}
            {note.is_edited && (
              <span className="text-[10px] text-muted-foreground">(edited)</span>
            )}
          </div>

          <div
            className={`mt-1 ${bodyText} leading-relaxed text-foreground whitespace-pre-wrap`}
          >
            {segments.map((seg, i) =>
              seg.type === "mention" ? (
                <span
                  key={i}
                  className="inline-flex items-center font-semibold text-foreground bg-muted border border-border rounded px-1 mx-0.5 text-[12px]"
                >
                  @{seg.value}
                </span>
              ) : (
                <span key={i}>{seg.value}</span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Like row */}
      <div className="pl-10 pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleLike(note.id, isLiked)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
            isLiked
              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ThumbsUp
            size={12}
            strokeWidth={1.5}
            fill={isLiked ? "currentColor" : "none"}
          />
          {likeCount > 0 && <span className="num">{likeCount}</span>}
        </button>
        {likeCount > 0 && (
          <span className="text-xs text-muted-foreground">{likeNames}</span>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute -top-2 right-2 flex items-center gap-0.5 bg-background border border-border rounded-md shadow-sm px-0.5 py-0.5">
          {showPinning && (
            <button
              type="button"
              onClick={() => onPin(note.id, note.is_pinned)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title={note.is_pinned ? "Unpin" : "Pin"}
            >
              {note.is_pinned ? (
                <PinOff className="h-3 w-3" />
              ) : (
                <Pin className="h-3 w-3" />
              )}
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setEditText(note.body);
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {isOwn && (
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
