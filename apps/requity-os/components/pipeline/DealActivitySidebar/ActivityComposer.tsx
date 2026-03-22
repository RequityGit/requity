"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { showError } from "@/lib/toast";
import { NoteComposer } from "@/components/shared/UnifiedNotes/NoteComposer";
import type { UploadedAttachment } from "@/components/shared/attachments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActivityComposerProps {
  dealId: string;
  currentUserId: string;
  currentUserName: string;
  conditions: { id: string; condition_name: string }[];
  onNotePosted: () => void;
}

export function ActivityComposer({
  dealId,
  currentUserId,
  currentUserName,
  conditions,
  onNotePosted,
}: ActivityComposerProps) {
  const [postingContext, setPostingContext] = useState("deal");

  const handlePost = useCallback(
    async (
      body: string,
      isInternal: boolean,
      mentionIds: string[],
      attachments?: UploadedAttachment[]
    ) => {
      const supabase = createClient();

      const notePayload: Record<string, unknown> = {
        body,
        author_id: currentUserId,
        author_name: currentUserName,
        is_internal: isInternal,
        mentions: mentionIds,
        deal_id: dealId,
      };

      // If posting to a specific condition
      if (postingContext !== "deal") {
        notePayload.unified_condition_id = postingContext;
      }

      const { data: note, error } = await supabase
        .from("notes" as never)
        .insert(notePayload as never)
        .select("id" as never)
        .single();

      if (error) {
        showError("Could not post note", error.message);
        return;
      }

      const noteId = (note as { id: string }).id;

      // Insert attachments if any
      if (attachments && attachments.length > 0) {
        const attachmentRows = attachments.map((a) => ({
          note_id: noteId,
          file_name: a.fileName,
          file_type: a.fileType,
          file_size_bytes: a.fileSizeBytes,
          storage_path: a.storagePath,
          uploaded_by: currentUserId,
        }));

        await supabase
          .from("note_attachments" as never)
          .insert(attachmentRows as never);
      }

      // Insert mentions
      if (mentionIds.length > 0) {
        const mentionRows = mentionIds.map((uid) => ({
          note_id: noteId,
          mentioned_user_id: uid,
        }));
        await supabase
          .from("note_mentions" as never)
          .insert(mentionRows as never);
      }

      onNotePosted();
    },
    [dealId, currentUserId, currentUserName, postingContext, onNotePosted]
  );

  return (
    <div className="border-t flex-shrink-0">
      {/* Context selector */}
      {conditions.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 pt-2 pb-0">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            Posting to:
          </span>
          <Select value={postingContext} onValueChange={setPostingContext}>
            <SelectTrigger className="h-auto border-none bg-transparent p-0 text-[10px] font-semibold text-teal-600 dark:text-teal-400 shadow-none focus:ring-0 w-auto gap-1 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deal">Deal (general)</SelectItem>
              {conditions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.condition_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Composer */}
      <div className="px-3 py-2">
        <NoteComposer
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          showInternalToggle={true}
          defaultInternal={true}
          compact={true}
          enterToSend={true}
          onPost={handlePost}
        />
      </div>
    </div>
  );
}
