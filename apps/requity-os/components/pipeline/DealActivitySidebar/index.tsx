"use client";

import { useState, useCallback } from "react";
import { MessageSquare, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { showSuccess, showError } from "@/lib/toast";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { ActivityFilters, type ActivityFilter } from "./ActivityFilters";
import { ActivityFeed } from "./ActivityFeed";
import { ActivityComposer } from "./ActivityComposer";
import { TimelineTab } from "./TimelineTab";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";

// ── Sidebar tab types ──

type SidebarTab = "timeline" | "notes" | "conditions" | "messages";

const SIDEBAR_TABS: { key: SidebarTab; label: string }[] = [
  { key: "timeline", label: "Timeline" },
  { key: "notes", label: "Notes" },
  { key: "conditions", label: "Conditions" },
  { key: "messages", label: "Messages" },
];

// Map sidebar tab to activity filter for the existing notes/conditions/messages feed
const TAB_TO_FILTER: Record<string, ActivityFilter> = {
  notes: "notes",
  conditions: "conditions",
  messages: "messages",
};

// ── Props ──

interface DealActivitySidebarProps {
  dealId: string;
  loanId?: string;
  opportunityId?: string;
  primaryContactId?: string | null;
  currentUserId: string;
  currentUserName: string;
  conditions: { id: string; condition_name: string }[];
  onClose: () => void;
}

export function DealActivitySidebar({
  dealId,
  loanId,
  opportunityId,
  primaryContactId = null,
  currentUserId,
  currentUserName,
  conditions,
  onClose,
}: DealActivitySidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("timeline");

  // Existing activity feed hook (notes, conditions, messages)
  const { items, loading, counts, refetch, refetchNotes } = useActivityFeed({
    dealId,
    loanId,
    opportunityId,
    // Only fetch when on a tab that uses it
    enabled: activeTab !== "timeline",
  });

  // ─── Note action handlers (unchanged) ───

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
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rq-transition cursor-pointer"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Top-level tab bar */}
      <div className="flex items-center border-b flex-shrink-0">
        {SIDEBAR_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 px-1 py-2 text-[11px] font-medium text-center border-b-2 rq-transition cursor-pointer",
              activeTab === tab.key
                ? "text-foreground border-foreground font-semibold"
                : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {tab.label}
            {tab.key !== "timeline" && (
              <span className="ml-1 text-[9px] text-muted-foreground/60">
                {counts[TAB_TO_FILTER[tab.key] ?? "all"]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "timeline" ? (
        <TimelineTab
          dealId={dealId}
          primaryContactId={primaryContactId ?? null}
          onSwitchToNotes={() => setActiveTab("notes")}
        />
      ) : activeTab === "notes" ? (
        /* Notes tab uses UnifiedNotes for full threading support */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-2 pt-3 pb-1">
            <UnifiedNotes
              entityType="deal"
              entityId={dealId}
              dealId={dealId}
              loanId={loanId}
              opportunityId={opportunityId}
              showPinning
              compact
              chatMode
            />
          </div>
        </div>
      ) : (
        <>
          {/* Existing conditions/messages feed */}
          <ActivityFeed
            items={items}
            loading={loading}
            filter={TAB_TO_FILTER[activeTab] ?? "all"}
            currentUserId={currentUserId}
            onToggleLike={handleToggleLike}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPin={handlePin}
          />
        </>
      )}

      {/* Composer (visible for conditions/messages tabs, not for notes which has its own) */}
      {activeTab !== "timeline" && activeTab !== "notes" && (
        <ActivityComposer
          dealId={dealId}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          conditions={conditions}
          onNotePosted={refetch}
        />
      )}
    </aside>
  );
}
