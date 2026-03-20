"use client";

import { Pin, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/notifications";

/** Shape of a note returned for the deal preview strip (matches server DealNoteRow). */
export type DealPreviewNote = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string | null;
  is_pinned: boolean | null;
  deal_id: string | null;
};

export interface DealNotePreviewProps {
  pinnedNote: DealPreviewNote | null;
  recentNote: DealPreviewNote | null;
  onClickGoToNotes: () => void;
}

export function DealNotePreview({
  pinnedNote,
  recentNote,
  onClickGoToNotes,
}: DealNotePreviewProps) {
  const note = pinnedNote ?? recentNote;

  if (!note) return null;

  const isPinned = !!pinnedNote;
  const authorName = note.author_name?.trim() ?? "Unknown";

  const previewText =
    note.body.length > 200 ? note.body.slice(0, 200) + "..." : note.body;

  return (
    <button
      type="button"
      onClick={onClickGoToNotes}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2 text-left",
        "border-b border-border transition-colors cursor-pointer",
        "hover:bg-muted/50",
        isPinned ? "bg-info/5" : "bg-transparent"
      )}
    >
      {isPinned ? (
        <Pin
          className="h-3.5 w-3.5 text-info shrink-0"
          strokeWidth={1.5}
        />
      ) : (
        <MessageSquare
          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
          strokeWidth={1.5}
        />
      )}

      <span className="flex-1 text-xs text-muted-foreground truncate min-w-0">
        <span className="font-medium text-foreground">{authorName}:</span>{" "}
        {previewText}
      </span>

      <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
        {formatRelativeTime(note.created_at)}
      </span>
    </button>
  );
}
