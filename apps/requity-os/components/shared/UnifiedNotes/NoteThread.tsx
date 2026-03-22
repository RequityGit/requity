"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  ChevronDown,
  Send,
  Loader2,
  Lock,
  LockOpen,
} from "lucide-react";
import { relativeTime } from "@/lib/comment-utils";
import {
  MentionInput,
  MentionInputHandle,
} from "@/components/shared/mention-input";
import { NoteCard } from "./NoteCard";
import type { NoteData } from "./types";

interface NoteThreadProps {
  note: NoteData;
  replies: NoteData[];
  currentUserId: string;
  currentUserName: string;
  showPinning: boolean;
  showInternalToggle: boolean;
  defaultInternal: boolean;
  compact: boolean;
  onPin: (noteId: string, isPinned: boolean) => void;
  onEdit: (noteId: string, body: string, mentionIds: string[]) => void;
  onDelete: (noteId: string) => void;
  onToggleLike: (noteId: string, isLiked: boolean) => void;
  onReply: (
    parentNoteId: string,
    body: string,
    isInternal: boolean,
    mentionIds: string[]
  ) => Promise<void>;
}

export function NoteThread({
  note,
  replies,
  currentUserId,
  currentUserName,
  showPinning,
  showInternalToggle,
  defaultInternal,
  compact,
  onPin,
  onEdit,
  onDelete,
  onToggleLike,
  onReply,
}: NoteThreadProps) {
  const [expanded, setExpanded] = useState(replies.length > 0 && replies.length <= 2);
  const replyComposerRef = useRef<MentionInputHandle>(null);

  // Auto-expand when replies go from 0 to having some (first reply just posted)
  const prevReplyCount = useRef(replies.length);
  useEffect(() => {
    if (replies.length > 0 && prevReplyCount.current === 0) {
      setExpanded(true);
    }
    prevReplyCount.current = replies.length;
  }, [replies.length]);

  function handleReplyClick() {
    setExpanded(true);
    // Focus the reply composer after expand renders
    setTimeout(() => {
      replyComposerRef.current?.focus();
    }, 50);
  }

  async function handlePostReply(
    body: string,
    isInternal: boolean,
    mentionIds: string[]
  ) {
    await onReply(note.id, body, isInternal, mentionIds);
  }

  const indentMargin = compact ? "ml-[36px]" : "ml-[44px]";

  return (
    <div>
      {/* Parent note */}
      <NoteCard
        note={note}
        currentUserId={currentUserId}
        showPinning={showPinning}
        compact={compact}
        onPin={onPin}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleLike={onToggleLike}
        onReply={handleReplyClick}
      />

      {/* Reply count toggle */}
      {replies.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 px-2 py-1.5 ${indentMargin} text-[11px] text-muted-foreground hover:text-foreground rq-transition cursor-pointer group`}
        >
          <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
          <span className="font-medium">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground/50">
            Last reply {relativeTime(replies[replies.length - 1].created_at)}
          </span>
          <ChevronDown
            className={`h-3 w-3 rq-transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {/* Expanded thread: replies + composer */}
      {expanded && (
        <div
          className={`${indentMargin} border-l-2 border-border/40 pl-4 mt-1 space-y-0`}
        >
          {replies.map((reply) => (
            <NoteCard
              key={reply.id}
              note={reply}
              currentUserId={currentUserId}
              showPinning={false}
              compact={true}
              onPin={onPin}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
            />
          ))}

          {/* Inline reply composer */}
          {currentUserId && (
            <ThreadReplyComposer
              currentUserName={currentUserName}
              showInternalToggle={showInternalToggle}
              defaultInternal={defaultInternal}
              onPost={handlePostReply}
              composerRef={replyComposerRef}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ThreadReplyComposer({
  currentUserName,
  showInternalToggle,
  defaultInternal,
  onPost,
  composerRef,
}: {
  currentUserName: string;
  showInternalToggle: boolean;
  defaultInternal: boolean;
  onPost: (
    body: string,
    isInternal: boolean,
    mentionIds: string[]
  ) => Promise<void>;
  composerRef?: React.RefObject<MentionInputHandle | null>;
}) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [posting, setPosting] = useState(false);
  const mentionRef = useRef<MentionInputHandle>(null);

  // Forward ref so parent NoteThread can focus this composer
  useEffect(() => {
    if (composerRef) {
      (
        composerRef as React.MutableRefObject<MentionInputHandle | null>
      ).current = mentionRef.current;
    }
  }, [composerRef]);

  async function handleSubmit(body: string, mentionIds: string[]) {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      await onPost(body, isInternal, mentionIds);
      setText("");
    } finally {
      setPosting(false);
    }
  }

  const initials = currentUserName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex gap-2 items-start mt-2 pb-2">
      <div className="h-6 w-6 rounded-full bg-foreground/[0.06] flex items-center justify-center flex-shrink-0">
        <span className="text-[9px] font-semibold text-foreground">
          {initials}
        </span>
      </div>
      <MentionInput
        ref={mentionRef}
        value={text}
        onChange={setText}
        onSubmit={handleSubmit}
        placeholder="Reply..."
        disabled={posting}
        submitIcon={
          posting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )
        }
        rows={1}
        enterToSend={true}
        compact={true}
        extraControls={
          showInternalToggle ? (
            <button
              type="button"
              onClick={() => setIsInternal(!isInternal)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer rq-transition ${
                isInternal
                  ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              {isInternal ? (
                <Lock className="h-3 w-3" strokeWidth={2} />
              ) : (
                <LockOpen className="h-3 w-3" strokeWidth={2} />
              )}
              {isInternal ? "Internal" : "Visible"}
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
