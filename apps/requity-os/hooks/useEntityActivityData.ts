"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  StreamItem,
  StreamItemType,
  StreamFilterType,
  StreamFilterCounts,
} from "@/components/pipeline/tabs/ActionCenterTab/useActionCenterData";
import {
  mapToFilterType,
  getInitials,
  groupSystemEvents,
} from "@/components/pipeline/tabs/ActionCenterTab/useActionCenterData";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";
import type { UploadedAttachment } from "@/components/shared/attachments";
import { showSuccess, showError } from "@/lib/toast";

// ── Entity types supported ──

export type ActivityEntityType = "contact" | "company";

// ── Map CRM activity type to stream item type ──

function mapCrmActivityType(type: string): StreamItemType {
  if (type === "call") return "call";
  if (type === "email") return "email_out";
  if (type === "text_message") return "sms";
  if (type === "meeting" || type === "event") return "meeting";
  if (type === "note") return "note";
  return "system";
}

// ── Main hook ──

interface UseEntityActivityDataOptions {
  entityType: ActivityEntityType;
  entityId: string;
  currentUserId: string;
  currentUserName: string;
}

export function useEntityActivityData({
  entityType,
  entityId,
  currentUserId,
  currentUserName,
}: UseEntityActivityDataOptions) {
  const supabase = createClient();
  const fetchRef = useRef(0);

  // State
  const [crmActivities, setCrmActivities] = useState<Record<string, unknown>[]>([]);
  const [crmEmails, setCrmEmails] = useState<Record<string, unknown>[]>([]);
  const [allNotes, setAllNotes] = useState<NoteData[]>([]);
  const [streamLoading, setStreamLoading] = useState(true);
  const [profileColors, setProfileColors] = useState<Record<string, string | null>>({});
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  // Filter
  const [activeFilter, setActiveFilter] = useState<StreamFilterType>("all");

  // ── Entity column helpers ──

  const noteEntityColumn = entityType === "contact" ? "contact_id" : "company_id";
  const activityEntityColumn = entityType === "contact" ? "contact_id" : "company_id";
  const emailEntityColumn = "linked_contact_id"; // Only for contacts

  // ── Separate top-level notes from replies ──

  const { topNotes, repliesByParent } = useMemo(() => {
    const top: NoteData[] = [];
    const replies = new Map<string, NoteData[]>();

    for (const n of allNotes) {
      if (n.parent_note_id) {
        const arr = replies.get(n.parent_note_id) ?? [];
        arr.push(n);
        replies.set(n.parent_note_id, arr);
      } else {
        top.push(n);
      }
    }

    // Sort replies ascending
    replies.forEach((arr) => {
      arr.sort(
        (a: NoteData, b: NoteData) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return { topNotes: top, repliesByParent: replies };
  }, [allNotes]);

  // ── Fetch all data ──

  const fetchStream = useCallback(
    async (silent?: boolean) => {
      const id = ++fetchRef.current;
      if (!silent) setStreamLoading(true);

      try {
        const queries: Promise<{ data: unknown[] | null }>[] = [
          // Notes with likes and attachments
          supabase
            .from("notes" as never)
            .select(
              "*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never
            )
            .eq(noteEntityColumn as never, entityId as never)
            .is("deleted_at" as never, null)
            .order("created_at" as never, { ascending: false })
            .limit(200) as unknown as Promise<{ data: unknown[] | null }>,

          // CRM activities
          supabase
            .from("crm_activities" as never)
            .select(
              "id, activity_type, subject, description, outcome, direction, call_duration_seconds, performed_by, performed_by_name, created_at" as never
            )
            .eq(activityEntityColumn as never, entityId as never)
            .order("created_at" as never, { ascending: false })
            .limit(200) as unknown as Promise<{ data: unknown[] | null }>,
        ];

        // CRM emails only for contacts
        if (entityType === "contact") {
          queries.push(
            supabase
              .from("crm_emails" as never)
              .select("*" as never)
              .eq(emailEntityColumn as never, entityId as never)
              .order("created_at" as never, { ascending: false })
              .limit(100) as unknown as Promise<{ data: unknown[] | null }>
          );
        }

        const results = await Promise.all(queries);

        if (fetchRef.current !== id) return;

        const notesData = (results[0].data ?? []) as unknown as NoteData[];
        const activitiesData = (results[1].data ?? []) as Record<string, unknown>[];
        const emailsData =
          entityType === "contact"
            ? ((results[2].data ?? []) as Record<string, unknown>[])
            : [];

        setAllNotes(notesData);
        setCrmActivities(activitiesData);
        setCrmEmails(emailsData);

        // Collect all user IDs for batch profile fetch
        const allUserIds = new Set<string>();
        for (const n of notesData) {
          if (n.author_id) allUserIds.add(n.author_id);
          for (const l of n.note_likes ?? []) {
            if (l.user_id) allUserIds.add(l.user_id);
          }
        }
        for (const a of activitiesData) {
          const by = a.performed_by as string;
          if (by) allUserIds.add(by);
        }

        if (allUserIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, accent_color")
            .in("id", Array.from(allUserIds));
          if (profiles) {
            const colorMap: Record<string, string | null> = {};
            const nameMap: Record<string, string> = {};
            for (const p of profiles as unknown as Array<{
              id: string;
              full_name: string | null;
              accent_color: string | null;
            }>) {
              colorMap[p.id] = p.accent_color;
              nameMap[p.id] = p.full_name || "Unknown";
            }
            setProfileColors(colorMap);
            setProfileNames(nameMap);

            // Enrich notes with accent colors
            const enrichedNotes = notesData.map((n) => ({
              ...n,
              author_accent_color: colorMap[n.author_id] ?? null,
              note_likes: (n.note_likes ?? []).map((l) => ({
                ...l,
                profiles: {
                  ...l.profiles,
                  accent_color: colorMap[l.user_id] ?? null,
                },
              })),
            }));
            setAllNotes(enrichedNotes);
          }
        }
      } catch {
        // Data stays stale on error
      } finally {
        if (fetchRef.current === id) setStreamLoading(false);
      }
    },
    [entityType, entityId, noteEntityColumn, activityEntityColumn, emailEntityColumn, supabase]
  );

  // ── Initial fetch ──

  useEffect(() => {
    fetchStream();
  }, [fetchStream]);

  // ── Build unified stream ──

  const streamItems = useMemo<StreamItem[]>(() => {
    const result: StreamItem[] = [];

    // CRM activities
    for (const a of crmActivities) {
      const actType = a.activity_type as string;
      const type = mapCrmActivityType(actType);
      const performedBy = a.performed_by as string;
      const performedByName =
        (a.performed_by_name as string) ?? profileNames[performedBy] ?? "Unknown";

      result.push({
        id: `crm-${a.id}`,
        type,
        timestamp: a.created_at as string,
        author: {
          id: performedBy ?? undefined,
          name: performedByName,
          initials: getInitials(performedByName),
          accent_color: performedBy ? profileColors[performedBy] ?? null : null,
        },
        title: (a.subject as string) ?? actType.replace(/_/g, " "),
        description: (a.description as string) ?? undefined,
        callDuration: (a.call_duration_seconds as number) ?? undefined,
        callDirection: (a.direction as string) ?? undefined,
      });
    }

    // CRM emails (contacts only)
    for (const e of crmEmails) {
      const sentByName = e.sent_by_name as string | null;
      const fromEmail = e.from_email as string;
      const isInbound = sentByName == null;
      result.push({
        id: `email-${e.id}`,
        type: isInbound ? "email_in" : "email_out",
        timestamp: e.created_at as string,
        author: {
          name: sentByName ?? fromEmail ?? "Unknown",
          initials: getInitials(sentByName ?? fromEmail),
        },
        subject: (e.subject as string) ?? undefined,
        bodyPreview: (e.body_text as string)?.slice(0, 200) ?? undefined,
        fromEmail: fromEmail ?? undefined,
        toEmail: (e.to_email as string) ?? undefined,
        emailAttachments: (e.attachments as unknown[]) ?? undefined,
        crmEmail: e as never,
      });
    }

    // Notes (top-level only; replies are nested inside)
    for (const n of topNotes) {
      const replies = repliesByParent.get(n.id) ?? [];
      result.push({
        id: `note-${n.id}`,
        type: "note",
        timestamp: n.created_at,
        author: {
          id: n.author_id,
          name: n.author_name ?? "Unknown",
          initials: getInitials(n.author_name),
          accent_color:
            n.author_accent_color ?? profileColors[n.author_id] ?? null,
        },
        noteData: n,
        noteReplies: replies.length > 0 ? replies : undefined,
      });
    }

    // Sort ascending (oldest first, newest at bottom)
    result.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group rapid system events
    return groupSystemEvents(result);
  }, [crmActivities, crmEmails, topNotes, repliesByParent, profileColors, profileNames]);

  // ── Filter counts ──

  const filterCounts = useMemo<StreamFilterCounts>(() => {
    const c: StreamFilterCounts = {
      all: 0,
      notes: 0,
      emails: 0,
      calls: 0,
      messages: 0,
      system: 0,
    };
    for (const item of streamItems) {
      c.all++;
      const cat = mapToFilterType(item.type);
      c[cat]++;
    }
    return c;
  }, [streamItems]);

  // ── Filtered items ──

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return streamItems;
    return streamItems.filter(
      (item) => mapToFilterType(item.type) === activeFilter
    );
  }, [streamItems, activeFilter]);

  // ── Note CRUD operations ──

  const postNote = useCallback(
    async (
      body: string,
      isInternal: boolean,
      mentionIds: string[],
      attachments?: UploadedAttachment[]
    ) => {
      const optimisticNote: NoteData = {
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_id: currentUserId,
        author_name: currentUserName,
        body,
        parent_note_id: null,
        mentions: mentionIds,
        is_internal: isInternal,
        is_pinned: false,
        pinned_by: null,
        pinned_at: null,
        is_edited: false,
        edited_at: null,
        deleted_at: null,
        note_likes: [],
        note_attachments: [],
      };

      setAllNotes((prev) => [optimisticNote, ...prev]);

      const row: Record<string, unknown> = {
        body,
        author_id: currentUserId,
        author_name: currentUserName,
        is_internal: isInternal,
        [noteEntityColumn]: entityId,
        mentions: mentionIds.length > 0 ? mentionIds : [],
      };

      const { data, error } = await supabase
        .from("notes" as never)
        .insert(row as never)
        .select()
        .single();

      if (error) {
        setAllNotes((prev) =>
          prev.filter((n) => n.id !== optimisticNote.id)
        );
        showError("Could not post note", error.message);
        return;
      }

      // Upload attachments if any
      if (data && attachments && attachments.length > 0) {
        const noteId = (data as unknown as NoteData).id;
        await supabase
          .from("note_attachments" as never)
          .insert(
            attachments.map((a) => ({
              note_id: noteId,
              file_name: a.fileName,
              file_type: a.fileType,
              file_size_bytes: a.fileSizeBytes,
              storage_path: a.storagePath,
            })) as never
          );
      }

      // Replace temp with real
      if (data) {
        const real = data as unknown as NoteData;
        setAllNotes((prev) =>
          prev.map((n) =>
            n.id === optimisticNote.id
              ? { ...real, note_likes: [], note_attachments: [] }
              : n
          )
        );
      }
    },
    [currentUserId, currentUserName, entityId, noteEntityColumn, supabase]
  );

  const replyToNote = useCallback(
    async (
      parentNoteId: string,
      body: string,
      isInternal: boolean,
      mentionIds: string[],
      attachments?: UploadedAttachment[]
    ) => {
      const row: Record<string, unknown> = {
        body,
        author_id: currentUserId,
        author_name: currentUserName,
        is_internal: isInternal,
        [noteEntityColumn]: entityId,
        parent_note_id: parentNoteId,
        mentions: mentionIds.length > 0 ? mentionIds : [],
      };

      const { data, error } = await supabase
        .from("notes" as never)
        .insert(row as never)
        .select()
        .single();

      if (error) {
        showError("Could not post reply", error.message);
        return;
      }

      if (data && attachments && attachments.length > 0) {
        const noteId = (data as unknown as NoteData).id;
        await supabase
          .from("note_attachments" as never)
          .insert(
            attachments.map((a) => ({
              note_id: noteId,
              file_name: a.fileName,
              file_type: a.fileType,
              file_size_bytes: a.fileSizeBytes,
              storage_path: a.storagePath,
            })) as never
          );
      }

      if (data) {
        const real = {
          ...(data as unknown as NoteData),
          note_likes: [],
          note_attachments: [],
        };
        setAllNotes((prev) => [real, ...prev]);
      }
    },
    [currentUserId, currentUserName, entityId, noteEntityColumn, supabase]
  );

  const editNote = useCallback(
    async (noteId: string, body: string, mentionIds: string[]) => {
      setAllNotes((prev) =>
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

      const { error } = await supabase
        .from("notes" as never)
        .update({
          body,
          mentions: mentionIds.length > 0 ? mentionIds : null,
          is_edited: true,
          edited_at: new Date().toISOString(),
        } as never)
        .eq("id" as never, noteId as never);

      if (error) {
        showError("Could not update note", error.message);
        fetchStream(true);
      }
    },
    [supabase, fetchStream]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      setAllNotes((prev) => prev.filter((n) => n.id !== noteId));

      const { error } = await supabase
        .from("notes" as never)
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq("id" as never, noteId as never);

      if (error) {
        showError("Could not delete note", error.message);
        fetchStream(true);
      } else {
        showSuccess("Note deleted");
      }
    },
    [supabase, fetchStream]
  );

  const toggleLike = useCallback(
    async (noteId: string, isCurrentlyLiked: boolean) => {
      setAllNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          const likes = isCurrentlyLiked
            ? n.note_likes.filter((l) => l.user_id !== currentUserId)
            : [
                ...n.note_likes,
                {
                  user_id: currentUserId,
                  profiles: { full_name: currentUserName },
                },
              ];
          return { ...n, note_likes: likes };
        })
      );

      if (isCurrentlyLiked) {
        await supabase
          .from("note_likes" as never)
          .delete()
          .eq("note_id" as never, noteId as never)
          .eq("user_id" as never, currentUserId as never);
      } else {
        await supabase
          .from("note_likes" as never)
          .insert({ note_id: noteId, user_id: currentUserId } as never);
      }
    },
    [supabase, currentUserId, currentUserName]
  );

  const pinNote = useCallback(
    async (noteId: string, isPinned: boolean) => {
      // Optimistic: if pinning, unpin others
      setAllNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            return {
              ...n,
              is_pinned: !isPinned,
              pinned_by: !isPinned ? currentUserId : null,
              pinned_at: !isPinned ? new Date().toISOString() : null,
            };
          }
          if (!isPinned && n.is_pinned) {
            return { ...n, is_pinned: false, pinned_by: null, pinned_at: null };
          }
          return n;
        })
      );

      // Unpin existing pinned note if we're pinning
      if (!isPinned) {
        await supabase
          .from("notes" as never)
          .update({
            is_pinned: false,
            pinned_by: null,
            pinned_at: null,
          } as never)
          .eq(noteEntityColumn as never, entityId as never)
          .eq("is_pinned" as never, true as never);
      }

      await supabase
        .from("notes" as never)
        .update({
          is_pinned: !isPinned,
          pinned_by: !isPinned ? currentUserId : null,
          pinned_at: !isPinned ? new Date().toISOString() : null,
        } as never)
        .eq("id" as never, noteId as never);
    },
    [supabase, entityId, noteEntityColumn, currentUserId]
  );

  // ── Log CRM Activity ──

  const logActivity = useCallback(
    async (activityType: string, subject: string, description: string) => {
      const row: Record<string, unknown> = {
        [activityEntityColumn]: entityId,
        activity_type: activityType,
        subject: subject || null,
        description: description || null,
        performed_by: currentUserId,
      };

      const { error } = await supabase
        .from("crm_activities")
        .insert(row as never);

      if (error) {
        showError("Could not log activity", error.message);
        return { error: error.message };
      }

      // Update last_contacted_at for contacts
      if (entityType === "contact") {
        await supabase
          .from("crm_contacts")
          .update({ last_contacted_at: new Date().toISOString() })
          .eq("id", entityId);
      }

      showSuccess("Activity logged");
      fetchStream(true);
      return { success: true };
    },
    [entityType, entityId, activityEntityColumn, currentUserId, supabase, fetchStream]
  );

  return {
    // Stream
    streamItems: filteredItems,
    allStreamItems: streamItems,
    streamLoading,
    filterCounts,
    activeFilter,
    setActiveFilter,
    refetchStream: fetchStream,

    // Note CRUD
    postNote,
    replyToNote,
    editNote,
    deleteNote,
    toggleLike,
    pinNote,

    // CRM Activity
    logActivity,
  };
}
