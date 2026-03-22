"use client";

import { useState, useRef, useCallback } from "react";
import { NoteComposer } from "@/components/shared/UnifiedNotes/NoteComposer";
import type { UploadedAttachment } from "@/components/shared/attachments";

interface ActionCenterComposerProps {
  currentUserId: string;
  currentUserName: string;
  onPost: (
    body: string,
    isInternal: boolean,
    mentionIds: string[],
    attachments?: UploadedAttachment[]
  ) => Promise<void>;
}

export function ActionCenterComposer({
  currentUserId,
  currentUserName,
  onPost,
}: ActionCenterComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (!expanded) {
    return (
      <div className="border-t px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-2 rounded-lg border border-border bg-transparent px-3 py-1.5 text-[13px] text-muted-foreground hover:border-border hover:bg-muted/30 rq-transition cursor-text text-left"
        >
          Write a note... use @mention to tag team members
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="border-t bg-muted/20 px-3 py-2">
      <NoteComposer
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        showInternalToggle={true}
        defaultInternal={true}
        compact={false}
        enterToSend={true}
        onPost={handlePost}
      />
    </div>
  );
}
