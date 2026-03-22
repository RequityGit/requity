"use client";

import { useState, useRef } from "react";
import { Send, Lock, LockOpen, Loader2, Paperclip, AtSign } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MentionInput, MentionInputHandle } from "@/components/shared/mention-input";

interface NoteComposerProps {
  currentUserName: string;
  showInternalToggle: boolean;
  defaultInternal: boolean;
  compact: boolean;
  onPost: (body: string, isInternal: boolean, mentionIds: string[]) => Promise<void>;
  /** When true, Enter sends and Shift+Enter inserts newline (chat-style) */
  enterToSend?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function NoteComposer({
  currentUserName,
  showInternalToggle,
  defaultInternal,
  compact,
  onPost,
  enterToSend = false,
}: NoteComposerProps) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [posting, setPosting] = useState(false);
  const mentionInputRef = useRef<MentionInputHandle>(null);

  const initials = getInitials(currentUserName || "?");
  const avatarSize = compact ? "h-6 w-6" : "h-8 w-8";
  const avatarText = compact ? "text-[9px]" : "text-[10px]";

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

  const iconBtnClass =
    "inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition cursor-pointer";

  return (
    <div className="comment-composer">
      <Avatar className={`${avatarSize} rounded-lg flex-shrink-0`}>
        <AvatarFallback
          className={`rounded-lg bg-foreground/[0.06] text-foreground ${avatarText} font-semibold`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <MentionInput
        ref={mentionInputRef}
        value={text}
        onChange={setText}
        onSubmit={handleSubmit}
        placeholder="Write a note... use @mention to tag team members"
        disabled={posting}
        submitIcon={
          posting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )
        }
        rows={compact ? 2 : 3}
        enterToSend={enterToSend}
        compact={compact}
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
        toolbarButtons={
          <>
            <button
              type="button"
              className={iconBtnClass}
              title="Attach file"
              disabled
            >
              <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={iconBtnClass}
              title="Mention someone"
              onClick={() => mentionInputRef.current?.insertAt()}
            >
              <AtSign className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </>
        }
      />
    </div>
  );
}
