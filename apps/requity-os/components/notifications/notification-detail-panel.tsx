"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ExternalLink,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Notification } from "@/lib/notifications";
import {
  getNotificationRoute,
  getEntityTypeLabel,
} from "@/lib/notifications";
import { parseComment, stripMentionMarkup } from "@/lib/comment-utils";
import { relativeTime } from "@/lib/comment-utils";
import { NoteComposer } from "@/components/shared/UnifiedNotes/NoteComposer";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";
import type { UploadedAttachment } from "@/components/shared/attachments";
import { showError } from "@/lib/toast";
import { TaskPreviewCard } from "./previews/task-preview-card";
import { ConditionPreviewCard } from "./previews/condition-preview-card";
import { ApprovalPreviewCard } from "./previews/approval-preview-card";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationDetailPanelProps {
  notification: Notification | null;
  activeRole: string;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
}

// Map notification entity_type to notes table column
function getNotesEntityColumn(
  entityType: string | null
): string | null {
  const map: Record<string, string> = {
    loan: "deal_id",
    contact: "contact_id",
    company: "company_id",
    task: "task_id",
    project: "project_id",
    condition: "unified_condition_id",
  };
  return entityType ? map[entityType] ?? null : null;
}

function isNoteRelated(slug: string): boolean {
  return (
    slug.includes("mention") ||
    slug.includes("reply") ||
    slug.includes("like") ||
    slug.includes("reaction")
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  { bg: "bg-[#2a1f3d]", text: "text-[#a78bfa]" },
  { bg: "bg-[#1a3d2a]", text: "text-[#4ade80]" },
  { bg: "bg-[#3d2a1f]", text: "text-[#fb923c]" },
  { bg: "bg-[#1f2a3d]", text: "text-[#60a5fa]" },
  { bg: "bg-[#3d1f2a]", text: "text-[#f472b6]" },
  { bg: "bg-[#3d1f1f]", text: "text-[#f87171]" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Render body with @mention highlighting
function RenderBody({ body }: { body: string }) {
  const segments = parseComment(body);
  return (
    <span>
      {segments.map((seg, i) =>
        seg.type === "mention" ? (
          <span
            key={i}
            className="text-blue-500 bg-blue-500/10 px-0.5 rounded font-medium"
          >
            @{seg.value}
          </span>
        ) : (
          <span key={i}>{seg.value}</span>
        )
      )}
    </span>
  );
}

export function NotificationDetailPanel({
  notification,
  activeRole,
  onClose,
  currentUserId,
  currentUserName,
}: NotificationDetailPanelProps) {
  const router = useRouter();
  const [threadNotes, setThreadNotes] = useState<NoteData[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const slug = notification?.notification_slug ?? "";
  const noteRelated = isNoteRelated(slug);

  // Fetch thread context for note-related notifications
  const fetchThread = useCallback(async () => {
    if (!notification || !noteRelated) return;

    const column = getNotesEntityColumn(notification.entity_type);
    if (!column || !notification.entity_id) return;

    setThreadLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notes" as never)
        .select(
          "*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never
        )
        .eq(column as never, notification.entity_id as never)
        .is("deleted_at" as never, null)
        .order("created_at" as never, { ascending: true })
        .limit(50);

      if (!error && data) {
        setThreadNotes(data as unknown as NoteData[]);
      }
    } catch {
      // Silently fail - show notification body as fallback
    } finally {
      setThreadLoading(false);
    }
  }, [notification, noteRelated]);

  useEffect(() => {
    if (notification) {
      setThreadNotes([]);
      fetchThread();
    }
  }, [notification?.id, fetchThread]);

  // Find the highlighted note (the one that triggered the notification)
  const highlightedNoteId = useMemo(() => {
    if (!notification?.body || threadNotes.length === 0) return null;
    const strippedBody = stripMentionMarkup(notification.body).trim();
    // Try to match by body content
    const match = threadNotes.find((n) => {
      const noteBody = stripMentionMarkup(n.body).trim();
      return noteBody === strippedBody || noteBody.includes(strippedBody);
    });
    return match?.id ?? null;
  }, [notification?.body, threadNotes]);

  // Post a reply
  const handlePostReply = useCallback(
    async (
      body: string,
      isInternal: boolean,
      mentionIds: string[],
      attachments?: UploadedAttachment[]
    ) => {
      if (!notification) return;

      const column = getNotesEntityColumn(notification.entity_type);
      if (!column || !notification.entity_id) return;

      const supabase = createClient();
      const notePayload: Record<string, unknown> = {
        author_id: currentUserId,
        author_name: currentUserName,
        body,
        is_internal: isInternal,
        mentions: mentionIds,
        [column]: notification.entity_id,
      };

      // If we found the highlighted note, make the reply a child of it
      if (highlightedNoteId) {
        notePayload.parent_note_id = highlightedNoteId;
      }

      const { data: newNote, error } = await supabase
        .from("notes" as never)
        .insert(notePayload as never)
        .select("*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never)
        .single();

      if (error) {
        showError("Could not post reply", error.message);
        return;
      }

      // Handle attachments
      if (attachments && attachments.length > 0 && newNote) {
        const noteId = (newNote as unknown as NoteData).id;
        for (const att of attachments) {
          await supabase.from("note_attachments" as never).insert({
            note_id: noteId,
            file_name: att.fileName,
            file_type: att.fileType,
            file_size_bytes: att.fileSizeBytes,
            storage_path: att.storagePath,
          } as never);
        }
      }

      // Append to thread
      if (newNote) {
        setThreadNotes((prev) => [...prev, newNote as unknown as NoteData]);
      }
    },
    [notification, currentUserId, currentUserName, highlightedNoteId]
  );

  function handleGoToEntity() {
    if (!notification) return;
    const route = getNotificationRoute(notification, activeRole);
    router.push(route);
    onClose();
  }

  // Empty state
  if (!notification) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-background/50">
        <Bell className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Select a notification
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click a notification on the left to see details and reply
        </p>
      </div>
    );
  }

  const entityLabel = notification.entity_label ?? getEntityTypeLabel(notification.entity_type);

  // Determine which preview to render for non-note notifications
  function renderContent() {
    if (slug.includes("task")) {
      return (
        <TaskPreviewCard
          notification={notification!}
          activeRole={activeRole}
          onNavigate={handleGoToEntity}
        />
      );
    }
    if (slug.includes("condition")) {
      return (
        <ConditionPreviewCard
          notification={notification!}
          activeRole={activeRole}
          onNavigate={handleGoToEntity}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      );
    }
    if (slug.includes("approval")) {
      return (
        <ApprovalPreviewCard
          notification={notification!}
          onNavigate={handleGoToEntity}
        />
      );
    }

    // Note-related: render thread
    if (noteRelated) {
      return renderThreadView();
    }

    // Generic fallback
    return renderGenericDetail();
  }

  function renderThreadView() {
    if (threadLoading) {
      return (
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (threadNotes.length === 0) {
      // Fallback: show notification body
      return (
        <div className="p-4">
          <div className="text-sm text-muted-foreground leading-relaxed">
            {notification!.body ? (
              <RenderBody body={notification!.body} />
            ) : (
              <span className="text-muted-foreground/60">{notification!.title}</span>
            )}
          </div>
        </div>
      );
    }

    // Filter to only parent-level notes (no parent_note_id) and their replies
    const topLevelNotes = threadNotes.filter((n) => !n.parent_note_id);
    const replies = threadNotes.filter((n) => n.parent_note_id);

    // If few top-level notes, show all. Otherwise show around the highlighted note.
    const notesToShow =
      threadNotes.length <= 20 ? threadNotes : threadNotes.slice(-20);

    return (
      <div className="p-3 space-y-0">
        <div className="text-[10px] text-muted-foreground/50 pb-2">
          {threadNotes.length} message{threadNotes.length !== 1 ? "s" : ""} in thread
        </div>
        {notesToShow.map((note) => {
          const isHighlighted = note.id === highlightedNoteId;
          const isReply = !!note.parent_note_id;
          const authorName = note.author_name ?? "Unknown";
          const initials = getInitials(authorName);
          const color = getAvatarColor(authorName);

          return (
            <div
              key={note.id}
              className={cn(
                "flex gap-2.5 py-2.5",
                isHighlighted &&
                  "bg-blue-500/[0.04] rounded-lg px-2.5 -mx-2.5 border-l-2 border-l-blue-500",
                !isHighlighted && "border-t border-foreground/[0.03] first:border-t-0",
                isReply && !isHighlighted && "pl-10"
              )}
            >
              <Avatar className="h-7 w-7 rounded-lg flex-shrink-0">
                <AvatarFallback
                  className={cn(
                    "rounded-lg text-[10px] font-semibold",
                    color.bg,
                    color.text
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[12px] font-semibold text-foreground">
                    {authorName}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">
                    {relativeTime(note.created_at)}
                  </span>
                  {note.is_internal && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-px rounded bg-amber-500/10 text-amber-500">
                      <Lock className="h-2 w-2" />
                      Internal
                    </span>
                  )}
                </div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">
                  <RenderBody body={note.body} />
                </div>

                {/* Attachments */}
                {note.note_attachments && note.note_attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {note.note_attachments.map((att) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500"
                      >
                        {att.file_name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Likes */}
                {note.note_likes && note.note_likes.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {note.note_likes.map((like, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/[0.04] border border-border text-muted-foreground"
                      >
                        <span>&#128077;</span> {like.profiles?.full_name ?? ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderGenericDetail() {
    return (
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          {notification!.title}
        </h3>
        {notification!.body && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stripMentionMarkup(notification!.body)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background/50">
      {/* Detail header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {notification.entity_type && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              {getEntityTypeLabel(notification.entity_type)}
            </span>
          )}
          {entityLabel && notification.entity_type && (
            <span className="text-muted-foreground/40">/</span>
          )}
          <span className="text-[13px] font-semibold text-foreground truncate">
            {entityLabel}
          </span>
        </div>
        <button
          onClick={handleGoToEntity}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] rq-transition flex-shrink-0"
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0">{renderContent()}</div>

      {/* Reply composer (only for note-related notifications) */}
      {noteRelated && notification.entity_id && (
        <div className="border-t border-border px-4 py-3 flex-shrink-0">
          <NoteComposer
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            showInternalToggle
            defaultInternal
            compact
            onPost={handlePostReply}
            enterToSend
          />
        </div>
      )}
    </div>
  );
}
