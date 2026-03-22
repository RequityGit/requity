"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  dealMessagesChannelName,
  DEAL_MESSAGES_BROADCAST_EVENT,
} from "@/lib/realtime/deal-message-broadcast";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";
import type { DealMessage } from "@/hooks/useDealMessages";

// ─── Types ───

export type ActivityItemType =
  | "note"
  | "condition_note"
  | "borrower_message"
  | "system_event";

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  timestamp: string;
  /** Note data (when type is "note" or "condition_note") */
  noteData?: NoteData;
  conditionName?: string;
  conditionId?: string;
  /** Message data (when type is "borrower_message") */
  messageData?: DealMessage;
  /** System event data */
  eventData?: {
    action: string;
    description: string;
    actor_name?: string;
  };
}

export interface ActivityCounts {
  all: number;
  notes: number;
  conditions: number;
  messages: number;
  system: number;
}

interface UseActivityFeedOptions {
  dealId: string;
  loanId?: string;
  opportunityId?: string;
  enabled?: boolean;
}

// ─── Hook ───

export function useActivityFeed({
  dealId,
  loanId,
  opportunityId,
  enabled = true,
}: UseActivityFeedOptions) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(0);

  // ─── Fetch notes ───
  const fetchNotes = useCallback(async (silent?: boolean) => {
    const supabase = createClient();
    const conditions: string[] = [];
    if (dealId) conditions.push(`deal_id.eq.${dealId}`);
    if (loanId) conditions.push(`loan_id.eq.${loanId}`);
    if (opportunityId) conditions.push(`opportunity_id.eq.${opportunityId}`);
    if (conditions.length === 0) return;

    let query = supabase
      .from("notes" as never)
      .select(
        "*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never
      )
      .is("deleted_at" as never, null)
      .or(conditions.join(","))
      .is("condition_id" as never, null)
      .order("created_at" as never, { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error("useActivityFeed: error fetching notes:", error);
      return;
    }

    let fetchedNotes = (data as unknown as NoteData[]) ?? [];

    // Enrich condition notes with condition names
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

    setNotes(fetchedNotes);
  }, [dealId, loanId, opportunityId]);

  // ─── Fetch messages ───
  const fetchMessages = useCallback(async (silent?: boolean) => {
    try {
      const res = await fetch(`/api/deal-messages/${dealId}?limit=100`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return;
      const data = await res.json();
      setMessages(data.messages as DealMessage[]);
    } catch {
      console.error("useActivityFeed: error fetching messages");
    }
  }, [dealId]);

  // ─── Combined fetch ───
  const fetchAll = useCallback(async () => {
    const id = ++fetchRef.current;
    setLoading(true);
    await Promise.all([fetchNotes(), fetchMessages()]);
    if (fetchRef.current === id) setLoading(false);
  }, [fetchNotes, fetchMessages]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    fetchAll();
  }, [fetchAll, enabled]);

  // ─── Realtime subscriptions ───
  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();

    // Notes channel
    const notesChannel = supabase
      .channel(`sidebar-notes-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchNotes(true);
        }
      )
      .subscribe();

    // Deal messages channel
    const msgChannel = supabase
      .channel(`sidebar-dm-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchMessages(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notesChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [dealId, enabled, fetchNotes, fetchMessages]);

  // ─── Merge into unified timeline ───
  const items = useMemo<ActivityItem[]>(() => {
    const result: ActivityItem[] = [];

    for (const note of notes) {
      const isConditionNote = !!note.unified_condition_id;
      result.push({
        id: note.id,
        type: isConditionNote ? "condition_note" : "note",
        timestamp: note.created_at,
        noteData: note,
        conditionName: note.condition_name ?? undefined,
        conditionId: note.unified_condition_id ?? undefined,
      });
    }

    for (const msg of messages) {
      result.push({
        id: msg.id,
        type: "borrower_message",
        timestamp: msg.created_at,
        messageData: msg,
      });
    }

    // Sort newest first
    result.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return result;
  }, [notes, messages]);

  // ─── Counts ───
  const counts = useMemo<ActivityCounts>(() => {
    let noteCount = 0;
    let condCount = 0;
    let msgCount = 0;

    for (const item of items) {
      if (item.type === "note") noteCount++;
      else if (item.type === "condition_note") condCount++;
      else if (item.type === "borrower_message") msgCount++;
    }

    return {
      all: items.length,
      notes: noteCount,
      conditions: condCount,
      messages: msgCount,
      system: 0,
    };
  }, [items]);

  return {
    items,
    loading,
    counts,
    refetch: fetchAll,
    refetchNotes: fetchNotes,
  };
}
