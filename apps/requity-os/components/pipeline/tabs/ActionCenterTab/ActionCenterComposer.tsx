"use client";

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
  return (
    <div className="border-t bg-muted/20 px-4 py-3">
      <NoteComposer
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        showInternalToggle={true}
        defaultInternal={true}
        compact={false}
        enterToSend={true}
        onPost={onPost}
      />
    </div>
  );
}
