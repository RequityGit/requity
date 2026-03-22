"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDateShort } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { showSuccess, showError } from "@/lib/toast";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import type { UploadedAttachment } from "@/components/shared/attachments";
import { NoteComposer } from "./NoteComposer";
import { NoteThread } from "./NoteThread";
import { NoteFilters } from "./NoteFilters";
import {
  getEntityColumn,
  type UnifiedNotesProps,
  type NoteData,
  type NoteFilter,
} from "./types";

export function UnifiedNotes({
  entityType,
  entityId,
  dealId,
  loanId,
  opportunityId,
  showInternalToggle,
  showFilters,
  showPinning = true,
  compact = false,
  chatMode = false,
}: UnifiedNotesProps) {
  // Defaults based on entity type
  const isConditionType = entityType === "condition" || entityType === "unified_condition";
  const shouldShowInternalToggle =
    showInternalToggle ?? (entityType === "deal" || isConditionType);
  const shouldShowFilters =
    showFilters ?? (entityType === "deal" || isConditionType);
  const isCompact = isConditionType ? true : compact;
  const defaultInternal =
    entityType === "deal" || isConditionType;

  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // Get current user on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            setCurrentUserName(data?.full_name ?? "Unknown");
          });
      }
    });
  }, []);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("notes" as never)
      .select("*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never)
      .is("deleted_at" as never, null);

    if (entityType === "deal") {
      const conditions: string[] = [];
      if (dealId) conditions.push(`deal_id.eq.${dealId}`);
      if (loanId) conditions.push(`loan_id.eq.${loanId}`);
      if (opportunityId) conditions.push(`opportunity_id.eq.${opportunityId}`);
      if (conditions.length > 0) {
        query = query.or(conditions.join(","));
      }
      // Exclude old condition-scoped notes but include unified_condition notes
      query = query.is("condition_id" as never, null);
    } else if (entityType === "condition") {
      query = query.eq("condition_id" as never, entityId as never);
    } else if (entityType === "unified_condition") {
      query = query.eq("unified_condition_id" as never, entityId as never);
    } else {
      const col = getEntityColumn(entityType);
      query = query.eq(col as never, entityId as never);
    }

    // Pinned first for deals, then by created_at desc
    if (entityType === "deal") {
      query = query.order("is_pinned" as never, { ascending: false }).order("created_at" as never, { ascending: false });
    } else {
      query = query.order("created_at" as never, { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      let fetchedNotes = (data as unknown as NoteData[]) ?? [];

      // For deal-level view, enrich notes that have unified_condition_id with condition names
      if (entityType === "deal" && fetchedNotes.length > 0) {
        const conditionNoteIds = fetchedNotes
          .filter((n) => n.unified_condition_id)
          .map((n) => n.unified_condition_id as string);

        if (conditionNoteIds.length > 0) {
          const uniqueIds = Array.from(new Set(conditionNoteIds));
          const { data: condData } = await supabase
            .from("unified_deal_conditions" as never)
            .select("id, condition_name" as never)
            .in("id" as never, uniqueIds as never);

          if (condData) {
            const condMap = new Map<string, string>();
            for (const c of condData as { id: string; condition_name: string }[]) {
              condMap.set(c.id, c.condition_name);
            }
            fetchedNotes = fetchedNotes.map((n) => {
              const ucId = n.unified_condition_id;
              if (ucId && condMap.has(ucId)) {
                return { ...n, condition_name: condMap.get(ucId) };
              }
              return n;
            });
          }
        }
      }

      setNotes(fetchedNotes);
    }
    setLoading(false);
  }, [entityType, entityId, dealId, loanId, opportunityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Realtime subscription
  useEffect(() => {
    const col =
      entityType === "deal"
        ? dealId
          ? "deal_id"
          : loanId
            ? "loan_id"
            : "opportunity_id"
        : getEntityColumn(entityType);
    const id =
      entityType === "deal"
        ? dealId || loanId || opportunityId
        : entityId;

    if (!id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notes-${entityType}-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `${col}=eq.${id}`,
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId, dealId, loanId, opportunityId, fetchNotes]);

  // Post a new note
  async function handlePost(
    body: string,
    isInternal: boolean,
    mentionIds: string[],
    attachments?: UploadedAttachment[]
  ) {
    const supabase = createClient();

    const row: Record<string, unknown> = {
      body,
      author_id: currentUserId,
      author_name: currentUserName,
      mentions: mentionIds,
      is_internal: isInternal,
    };

    switch (entityType) {
      case "contact":
        row.contact_id = entityId;
        break;
      case "company":
        row.company_id = entityId;
        break;
      case "deal":
        if (dealId) row.deal_id = dealId;
        if (loanId) row.loan_id = loanId;
        if (opportunityId) row.opportunity_id = opportunityId;
        break;
      case "condition":
        row.condition_id = entityId;
        if (loanId) row.loan_id = loanId;
        break;
      case "unified_condition":
        row.unified_condition_id = entityId;
        if (dealId) row.deal_id = dealId;
        if (loanId) row.loan_id = loanId;
        break;
      case "task":
        row.task_id = entityId;
        break;
      case "project":
        row.project_id = entityId;
        break;
      case "approval":
        row.approval_id = entityId;
        break;
    }

    const { data, error } = await supabase
      .from("notes" as never)
      .insert(row as never)
      .select()
      .single();

    if (error) {
      showError("Could not post note", error.message);
      return;
    }

    // Optimistic: prepend new note with empty likes and attachments
    if (data) {
      const noteId = (data as unknown as NoteData).id;
      const noteAttachments: NoteData["note_attachments"] = [];

      // Insert attachments if any
      if (attachments && attachments.length > 0) {
        const { data: insertedAttachments } = await supabase
          .from("note_attachments" as never)
          .insert(
            attachments.map((a) => ({
              note_id: noteId,
              file_name: a.fileName,
              file_type: a.fileType,
              file_size_bytes: a.fileSizeBytes,
              storage_path: a.storagePath,
              uploaded_by: currentUserId,
            })) as never
          )
          .select() as { data: NoteData["note_attachments"] | null };

        if (insertedAttachments) {
          noteAttachments.push(...insertedAttachments);
        }
      }

      const newNote = {
        ...(data as unknown as NoteData),
        note_likes: [],
        note_attachments: noteAttachments,
      };
      setNotes((prev) => [newNote, ...prev]);

      // Insert note_mentions
      if (mentionIds.length > 0) {
        await supabase.from("note_mentions" as never).insert(
          mentionIds.map((userId) => ({
            note_id: noteId,
            mentioned_user_id: userId,
          })) as never
        );
      }
    }

    showSuccess(isInternal ? "Internal note posted" : "Note posted");
  }

  // Pin/unpin. For deals, only one note can be pinned; unpin any existing pinned note first.
  async function handlePin(noteId: string, isPinned: boolean) {
    const supabase = createClient();

    if (entityType === "deal" && !isPinned && dealId) {
      await supabase
        .from("notes" as never)
        .update({ is_pinned: false, pinned_by: null, pinned_at: null } as never)
        .eq("deal_id" as never, dealId as never)
        .eq("is_pinned" as never, true as never);
    }

    const update = isPinned
      ? { is_pinned: false, pinned_by: null, pinned_at: null }
      : {
          is_pinned: true,
          pinned_by: currentUserId,
          pinned_at: new Date().toISOString(),
        };

    const { error } = await supabase
      .from("notes" as never)
      .update(update as never)
      .eq("id" as never, noteId as never);

    if (error) {
      showError("Could not update pin", error.message);
      return;
    }

    setNotes((prev) => {
      const next = prev.map((n) => (n.id === noteId ? { ...n, ...update } as NoteData : n));
      if (entityType === "deal" && !isPinned && dealId) {
        return next.map((n) => (n.deal_id === dealId && n.id !== noteId ? { ...n, is_pinned: false, pinned_by: null, pinned_at: null } : n)) as NoteData[];
      }
      return next;
    });
    showSuccess(isPinned ? "Note unpinned" : "Note pinned");
  }

  // Edit
  async function handleEdit(
    noteId: string,
    body: string,
    mentionIds: string[]
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("notes" as never)
      .update({
        body,
        mentions: mentionIds,
        is_edited: true,
        edited_at: new Date().toISOString(),
      } as never)
      .eq("id" as never, noteId as never);

    if (error) {
      showError("Could not update note", error.message);
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              body,
              mentions: mentionIds,
              is_edited: true,
              edited_at: new Date().toISOString(),
            }
          : n
      )
    );
    showSuccess("Note updated");
  }

  // Soft delete
  async function handleDelete(noteId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("notes" as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id" as never, noteId as never);

    if (error) {
      showError("Could not delete note", error.message);
      return;
    }

    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    showSuccess("Note deleted");
  }

  // Like/unlike
  async function handleToggleLike(noteId: string, isCurrentlyLiked: boolean) {
    if (!currentUserId) return;
    const supabase = createClient();

    if (isCurrentlyLiked) {
      // Optimistic: remove like
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, note_likes: n.note_likes.filter((l) => l.user_id !== currentUserId) }
            : n
        )
      );
      const { error } = await supabase
        .from("note_likes" as never)
        .delete()
        .eq("note_id" as never, noteId as never)
        .eq("user_id" as never, currentUserId as never);

      if (error) {
        console.error("Failed to unlike note:", error);
        fetchNotes();
      }
    } else {
      // Optimistic: add like
      const newLike = { user_id: currentUserId, profiles: { full_name: currentUserName } };
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, note_likes: [...n.note_likes, newLike] }
            : n
        )
      );
      const { error } = await supabase
        .from("note_likes" as never)
        .insert({ note_id: noteId, user_id: currentUserId } as never);

      if (error) {
        console.error("Failed to like note:", error);
        fetchNotes();
      }
    }
  }

  // Post a reply to an existing note
  async function handleReply(
    parentNoteId: string,
    body: string,
    isInternal: boolean,
    mentionIds: string[]
  ) {
    const supabase = createClient();

    const row: Record<string, unknown> = {
      body,
      author_id: currentUserId,
      author_name: currentUserName,
      mentions: mentionIds,
      is_internal: isInternal,
      parent_note_id: parentNoteId,
    };

    switch (entityType) {
      case "contact":
        row.contact_id = entityId;
        break;
      case "company":
        row.company_id = entityId;
        break;
      case "deal":
        if (dealId) row.deal_id = dealId;
        if (loanId) row.loan_id = loanId;
        if (opportunityId) row.opportunity_id = opportunityId;
        break;
      case "condition":
        row.condition_id = entityId;
        if (loanId) row.loan_id = loanId;
        break;
      case "unified_condition":
        row.unified_condition_id = entityId;
        if (dealId) row.deal_id = dealId;
        if (loanId) row.loan_id = loanId;
        break;
      case "task":
        row.task_id = entityId;
        break;
      case "project":
        row.project_id = entityId;
        break;
      case "approval":
        row.approval_id = entityId;
        break;
    }

    const { data, error } = await supabase
      .from("notes" as never)
      .insert(row as never)
      .select()
      .single();

    if (error) {
      showError("Could not post reply", error.message);
      return;
    }

    if (data) {
      const newNote = {
        ...(data as unknown as NoteData),
        note_likes: [],
        note_attachments: [],
      };
      setNotes((prev) => [...prev, newNote]);

      // Insert note_mentions
      const noteId = newNote.id;
      if (mentionIds.length > 0) {
        await supabase.from("note_mentions" as never).insert(
          mentionIds.map((userId) => ({
            note_id: noteId,
            mentioned_user_id: userId,
          })) as never
        );
      }
    }

    showSuccess("Reply posted");
  }

  // Filter notes client-side
  const filteredNotes =
    filter === "internal"
      ? notes.filter((n) => n.is_internal)
      : filter === "external"
        ? notes.filter((n) => !n.is_internal)
        : notes;

  // Group notes into top-level and replies
  const { topLevelNotes, replyMap } = useMemo(() => {
    const topLevel = filteredNotes.filter((n) => !n.parent_note_id);
    const replies = new Map<string, NoteData[]>();

    for (const note of filteredNotes) {
      if (note.parent_note_id) {
        // Only include reply if its parent exists in the filtered set
        const parentExists = filteredNotes.some(
          (n) => n.id === note.parent_note_id && !n.parent_note_id
        );
        if (!parentExists) continue;

        const existing = replies.get(note.parent_note_id) || [];
        existing.push(note);
        replies.set(note.parent_note_id, existing);
      }
    }

    // Sort replies oldest-first (chronological)
    replies.forEach((replyList) => {
      replyList.sort(
        (a: NoteData, b: NoteData) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return { topLevelNotes: topLevel, replyMap: replies };
  }, [filteredNotes]);

  // In chatMode, reverse to show oldest first (newest at bottom)
  const displayNotes = chatMode ? [...topLevelNotes].reverse() : topLevelNotes;

  const maxHeight = isCompact && !chatMode ? "max-h-[300px]" : "";

  // Date divider helper
  function getDateLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const noteDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today.getTime() - noteDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return formatDateShort(dateStr);
  }

  const composerElement = currentUserId ? (
    <NoteComposer
      currentUserName={currentUserName}
      currentUserId={currentUserId}
      showInternalToggle={shouldShowInternalToggle}
      defaultInternal={defaultInternal}
      compact={isCompact}
      onPost={handlePost}
      enterToSend={chatMode}
    />
  ) : null;

  const notesListElement = loading ? (
    <div className="space-y-2">
      <div className="h-14 rounded-xl bg-muted animate-pulse" />
      <div className="h-14 rounded-xl bg-muted animate-pulse" />
    </div>
  ) : displayNotes.length === 0 ? (
    <EmptyState
      icon={MessageSquare}
      title="No notes yet"
      description={`Add the first note about this ${entityType === "deal" ? "deal" : entityType === "unified_condition" ? "condition" : entityType}.`}
      compact
    />
  ) : (
    <div className={`flex flex-col gap-0 ${maxHeight} ${isCompact && !chatMode ? "overflow-y-auto" : ""}`}>
      {displayNotes.map((note, idx) => {
        // Date divider in chatMode
        let dateDivider: React.ReactNode = null;
        if (chatMode) {
          const prevNote = idx > 0 ? displayNotes[idx - 1] : null;
          const currentLabel = getDateLabel(note.created_at);
          const prevLabel = prevNote ? getDateLabel(prevNote.created_at) : null;
          if (currentLabel !== prevLabel) {
            dateDivider = (
              <div key={`divider-${note.id}`} className="flex items-center gap-3 py-3 px-3">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.06em]">
                  {currentLabel}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
            );
          }
        }
        return (
          <div key={note.id}>
            {dateDivider}
            <NoteThread
              note={note}
              replies={replyMap.get(note.id) || []}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              showPinning={showPinning}
              showInternalToggle={shouldShowInternalToggle}
              defaultInternal={defaultInternal}
              compact={isCompact}
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

  return (
    <div className={`flex flex-col gap-2 ${isCompact ? "" : ""}`}>
      {/* In chatMode, composer goes at the bottom */}
      {!chatMode && composerElement}

      {/* Filters */}
      {shouldShowFilters && notes.length > 0 && (
        <NoteFilters filter={filter} onFilterChange={setFilter} notes={notes} />
      )}

      {/* Notes list */}
      {notesListElement}

      {/* In chatMode, composer is at the bottom (sticky handled by parent) */}
      {chatMode && composerElement}
    </div>
  );
}
