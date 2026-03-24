"use client";

import { useState, useRef } from "react";
import { Send, Lock, LockOpen, Loader2, Paperclip, AtSign, Smile } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MentionInput, MentionInputHandle } from "@/components/shared/mention-input";
import {
  useAttachmentUpload,
  AttachmentPreview,
  type UploadedAttachment,
} from "@/components/shared/attachments";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { showError } from "@/lib/toast";

interface NoteComposerProps {
  currentUserName: string;
  currentUserId: string;
  showInternalToggle: boolean;
  defaultInternal: boolean;
  compact: boolean;
  onPost: (
    body: string,
    isInternal: boolean,
    mentionIds: string[],
    attachments?: UploadedAttachment[]
  ) => Promise<void>;
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
  currentUserId,
  showInternalToggle,
  defaultInternal,
  compact,
  onPost,
  enterToSend = false,
}: NoteComposerProps) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(defaultInternal);
  const [posting, setPosting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const mentionInputRef = useRef<MentionInputHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { stagedFiles, uploading, addFiles, removeStaged, uploadAll, clearStaged } =
    useAttachmentUpload({
      pathPrefix: `notes/staged/${currentUserId}`,
      onError: (msg) => showError("Could not upload file", msg),
    });

  const initials = getInitials(currentUserName || "?");
  const avatarSize = compact ? "h-6 w-6" : "h-8 w-8";
  const avatarText = compact ? "text-[9px]" : "text-[10px]";

  async function handleSubmit(body: string, mentionIds: string[]) {
    if ((!body.trim() && stagedFiles.length === 0) || posting) return;
    setPosting(true);
    try {
      let uploaded: UploadedAttachment[] = [];
      if (stagedFiles.length > 0) {
        uploaded = await uploadAll();
      }
      await onPost(body, isInternal, mentionIds, uploaded.length > 0 ? uploaded : undefined);
      setText("");
      clearStaged();
    } finally {
      setPosting(false);
    }
  }

  const iconBtnClass =
    "inline-flex items-center justify-center rounded-md h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition cursor-pointer";

  const stagedContent =
    stagedFiles.length > 0 ? (
      <div className="px-3 pb-1 flex flex-wrap gap-1.5">
        {stagedFiles.map((sf) => (
          <AttachmentPreview
            key={sf.id}
            fileName={sf.file.name}
            fileType={sf.file.type}
            fileSize={sf.file.size}
            storagePath=""
            previewUrl={sf.preview}
            onRemove={() => removeStaged(sf.id)}
            compact
          />
        ))}
      </div>
    ) : null;

  return (
    <div
      className="comment-composer"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) {
          addFiles(e.dataTransfer.files);
        }
      }}
    >
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
        onFilePaste={(files) => addFiles(files)}
        placeholder="Write a note... use @mention to tag team members"
        disabled={posting || uploading}
        canSubmitEmpty={stagedFiles.length > 0}
        submitIcon={
          posting || uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )
        }
        rows={compact ? 2 : 3}
        enterToSend={enterToSend}
        compact={compact}
        middleContent={
          <>
            {dragOver && (
              <div className="mx-3 mb-1 flex items-center justify-center py-3 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 text-xs text-primary/70">
                Drop files to attach
              </div>
            )}
            {stagedContent}
          </>
        }
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
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <EmojiPicker
              onSelect={(emoji) => mentionInputRef.current?.insertText(emoji)}
            >
              <button
                type="button"
                className={iconBtnClass}
                title="Add emoji"
              >
                <Smile className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </EmojiPicker>
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
