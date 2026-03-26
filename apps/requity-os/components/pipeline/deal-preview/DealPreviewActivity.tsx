"use client";

import { cn } from "@/lib/utils";
import {
  AtSign,
  Paperclip,
  Send,
  Shield,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { useAutoExpand } from "@/hooks/useAutoExpand";
import { timeAgo } from "@/lib/format";
import type { DealPreviewData, DealNote } from "./useDealPreviewData";
import type { DealActivity } from "../pipeline-types";

// ─── Helpers ───

function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type FeedItem =
  | { type: "note"; note: DealNote; time: Date }
  | { type: "activity"; activity: DealActivity; time: Date };

function buildFeed(notes: DealNote[], activity: DealActivity[]): FeedItem[] {
  const items: FeedItem[] = [];

  for (const n of notes) {
    items.push({ type: "note", note: n, time: new Date(n.created_at) });
  }
  for (const a of activity) {
    items.push({ type: "activity", activity: a, time: new Date(a.created_at) });
  }

  // Newest first
  items.sort((a, b) => b.time.getTime() - a.time.getTime());
  return items;
}

function activityDotColor(type: string): string {
  if (type === "stage_change" || type === "status_change") return "bg-blue-500";
  if (type.includes("doc") || type.includes("upload")) return "bg-emerald-500";
  return "bg-muted-foreground/30";
}

// ─── Component ───

interface DealPreviewActivityProps {
  data: DealPreviewData;
  onPostNote: (body: string, isInternal: boolean) => Promise<void>;
  noteInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function DealPreviewActivity({
  data,
  onPostNote,
  noteInputRef,
}: DealPreviewActivityProps) {
  const { notes, activity } = data;
  const feed = buildFeed(notes, activity);

  const [noteText, setNoteText] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [posting, setPosting] = useState(false);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = noteInputRef ?? localRef;

  useAutoExpand(textareaRef, noteText);

  const handlePost = useCallback(async () => {
    const text = noteText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await onPostNote(text, isInternal);
      setNoteText("");
    } finally {
      setPosting(false);
    }
  }, [noteText, isInternal, posting, onPostNote]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handlePost();
      }
    },
    [handlePost]
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col border-r border-border/50">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-2.5">
        <span className="text-[13px] font-semibold text-foreground">Activity</span>
        <span className="text-[10px] text-muted-foreground">
          <Kbd>N</Kbd> to add note
        </span>
      </div>

      {/* Feed */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-2.5">
        {feed.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">No activity yet</div>
        )}
        {feed.map((item, i) => {
          if (item.type === "note") {
            return <NoteItem key={`n-${item.note.id}`} note={item.note} />;
          }
          return <ActivityItem key={`a-${item.activity.id}-${i}`} activity={item.activity} />;
        })}
      </div>

      {/* Note composer */}
      <div className="shrink-0 px-4 pb-3">
        <div className="overflow-hidden rounded-lg border border-border rq-transition focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
          <textarea
            ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
            rows={2}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a note... use @mention to tag"
            className="w-full resize-none overflow-hidden border-none bg-transparent px-2.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-2.5 py-1.5">
            <div className="flex items-center gap-1">
              <button className="flex rounded p-1 text-muted-foreground rq-transition hover:text-foreground">
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <button className="flex rounded p-1 text-muted-foreground rq-transition hover:text-foreground">
                <AtSign className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsInternal((v) => !v)}
                className={cn(
                  "flex items-center gap-1 rounded px-1 py-0.5 text-[9px] font-semibold rq-transition",
                  isInternal
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="h-2.5 w-2.5" />
                {isInternal ? "Internal" : "Visible"}
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={!noteText.trim() || posting}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium rq-transition",
                noteText.trim()
                  ? "bg-foreground text-background cursor-pointer hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-default"
              )}
            >
              <Send className="h-2.5 w-2.5" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Feed sub-components ───

function NoteItem({ note }: { note: DealNote }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        note.is_internal
          ? "border-amber-200/60 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/10"
          : "border-border bg-muted/20"
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
            {getInitials(note.author_name ?? "")}
          </span>
          <span className="text-xs font-semibold text-foreground">{note.author_name ?? "Unknown"}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(note.created_at)}</span>
        </div>
        {note.is_internal && (
          <span className="flex items-center gap-1 rounded bg-amber-100/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Shield className="h-2 w-2" />Internal
          </span>
        )}
      </div>
      <p className="m-0 pl-[26px] text-xs leading-relaxed text-muted-foreground">{note.body}</p>
    </div>
  );
}

function ActivityItem({ activity }: { activity: DealActivity }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className={cn("h-[5px] w-[5px] shrink-0 rounded-full", activityDotColor(activity.activity_type))} />
      <span className="flex-1 truncate text-[11px] text-muted-foreground">
        {activity.title || activity.description || activity.activity_type}
      </span>
      <span className="num shrink-0 text-[10px] text-muted-foreground">{timeAgo(activity.created_at)}</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-background px-1 py-px text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
