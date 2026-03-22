"use client";

import { useState } from "react";
import {
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Lock,
  ThumbsUp,
  FileCheck,
  MoreHorizontal,
  Reply,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseComment, relativeTime } from "@/lib/comment-utils";
import { MentionInput } from "@/components/shared/mention-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NoteData } from "./types";
import { getUserColor } from "@/lib/user-colors";
import { AttachmentList } from "@/components/shared/attachments";

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
  /** Only passed for top-level notes (not replies) */
  onReply?: () => void;
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
  onReply,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const isOwn = note.author_id === currentUserId;
  const canEdit = isOwn;
  const segments = parseComment(note.body);
  const initials = note.author_name ? getInitials(note.author_name) : "??";

  const likes = note.note_likes ?? [];
  const isLiked = likes.some((l) => l.user_id === currentUserId);
  const likeCount = likes.length;
  const likeNames = likes
    .map((l) => l.profiles?.full_name ?? "Unknown")
    .join(", ");

  // Accent color for author name and avatar
  const authorColor = getUserColor({
    id: note.author_id,
    accent_color: null, // Will use hash fallback; accent_color would come from profile if fetched
  });

  const avatarSize = compact ? 24 : 32;
  const bodyText = compact ? "text-[12px]" : "text-[13px]";

  if (editing) {
    return (
      <div className="activity-message">
        <div>
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
      </div>
    );
  }

  return (
    <div
      className={cn(
        "activity-message",
        note.is_pinned &&
          "border-l-2 border-l-amber-400/60 dark:border-l-amber-500/40 rounded-l-none"
      )}
    >
      <div className="flex gap-3">
        {/* Avatar with accent color tint */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center font-semibold"
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: `${authorColor}14`,
            border: `1.5px solid ${authorColor}30`,
            color: authorColor,
            fontSize: avatarSize * 0.34,
            letterSpacing: "-0.03em",
          }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: name + time + badges */}
          <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[13px] font-semibold leading-tight"
              style={{ color: authorColor }}
            >
              {note.author_name || "Unknown"}
            </span>
            <span className="text-[11px] text-muted-foreground/50 num">
              {relativeTime(note.created_at)}
            </span>
            {note.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded bg-amber-500/10 text-amber-500">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Pinned
              </span>
            )}
            {note.is_internal && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Lock className="h-2.5 w-2.5" strokeWidth={2.5} />
                Internal
              </span>
            )}
            {note.is_edited && (
              <span className="text-[10px] text-muted-foreground/40">
                (edited)
              </span>
            )}
            {note.condition_name && (
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-px rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <FileCheck className="h-2.5 w-2.5" strokeWidth={2} />
                {note.condition_name}
              </span>
            )}
          </div>

          {/* Body text */}
          <div
            className={cn(
              bodyText,
              "leading-[1.75] text-foreground/60 whitespace-pre-wrap"
            )}
          >
            {segments.map((seg, i) =>
              seg.type === "mention" ? (
                <span
                  key={i}
                  className="font-medium text-blue-500 dark:text-blue-400 bg-blue-500/[0.08] px-0.5 rounded"
                >
                  @{seg.value}
                </span>
              ) : (
                <span key={i}>{seg.value}</span>
              )
            )}
          </div>

          {/* Attachments */}
          {note.note_attachments && note.note_attachments.length > 0 && (
            <AttachmentList
              attachments={note.note_attachments.map((a) => ({
                id: a.id,
                fileName: a.file_name,
                fileType: a.file_type,
                fileSize: a.file_size_bytes,
                storagePath: a.storage_path,
              }))}
              compact
            />
          )}

          {/* Reaction pills */}
          {likeCount > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <button
                type="button"
                onClick={() => onToggleLike(note.id, isLiked)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                  isLiked
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <ThumbsUp
                  className="h-3 w-3"
                  strokeWidth={1.5}
                  fill={isLiked ? "currentColor" : "none"}
                />
                <span className="num">{likeCount}</span>
              </button>
              {likeCount > 0 && (
                <span className="text-[10px] text-muted-foreground/40 self-center">
                  {likeNames}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating hover toolbar */}
      <div className="hover-toolbar absolute -top-2 right-3 flex items-center gap-px bg-card border border-border rounded-lg shadow-md p-0.5 z-10">
        <HoverToolbarButton
          onClick={() => onToggleLike(note.id, isLiked)}
          title={isLiked ? "Unlike" : "Like"}
          active={isLiked}
        >
          <ThumbsUp
            className="h-3.5 w-3.5"
            strokeWidth={1.5}
            fill={isLiked ? "currentColor" : "none"}
          />
        </HoverToolbarButton>

        {onReply && (
          <HoverToolbarButton onClick={onReply} title="Reply">
            <Reply className="h-3.5 w-3.5" strokeWidth={1.5} />
          </HoverToolbarButton>
        )}

        {showPinning && (
          <HoverToolbarButton
            onClick={() => onPin(note.id, note.is_pinned)}
            title={note.is_pinned ? "Unpin" : "Pin"}
          >
            {note.is_pinned ? (
              <PinOff className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <Pin className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </HoverToolbarButton>
        )}

        {(canEdit || isOwn) && (
          <>
            <div className="w-px h-4 bg-border mx-0.5" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(true);
                      setEditText(note.body);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwn && (
                  <DropdownMenuItem
                    onClick={() => onDelete(note.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" strokeWidth={1.5} />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}

function HoverToolbarButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center justify-center h-7 w-7 rounded-md transition-colors",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
