"use client";

import { useState, useCallback } from "react";
import { MessageSquare, ChevronsRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { showSuccess, showError } from "@/lib/toast";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { ActivityFilters, type ActivityFilter } from "./ActivityFilters";
import { ActivityFeed } from "./ActivityFeed";
import { ActivityComposer } from "./ActivityComposer";

interface DealActivitySidebarProps {
  dealId: string;
  loanId?: string;
  opportunityId?: string;
  currentUserId: string;
  currentUserName: string;
  conditions: { id: string; condition_name: string }[];
  onClose: () => void;
}

export function DealActivitySidebar({
  dealId,
  loanId,
  opportunityId,
  currentUserId,
  currentUserName,
  conditions,
  onClose,
}: DealActivitySidebarProps) {
  const [filter, setFilter] = useState<ActivityFilter>("all");

  const { items, loading, counts, refetch, refetchNotes } = useActivityFeed({
    dealId,
    loanId,
    opportunityId,
  });

  // ─── Note action handlers ───

  const handleToggleLike = useCallback(
    async (noteId: string, isCurrentlyLiked: boolean) => {
      if (!currentUserId) return;
      const supabase = createClient();

      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("note_likes" as never)
          .delete()
          .eq("note_id" as never, noteId as never)
          .eq("user_id" as never, currentUserId as never);
        if (error) console.error("Failed to unlike note:", error);
      } else {
        const { error } = await supabase
          .from("note_likes" as never)
          .insert({ note_id: noteId, user_id: currentUserId } as never);
        if (error) console.error("Failed to like note:", error);
      }
      refetchNotes();
    },
    [currentUserId, refetchNotes]
  );

  const handleEdit = useCallback(
    async (noteId: string, body: string, mentionIds: string[]) => {
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
      showSuccess("Note updated");
      refetchNotes();
    },
    [refetchNotes]
  );

  const handleDelete = useCallback(
    async (noteId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notes" as never)
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id" as never, noteId as never);

      if (error) {
        showError("Could not delete note", error.message);
        return;
      }
      showSuccess("Note deleted");
      refetchNotes();
    },
    [refetchNotes]
  );

  const handlePin = useCallback(
    async (noteId: string, isPinned: boolean) => {
      const supabase = createClient();

      // For deals, only one note can be pinned; unpin any existing first
      if (!isPinned && dealId) {
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
      showSuccess(isPinned ? "Note unpinned" : "Note pinned");
      refetchNotes();
    },
    [dealId, currentUserId, refetchNotes]
  );

  return (
    <aside className="w-[380px] border-l flex flex-col bg-background flex-shrink-0 h-full overflow-hidden rq-animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] font-semibold">Activity</span>
          <span className="text-[11px] text-muted-foreground bg-foreground/[0.06] px-1.5 py-0.5 rounded-full">
            {counts.all}
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <ActivityFilters active={filter} onChange={setFilter} counts={counts} />

      {/* Feed */}
      <ActivityFeed
        items={items}
        loading={loading}
        filter={filter}
        currentUserId={currentUserId}
        onToggleLike={handleToggleLike}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPin={handlePin}
      />

      {/* Composer */}
      <ActivityComposer
        dealId={dealId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        conditions={conditions}
        onNotePosted={refetch}
      />
    </aside>
  );
}
