"use client";

import { useState } from "react";
import { Send, Lock, Loader2 } from "lucide-react";
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
                  className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    isInternal
                      ? "text-amber-600"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock className="h-3 w-3" strokeWidth={isInternal ? 2 : 1.5} />
                  Internal Only
                </button>
              ) : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
