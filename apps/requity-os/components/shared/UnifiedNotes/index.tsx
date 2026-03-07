"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare } from "lucide-react";
import { extractMentionIds } from "@/lib/comment-utils";
import { NoteComposer } from "./NoteComposer";
import { NoteCard } from "./NoteCard";
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
  loanId,
  opportunityId,
  showInternalToggle,
  showFilters,
  showPinning = true,
  compact = false,
}: UnifiedNotesProps) {
  // Defaults based on entity type
  const shouldShowInternalToggle =
    showInternalToggle ?? (entityType === "deal" || entityType === "condition");
  const shouldShowFilters =
    showFilters ?? (entityType === "deal" || entityType === "condition");
  const isCompact = entityType === "condition" ? (compact || true) : compact;
  const defaultInternal =
    entityType === "deal" || entityType === "condition";

  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const { toast } = useToast();

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
      .select("*" as never)
      .is("deleted_at" as never, null)
      .order("created_at" as never, { ascending: false });

    if (entityType === "deal") {
      const conditions: string[] = [];
      if (loanId) conditions.push(`loan_id.eq.${loanId}`);
      if (opportunityId) conditions.push(`opportunity_id.eq.${opportunityId}`);
      if (conditions.length > 0) {
        query = query.or(conditions.join(","));
      }
      // Exclude condition-scoped notes from deal-level view
      query = query.is("condition_id" as never, null);
    } else if (entityType === "condition") {
      query = query.eq("condition_id" as never, entityId as never);
    } else {
      const col = getEntityColumn(entityType);
      query = query.eq(col as never, entityId as never);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      setNotes((data as unknown as NoteData[]) ?? []);
    }
    setLoading(false);
  }, [entityType, entityId, loanId, opportunityId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Realtime subscription
  useEffect(() => {
    const col =
      entityType === "deal"
        ? loanId
          ? "loan_id"
          : "opportunity_id"
        : getEntityColumn(entityType);
    const id =
      entityType === "deal"
        ? loanId || opportunityId
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
  }, [entityType, entityId, loanId, opportunityId, fetchNotes]);

  // Post a new note
  async function handlePost(
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
    };

    switch (entityType) {
      case "contact":
        row.contact_id = entityId;
        break;
      case "company":
        row.company_id = entityId;
        break;
      case "deal":
        if (loanId) row.loan_id = loanId;
        if (opportunityId) row.opportunity_id = opportunityId;
        break;
      case "condition":
        row.condition_id = entityId;
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
      toast({
        title: "Failed to post note",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Optimistic: prepend new note
    if (data) {
      setNotes((prev) => [data as unknown as NoteData, ...prev]);
    }

    // Insert note_mentions
    if (data && mentionIds.length > 0) {
      const noteId = (data as unknown as NoteData).id;
      await supabase.from("note_mentions" as never).insert(
        mentionIds.map((userId) => ({
          note_id: noteId,
          mentioned_user_id: userId,
        })) as never
      );
    }

    toast({
      title: isInternal ? "Internal note posted" : "Note posted",
    });
  }

  // Pin/unpin
  async function handlePin(noteId: string, isPinned: boolean) {
    const supabase = createClient();
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
      toast({
        title: "Failed to update pin",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, ...update } as NoteData : n
      )
    );
    toast({ title: isPinned ? "Note unpinned" : "Note pinned" });
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
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
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
    toast({ title: "Note updated" });
  }

  // Soft delete
  async function handleDelete(noteId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("notes" as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id" as never, noteId as never);

    if (error) {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast({ title: "Note deleted" });
  }

  // Filter notes client-side
  const filteredNotes =
    filter === "internal"
      ? notes.filter((n) => n.is_internal)
      : filter === "external"
        ? notes.filter((n) => !n.is_internal)
        : notes;

  const maxHeight = isCompact ? "max-h-[300px]" : "";

  return (
    <div className={`flex flex-col gap-3 ${isCompact ? "" : ""}`}>
      {/* Composer */}
      {currentUserId && (
        <NoteComposer
          currentUserName={currentUserName}
          showInternalToggle={shouldShowInternalToggle}
          defaultInternal={defaultInternal}
          compact={isCompact}
          onPost={handlePost}
        />
      )}

      {/* Filters */}
      {shouldShowFilters && notes.length > 0 && (
        <NoteFilters filter={filter} onFilterChange={setFilter} notes={notes} />
      )}

      {/* Notes list */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-14 rounded-xl bg-muted animate-pulse" />
          <div className="h-14 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted mb-3">
            <MessageSquare
              className="h-5 w-5 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-0.5">
            No notes yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Add the first note about this{" "}
            {entityType === "deal" ? "deal" : entityType}.
          </p>
        </div>
      ) : (
        <div className={`flex flex-col gap-2.5 ${maxHeight} ${isCompact ? "overflow-y-auto" : ""}`}>
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              currentUserId={currentUserId}
              showPinning={showPinning}
              compact={isCompact}
              onPin={handlePin}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
