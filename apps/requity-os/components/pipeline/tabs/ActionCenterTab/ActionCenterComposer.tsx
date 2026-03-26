"use client";

import { useState, useRef, useCallback } from "react";
import { useAutoExpand } from "@/hooks/useAutoExpand";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2 } from "lucide-react";
import { NoteComposer } from "@/components/shared/UnifiedNotes/NoteComposer";
import type { UploadedAttachment } from "@/components/shared/attachments";

type ComposerMode = "note" | "message";

interface ActionCenterComposerProps {
  currentUserId: string;
  currentUserName: string;
  onPost: (
    body: string,
    isInternal: boolean,
    mentionIds: string[],
    attachments?: UploadedAttachment[]
  ) => Promise<void>;
  onSendMessage?: (body: string) => Promise<void>;
  /** Whether to show the Note/Message mode toggle. Defaults to true. */
  showMessageMode?: boolean;
}

export function ActionCenterComposer({
  currentUserId,
  currentUserName,
  onPost,
  onSendMessage,
  showMessageMode = true,
}: ActionCenterComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<ComposerMode>("note");
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutoExpand(textareaRef, messageBody);

  const handlePost = useCallback(
    async (
      body: string,
      isInternal: boolean,
      mentionIds: string[],
      attachments?: UploadedAttachment[]
    ) => {
      await onPost(body, isInternal, mentionIds, attachments);
      setExpanded(false);
    },
    [onPost]
  );

  const handleSendMessage = useCallback(async () => {
    const trimmed = messageBody.trim();
    if (!trimmed || sending || !onSendMessage) return;

    setSending(true);
    try {
      await onSendMessage(trimmed);
      setMessageBody("");
      setExpanded(false);
    } finally {
      setSending(false);
    }
  }, [messageBody, sending, onSendMessage]);

  const handleMessageKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  if (!expanded) {
    return (
      <div className="border-t-2 border-border/60 px-3 py-3 bg-muted/10">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-muted-foreground hover:border-border hover:bg-muted/30 rq-transition cursor-text text-left"
        >
          {mode === "note"
            ? "Write a note... use @mention to tag team members"
            : "Send a message to the borrower..."}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="border-t-2 border-border/60 bg-muted/20 px-3 py-3">
      {/* Mode toggle */}
      {showMessageMode && (
        <div className="flex items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => setMode("note")}
            className={cn(
              "rounded-md border px-2.5 py-0.5 text-[11px] font-medium rq-transition cursor-pointer",
              mode === "note"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
            )}
          >
            Note
          </button>
          <button
            type="button"
            onClick={() => setMode("message")}
            className={cn(
              "rounded-md border px-2.5 py-0.5 text-[11px] font-medium rq-transition cursor-pointer",
              mode === "message"
                ? "bg-orange-600 text-white border-orange-600"
                : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
            )}
          >
            Message
          </button>
        </div>
      )}

      {mode === "note" ? (
        <NoteComposer
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          showInternalToggle={true}
          defaultInternal={true}
          compact={false}
          enterToSend={true}
          onPost={handlePost}
        />
      ) : (
        <div className="space-y-2">
          {/* Warning banner */}
          <div className="flex items-center gap-2 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 px-2.5 py-1.5 text-[11px] text-orange-800 dark:text-orange-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>This message will be visible to the borrower</span>
          </div>

          {/* Simple text input */}
          <textarea
            ref={textareaRef}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={handleMessageKeyDown}
            placeholder="Type a message..."
            rows={2}
            className="w-full resize-none overflow-hidden rounded-lg border border-border bg-background px-3 py-2 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/60"
            disabled={sending}
            autoFocus
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setExpanded(false); setMessageBody(""); }}
              className="text-[11px] text-muted-foreground hover:text-foreground rq-transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!messageBody.trim() || sending}
              className={cn(
                "rounded-md px-3 py-1 text-[12px] font-medium rq-transition cursor-pointer",
                "bg-orange-600 text-white hover:bg-orange-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Send Message"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
