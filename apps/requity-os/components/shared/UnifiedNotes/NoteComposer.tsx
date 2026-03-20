"use client";

import { useState } from "react";
import { Send, Lock, LockOpen, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MentionInput } from "@/components/shared/mention-input";

interface NoteComposerProps {
  currentUserName: string;
  showInternalToggle: boolean;
  defaultInternal: boolean;
  compact: boolean;
  onPost: (body: string, isInternal: boolean, mentionIds: string[]) => Promise<void>;
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
}: NoteComposerProps) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [posting, setPosting] = useState(false);

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

  return (
    <div className={`rounded-xl border border-border bg-card ${compact ? "p-3" : "p-4"}`}>
      <div className="flex gap-2.5">
        <Avatar className={`${avatarSize} rounded-lg flex-shrink-0`}>
          <AvatarFallback
            className={`rounded-lg bg-foreground/[0.06] text-foreground ${avatarText} font-semibold`}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <MentionInput
            value={text}
            onChange={setText}
            onSubmit={handleSubmit}
            placeholder="Write a note... use @mention to tag team members"
            disabled={posting}
            submitLabel={posting ? "Posting..." : "Post Note"}
            submitIcon={
              posting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )
            }
            rows={compact ? 2 : 3}
            extraControls={
              showInternalToggle ? (
                <button
                  type="button"
                  onClick={() => setIsInternal(!isInternal)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium cursor-pointer transition-colors ${
                    isInternal
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  }`}
                >
                  {isInternal ? (
                    <Lock className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <LockOpen className="h-3 w-3" strokeWidth={2} />
                  )}
                  {isInternal ? "Internal Only" : "Visible to Borrower"}
                </button>
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
