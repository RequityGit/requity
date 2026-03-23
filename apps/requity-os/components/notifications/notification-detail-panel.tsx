"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/notifications";
import {
  getNotificationRoute,
  getEntityTypeLabel,
} from "@/lib/notifications";
import { parseComment, stripMentionMarkup } from "@/lib/comment-utils";
import { NoteComposer } from "@/components/shared/UnifiedNotes/NoteComposer";
import { NoteThread } from "@/components/shared/UnifiedNotes/NoteThread";
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
    loan: "loan_id",
    deal: "deal_id",
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
    slug.includes("comment") ||
    slug.includes("reply") ||
    slug.includes("like") ||
    slug.includes("reaction")
  );
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
        let notes = data as unknown as NoteData[];
        // Batch-fetch accent colors for note authors and likers
        const userIds = new Set<string>();
        for (const n of notes) {
          if (n.author_id) userIds.add(n.author_id);
          for (const l of n.note_likes ?? []) {
            if (l.user_id) userIds.add(l.user_id);
          }
        }
        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, accent_color")
            .in("id", Array.from(userIds));
          if (profiles) {
            const colorMap = new Map<string, string | null>();
            for (const p of profiles as { id: string; accent_color: string | null }[]) {
              colorMap.set(p.id, p.accent_color);
            }
            notes = notes.map((n) => ({
              ...n,
              author_accent_color: colorMap.get(n.author_id) ?? null,
              note_likes: (n.note_likes ?? []).map((l) => ({
                ...l,
                profiles: { ...l.profiles, accent_color: colorMap.get(l.user_id) ?? null },
              })),
            }));
          }
        }
        setThreadNotes(notes);
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

  // Like/unlike a note
  const handleToggleLike = useCallback(
    async (noteId: string, isCurrentlyLiked: boolean) => {
      const supabase = createClient();

      // Optimistic update
      setThreadNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          if (isCurrentlyLiked) {
            return {
              ...n,
              note_likes: n.note_likes.filter((l) => l.user_id !== currentUserId),
            };
          }
          return {
            ...n,
            note_likes: [
              ...n.note_likes,
              { user_id: currentUserId, profiles: { full_name: currentUserName } },
            ],
          };
        })
      );

      if (isCurrentlyLiked) {
        await supabase
          .from("note_likes" as never)
          .delete()
          .eq("note_id" as never, noteId as never)
          .eq("user_id" as never, currentUserId as never);
      } else {
        await supabase.from("note_likes" as never).insert({
          note_id: noteId,
          user_id: currentUserId,
        } as never);
      }
    },
    [currentUserId, currentUserName]
  );

  // Edit a note
  const handleEdit = useCallback(
    async (noteId: string, body: string, mentionIds: string[]) => {
      const supabase = createClient();

      // Optimistic update
      setThreadNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, body, mentions: mentionIds, is_edited: true, edited_at: new Date().toISOString() }
            : n
        )
      );

      const { error } = await supabase
        .from("notes" as never)
        .update({ body, mentions: mentionIds, is_edited: true, edited_at: new Date().toISOString() } as never)
        .eq("id" as never, noteId as never);

      if (error) {
        showError("Could not edit note", error.message);
        fetchThread();
      }
    },
    [fetchThread]
  );

  // Soft delete a note
  const handleDelete = useCallback(
    async (noteId: string) => {
      const supabase = createClient();

      // Optimistic: remove from local state
      setThreadNotes((prev) => prev.filter((n) => n.id !== noteId));

      const { error } = await supabase
        .from("notes" as never)
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id" as never, noteId as never);

      if (error) {
        showError("Could not delete note", error.message);
        fetchThread();
      }
    },
    [fetchThread]
  );

  // Pin stub (not relevant in notification context)
  const handlePin = useCallback((_noteId: string, _isPinned: boolean) => {
    // Pinning not supported in notification detail panel
  }, []);

  // Reply to a specific note in the thread
  const handleReply = useCallback(
    async (
      parentNoteId: string,
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
        parent_note_id: parentNoteId,
        [column]: notification.entity_id,
      };

      const { data: newNote, error } = await supabase
        .from("notes" as never)
        .insert(notePayload as never)
        .select("*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never)
        .single();

      if (error) {
        showError("Could not post reply", error.message);
        return;
      }

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

      if (newNote) {
        setThreadNotes((prev) => [...prev, newNote as unknown as NoteData]);
      }
    },
    [notification, currentUserId, currentUserName]
  );

  // Post a top-level note from the bottom composer
  const handlePostTopLevel = useCallback(
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

      // If there's a highlighted note, make the reply a child of it
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

      if (newNote) {
        setThreadNotes((prev) => [...prev, newNote as unknown as NoteData]);
      }
    },
    [notification, currentUserId, currentUserName, highlightedNoteId]
  );

  // Group notes into top-level + replies for NoteThread rendering
  const { topLevelNotes, replyMap } = useMemo(() => {
    const top = threadNotes.filter((n) => !n.parent_note_id);
    const rMap = new Map<string, NoteData[]>();

    for (const note of threadNotes) {
      if (note.parent_note_id) {
        const existing = rMap.get(note.parent_note_id) || [];
        existing.push(note);
        rMap.set(note.parent_note_id, existing);
      }
    }

    // Sort replies oldest-first (chronological within thread)
    rMap.forEach((reps) => {
      reps.sort(
        (a: NoteData, b: NoteData) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return { topLevelNotes: top, replyMap: rMap };
  }, [threadNotes]);

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
    // For non-note entity notifications, show only the preview card
    if (slug.includes("task") && !noteRelated) {
      return (
        <TaskPreviewCard
          notification={notification!}
          activeRole={activeRole}
          onNavigate={handleGoToEntity}
        />
      );
    }
    if (slug.includes("condition") && !noteRelated) {
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
    if (slug.includes("approval") && !noteRelated) {
      return (
        <ApprovalPreviewCard
          notification={notification!}
          onNavigate={handleGoToEntity}
        />
      );
    }

    // Note-related: show optional preview card at top + thread below
    if (noteRelated) {
      return (
        <>
          {slug.includes("task") && (
            <TaskPreviewCard
              notification={notification!}
              activeRole={activeRole}
              onNavigate={handleGoToEntity}
            />
          )}
          {slug.includes("condition") && (
            <ConditionPreviewCard
              notification={notification!}
              activeRole={activeRole}
              onNavigate={handleGoToEntity}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          )}
          {slug.includes("approval") && (
            <ApprovalPreviewCard
              notification={notification!}
              onNavigate={handleGoToEntity}
            />
          )}
          {renderThreadView()}
        </>
      );
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

    return (
      <div className="p-3 space-y-0">
        <div className="text-[10px] text-muted-foreground/50 pb-2">
          {threadNotes.length} message{threadNotes.length !== 1 ? "s" : ""} in thread
        </div>
        {topLevelNotes.map((note) => {
          const isHighlighted = note.id === highlightedNoteId;
          const replies = replyMap.get(note.id) || [];

          return (
            <div
              key={note.id}
              className={cn(
                isHighlighted &&
                  "bg-blue-500/[0.04] rounded-lg px-1 -mx-1 border-l-2 border-l-blue-500"
              )}
            >
              <NoteThread
                note={note}
                replies={replies}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                showPinning={false}
                showInternalToggle
                defaultInternal
                compact
                onPin={handlePin}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleLike={handleToggleLike}
                onReply={handleReply}
              />
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
            onPost={handlePostTopLevel}
            enterToSend
          />
        </div>
      )}
    </div>
  );
}
