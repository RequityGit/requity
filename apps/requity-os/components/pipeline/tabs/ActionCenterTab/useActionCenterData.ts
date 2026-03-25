"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActivityTabData } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import type { DealActivity } from "@/components/pipeline/pipeline-types";
import type { ActivityData, EmailData } from "@/components/crm/contact-360/types";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";
import type { UploadedAttachment } from "@/components/shared/attachments";
import { showSuccess, showError } from "@/lib/toast";

// ── Stream item types ──

export type StreamItemType =
  | "note"
  | "email_in"
  | "email_out"
  | "call"
  | "sms"
  | "meeting"
  | "stage_change"
  | "system"
  | "system_group"
  | "document_upload"
  | "form_link_sent"
  | "form_submission"
  | "document_generated"
  | "message";

export type StreamFilterType = "all" | "notes" | "emails" | "calls" | "messages" | "system";

export interface StreamItem {
  id: string;
  type: StreamItemType;
  timestamp: string;
  author: {
    id?: string;
    name: string;
    initials: string;
    accent_color?: string | null;
  };
  // Shared
  title?: string;
  description?: string;
  // Note-specific
  noteData?: NoteData;
  noteReplies?: NoteData[];
  // Email-specific
  subject?: string;
  bodyPreview?: string;
  fromEmail?: string;
  toEmail?: string;
  emailAttachments?: unknown[];
  // Call-specific
  callDuration?: number;
  callDirection?: string;
  // Stage change
  fromStage?: string;
  toStage?: string;
  // System group
  groupedFields?: string[];
  groupCount?: number;
  groupedItems?: StreamItem[];
  // Message-specific
  messageSenderType?: "admin" | "borrower" | "system";
  messageSource?: "portal" | "email" | "sms";
  // Raw source for pass-through rendering
  dealActivity?: DealActivity;
  crmActivity?: ActivityData;
  crmEmail?: EmailData;
  // Form-specific
  formName?: string;
  formStatus?: string;
  formSubmitterName?: string;
  // Document generation specific
  docTemplateName?: string;
  docFileName?: string;
  docId?: string;
  // Field update details (old/new values from metadata)
  fieldOldValue?: string;
  fieldNewValue?: string;
}

export interface StreamFilterCounts {
  all: number;
  notes: number;
  emails: number;
  calls: number;
  messages: number;
  system: number;
}

// ── Task type ──

export interface DealTask {
  id: string;
  deal_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// ── Condition profile type ──

export interface ConditionProfile {
  id: string;
  full_name: string | null;
  accent_color: string | null;
}

// ── Condition type ──

export interface DealConditionRow {
  id: string;
  deal_id: string;
  condition_name: string;
  category: string;
  status: string;
  required_stage: string;
  due_date: string | null;
  assigned_to: string | null;
  responsible_party: string | null;
  critical_path_item: boolean | null;
  internal_description: string | null;
  borrower_description: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  requires_approval: boolean | null;
  is_required: boolean | null;
  sort_order: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  document_urls: string[] | null;
  approver_id: string | null;
}

// ── Condition document type ──

export interface ConditionDocument {
  id: string;
  document_name: string;
  file_url: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  created_at: string;
  condition_id: string | null;
}

// ── System activity type detection ──

const SYSTEM_ACTIVITY_TYPES = new Set([
  "stage_change",
  "team_updated",
  "approval_requested",
  "closing_scheduled",
]);

// ── Map activity type to stream item type ──

function mapActivityType(type: string): StreamItemType {
  if (SYSTEM_ACTIVITY_TYPES.has(type)) return type === "stage_change" ? "stage_change" : "system";
  if (type === "call" || type === "call_logged") return "call";
  if (type === "email" || type === "email_sent") return "email_out";
  if (type === "text_message") return "sms";
  if (type === "meeting" || type === "event") return "meeting";
  if (type === "note") return "note";
  return "system";
}

function mapToFilterType(type: StreamItemType): StreamFilterType {
  if (type === "note") return "notes";
  if (type === "email_in" || type === "email_out") return "emails";
  if (type === "call" || type === "sms" || type === "meeting") return "calls";
  if (type === "message") return "messages";
  return "system";
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Group rapid system events ──

const SYSTEM_GROUP_WINDOW_MS = 3600000; // 1 hour

function groupSystemEvents(items: StreamItem[]): StreamItem[] {
  const result: StreamItem[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];

    // Only group system-type field updates (not stage changes)
    if (item.type === "system" && item.dealActivity) {
      const group: StreamItem[] = [item];
      let j = i + 1;

      while (j < items.length) {
        const next = items[j];
        if (
          next.type === "system" &&
          next.dealActivity &&
          next.author.id === item.author.id &&
          Math.abs(new Date(next.timestamp).getTime() - new Date(item.timestamp).getTime()) < SYSTEM_GROUP_WINDOW_MS
        ) {
          group.push(next);
          j++;
        } else {
          break;
        }
      }

      if (group.length > 1) {
        const titles = group.map((g) => g.title).filter(Boolean);
        result.push({
          ...item,
          id: `group-${item.id}`,
          type: "system_group",
          title: `${titles.length} updates`,
          description: titles.join(", "),
          groupedFields: titles as string[],
          groupCount: group.length,
          groupedItems: group,
          timestamp: group[group.length - 1].timestamp,
        });
      } else {
        result.push(item);
      }

      i = j;
    } else {
      result.push(item);
      i++;
    }
  }

  return result;
}

// ── Main hook ──

interface UseActionCenterDataOptions {
  dealId: string;
  primaryContactId: string | null;
  currentUserId: string;
  currentUserName: string;
}

export function useActionCenterData({
  dealId,
  primaryContactId,
  currentUserId,
  currentUserName,
}: UseActionCenterDataOptions) {
  const supabase = createClient();
  const fetchRef = useRef(0);

  // Stream data
  const [dealActivities, setDealActivities] = useState<DealActivity[]>([]);
  const [crmActivities, setCrmActivities] = useState<ActivityData[]>([]);
  const [crmEmails, setCrmEmails] = useState<EmailData[]>([]);
  const [allNotes, setAllNotes] = useState<NoteData[]>([]);
  const [formLinks, setFormLinks] = useState<Record<string, unknown>[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<Record<string, unknown>[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, unknown>[]>([]);
  const [genDocProfiles, setGenDocProfiles] = useState<Record<string, string>>({});
  const [dealMessages, setDealMessages] = useState<Record<string, unknown>[]>([]);
  const [streamLoading, setStreamLoading] = useState(true);
  const [profileColors, setProfileColors] = useState<Record<string, string | null>>({});

  // Rail data
  const [conditions, setConditions] = useState<DealConditionRow[]>([]);
  const [conditionDocs, setConditionDocs] = useState<ConditionDocument[]>([]);
  const [tasks, setTasks] = useState<DealTask[]>([]);
  const [railLoading, setRailLoading] = useState(true);
  const [conditionProfiles, setConditionProfiles] = useState<Record<string, ConditionProfile>>({});

  // Filter
  const [activeFilter, setActiveFilter] = useState<StreamFilterType>("all");

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
      arr.sort((a: NoteData, b: NoteData) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return { topNotes: top, repliesByParent: replies };
  }, [allNotes]);

  // ── Fetch stream data ──

  const fetchStream = useCallback(
    async (silent?: boolean) => {
      const id = ++fetchRef.current;
      if (!silent) setStreamLoading(true);

      try {
        const timelineResult = await fetchActivityTabData(dealId, primaryContactId);

        // Fetch ALL notes for this deal (including replies) with likes and attachments
        const [{ data: notesData }, { data: formLinksData }, { data: formSubmissionsData }, { data: genDocsData }, { data: messagesData }] = await Promise.all([
          supabase
            .from("notes" as never)
            .select("*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never)
            .eq("deal_id" as never, dealId as never)
            .is("deleted_at" as never, null)
            .is("condition_id" as never, null)
            .order("created_at" as never, { ascending: false })
            .limit(200),
          supabase
            .from("deal_application_links")
            .select(`
              id, created_at, status,
              form_definitions (name, slug),
              crm_contacts (first_name, last_name)
            `)
            .eq("deal_id", dealId)
            .order("created_at", { ascending: false }),
          supabase
            .from("form_submissions")
            .select(`
              id, status, created_at, updated_at, data, submitted_by_email,
              form_definitions (name)
            `)
            .eq("deal_id", dealId)
            .order("created_at", { ascending: false }),
          supabase
            .from("generated_documents")
            .select(`
              id, file_name, generated_at, generated_by, status,
              document_templates (name, template_type)
            `)
            .eq("record_id", dealId)
            .eq("record_type", "deal")
            .order("generated_at", { ascending: false }),
          supabase
            .from("deal_messages" as never)
            .select("id, deal_id, sender_type, sender_id, contact_id, source, body, metadata, created_at, sender_name" as never)
            .eq("deal_id" as never, dealId as never)
            .order("created_at" as never, { ascending: true })
            .limit(200),
        ]);

        if (fetchRef.current !== id) return;

        if (!("error" in timelineResult) || !timelineResult.error) {
          setDealActivities(timelineResult.dealActivities as unknown as DealActivity[]);
          setCrmActivities(timelineResult.crmActivities as unknown as ActivityData[]);
          setCrmEmails(timelineResult.crmEmails as unknown as EmailData[]);
        }

        setAllNotes((notesData ?? []) as unknown as NoteData[]);
        setFormLinks((formLinksData ?? []) as Record<string, unknown>[]);
        setFormSubmissions((formSubmissionsData ?? []) as Record<string, unknown>[]);
        setGeneratedDocs((genDocsData ?? []) as Record<string, unknown>[]);
        setDealMessages((messagesData ?? []) as Record<string, unknown>[]);

        // Collect all user IDs for batch profile fetch (accent colors + names)
        const allUserIds = new Set<string>();
        for (const da of timelineResult.dealActivities as unknown as DealActivity[]) {
          if (da.created_by) allUserIds.add(da.created_by);
        }
        for (const n of (notesData ?? []) as unknown as NoteData[]) {
          if (n.author_id) allUserIds.add(n.author_id);
          for (const l of n.note_likes ?? []) {
            if (l.user_id) allUserIds.add(l.user_id);
          }
        }
        for (const d of genDocsData ?? []) {
          const gby = (d as Record<string, unknown>).generated_by as string;
          if (gby) allUserIds.add(gby);
        }
        for (const m of messagesData ?? []) {
          const sid = (m as Record<string, unknown>).sender_id as string;
          if (sid) allUserIds.add(sid);
        }

        if (allUserIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, accent_color")
            .in("id", Array.from(allUserIds));
          if (profiles) {
            const colorMap: Record<string, string | null> = {};
            const profileMap: Record<string, string> = {};
            for (const p of profiles as unknown as Array<{ id: string; full_name: string | null; accent_color: string | null }>) {
              colorMap[p.id] = p.accent_color;
              profileMap[p.id] = p.full_name || "Unknown";
            }
            setGenDocProfiles(profileMap);
            setProfileColors(colorMap);

            // Enrich notes with accent colors
            const enrichedNotes = ((notesData ?? []) as unknown as NoteData[]).map((n) => ({
              ...n,
              author_accent_color: colorMap[n.author_id] ?? null,
              note_likes: (n.note_likes ?? []).map((l) => ({
                ...l,
                profiles: { ...l.profiles, accent_color: colorMap[l.user_id] ?? null },
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
    [dealId, primaryContactId, supabase]
  );

  // ── Fetch rail data ──

  const fetchRail = useCallback(
    async (silent?: boolean) => {
      if (!silent) setRailLoading(true);

      try {
        const [condResult, docsResult, taskResult] = await Promise.all([
          supabase
            .from("unified_deal_conditions" as never)
            .select("*" as never)
            .eq("deal_id" as never, dealId as never)
            .order("sort_order" as never, { ascending: true }),
          supabase
            .from("unified_deal_documents" as never)
            .select("id, document_name, file_url, storage_path, file_size_bytes, created_at, condition_id" as never)
            .eq("deal_id" as never, dealId as never)
            .is("deleted_at" as never, null),
          supabase
            .from("unified_deal_tasks" as never)
            .select("*" as never)
            .eq("deal_id" as never, dealId as never)
            .order("created_at" as never, { ascending: true }),
        ]);

        const condRows = (condResult.data ?? []) as unknown as DealConditionRow[];
        setConditions(condRows);
        setConditionDocs((docsResult.data ?? []) as unknown as ConditionDocument[]);
        setTasks((taskResult.data ?? []) as unknown as DealTask[]);

        // Batch-fetch profiles for condition avatars
        const userIds = new Set<string>();
        for (const c of condRows) {
          if (c.assigned_to) userIds.add(c.assigned_to);
          if (c.approver_id) userIds.add(c.approver_id);
        }
        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, accent_color")
            .in("id", Array.from(userIds));
          if (profiles) {
            const map: Record<string, ConditionProfile> = {};
            for (const p of profiles) {
              map[p.id] = { id: p.id, full_name: p.full_name, accent_color: p.accent_color };
            }
            setConditionProfiles(map);
          }
        }
      } catch {
        // Data stays stale
      } finally {
        setRailLoading(false);
      }
    },
    [dealId, supabase]
  );

  // ── Initial fetch ──

  useEffect(() => {
    fetchStream();
    fetchRail();
  }, [fetchStream, fetchRail]);

  // ── Realtime: listen for new deal messages ──

  useEffect(() => {
    const channel = supabase
      .channel(`action-center-messages:${dealId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchStream(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase, fetchStream]);

  // ── Build unified stream ──

  const streamItems = useMemo<StreamItem[]>(() => {
    const result: StreamItem[] = [];

    // Deal activities (system events)
    for (const da of dealActivities) {
      if (SYSTEM_ACTIVITY_TYPES.has(da.activity_type) || crmActivities.length === 0) {
        const type = mapActivityType(da.activity_type);
        const resolvedName = da.created_by ? genDocProfiles[da.created_by] : undefined;
        const meta = da.metadata as Record<string, unknown> | null;
        result.push({
          id: `deal-${da.id}`,
          type,
          timestamp: da.created_at,
          author: {
            id: da.created_by ?? undefined,
            name: resolvedName ?? "System",
            initials: resolvedName ? getInitials(resolvedName) : "SY",
            accent_color: da.created_by ? profileColors[da.created_by] ?? null : null,
          },
          title: da.title,
          description: da.description ?? undefined,
          fromStage: type === "stage_change" ? ((meta as Record<string, string>)?.from_stage ?? undefined) : undefined,
          toStage: type === "stage_change" ? ((meta as Record<string, string>)?.to_stage ?? undefined) : undefined,
          fieldOldValue: meta?.old_value != null ? String(meta.old_value) : undefined,
          fieldNewValue: meta?.value != null ? String(meta.value) : undefined,
          dealActivity: da,
        });
      }
    }

    // CRM activities (calls, meetings, notes logged via CRM)
    for (const a of crmActivities) {
      const type = mapActivityType(a.activity_type);
      result.push({
        id: `crm-${a.id}`,
        type,
        timestamp: a.created_at,
        author: {
          name: a.created_by_name ?? "Unknown",
          initials: getInitials(a.created_by_name),
        },
        title: a.subject ?? a.activity_type.replace(/_/g, " "),
        description: (a as unknown as Record<string, string>).description ?? undefined,
        callDuration: a.call_duration_seconds ?? undefined,
        callDirection: a.direction ?? undefined,
        crmActivity: a,
      });
    }

    // CRM emails
    for (const e of crmEmails) {
      const isInbound = (e as unknown as Record<string, string>).direction === "inbound";
      result.push({
        id: `email-${e.id}`,
        type: isInbound ? "email_in" : "email_out",
        timestamp: e.created_at,
        author: {
          name: e.sent_by_name ?? e.from_email ?? "Unknown",
          initials: getInitials(e.sent_by_name ?? e.from_email),
        },
        subject: e.subject ?? undefined,
        bodyPreview: e.body_text?.slice(0, 200) ?? undefined,
        fromEmail: e.from_email ?? undefined,
        toEmail: e.to_email ?? undefined,
        emailAttachments: (e.attachments as unknown[]) ?? undefined,
        crmEmail: e,
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
          accent_color: n.author_accent_color ?? profileColors[n.author_id] ?? null,
        },
        noteData: n,
        noteReplies: replies.length > 0 ? replies : undefined,
      });
    }

    // Form link sent events
    for (const link of formLinks) {
      const fd = link.form_definitions as { name?: string } | null;
      const cc = link.crm_contacts as { first_name?: string; last_name?: string } | null;
      const contactLabel = cc
        ? [cc.first_name, cc.last_name].filter(Boolean).join(" ")
        : undefined;
      result.push({
        id: `form-link-${link.id}`,
        type: "form_link_sent",
        timestamp: link.created_at as string,
        author: { name: "System", initials: "SY" },
        title: `Application link sent: ${fd?.name ?? "Unknown Form"}`,
        description: contactLabel ? `To ${contactLabel}` : undefined,
        formName: fd?.name ?? "Unknown Form",
      });
    }

    // Form submission events (only completed submissions)
    for (const sub of formSubmissions) {
      const status = sub.status as string;
      if (status === "partial" || status === "pending_borrower") continue;

      const fd = sub.form_definitions as { name?: string } | null;
      const d = sub.data as Record<string, unknown> | null;
      const submitterName = (() => {
        if (!d) return (sub.submitted_by_email as string) ?? "Unknown";
        const first = ((d.borrower_first_name ?? d.first_name ?? "") as string);
        const last = ((d.borrower_last_name ?? d.last_name ?? "") as string);
        if (first || last) return `${first} ${last}`.trim();
        return (sub.submitted_by_email as string) ?? "Unknown";
      })();

      const statusTitles: Record<string, string> = {
        partial: "started",
        pending_borrower: "is in progress on",
        submitted: "submitted",
        reviewed: "submitted",
        processed: "submitted",
      };
      const action = statusTitles[(sub.status as string)] ?? (sub.status as string);

      result.push({
        id: `form-sub-${sub.id}`,
        type: "form_submission",
        timestamp: (sub.status as string) === "submitted"
          ? ((sub.updated_at as string) ?? (sub.created_at as string))
          : (sub.created_at as string),
        author: { name: submitterName, initials: submitterName.slice(0, 2).toUpperCase() },
        title: `${submitterName} ${action} ${fd?.name ?? "form"}`,
        formName: fd?.name ?? "Unknown Form",
        formStatus: sub.status as string,
        formSubmitterName: submitterName,
      });
    }

    // Document generated events
    for (const doc of generatedDocs) {
      const authorId = doc.generated_by as string;
      const authorName = genDocProfiles[authorId] ?? "Unknown";
      const tmpl = doc.document_templates as { name?: string; template_type?: string } | null;
      const templateName = tmpl?.name ?? "document";

      result.push({
        id: `doc-gen-${doc.id}`,
        type: "document_generated",
        timestamp: doc.generated_at as string,
        author: {
          id: authorId,
          name: authorName,
          initials: authorName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??",
          accent_color: profileColors[authorId] ?? null,
        },
        title: `Generated ${templateName}`,
        description: doc.file_name as string,
        docTemplateName: templateName,
        docFileName: doc.file_name as string,
        docId: doc.id as string,
      });
    }

    // Deal messages (borrower-facing chat)
    for (const msg of dealMessages) {
      const senderName = (msg.sender_name as string) || "Unknown";
      result.push({
        id: `msg-${msg.id}`,
        type: "message",
        timestamp: msg.created_at as string,
        author: {
          id: (msg.sender_id as string) ?? undefined,
          name: senderName,
          initials: getInitials(senderName),
          accent_color: profileColors[(msg.sender_id as string)] ?? null,
        },
        description: msg.body as string,
        messageSenderType: msg.sender_type as "admin" | "borrower" | "system",
        messageSource: msg.source as "portal" | "email" | "sms",
      });
    }

    // Sort ascending (oldest first, newest at bottom)
    result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Group rapid system events
    return groupSystemEvents(result);
  }, [dealActivities, crmActivities, crmEmails, topNotes, repliesByParent, formLinks, formSubmissions, generatedDocs, genDocProfiles, dealMessages, profileColors]);

  // ── Filter counts ──

  const filterCounts = useMemo<StreamFilterCounts>(() => {
    const c: StreamFilterCounts = { all: 0, notes: 0, emails: 0, calls: 0, messages: 0, system: 0 };
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
    return streamItems.filter((item) => mapToFilterType(item.type) === activeFilter);
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
        deal_id: dealId,
        mentions: mentionIds.length > 0 ? mentionIds : [],
      };

      const { data, error } = await supabase
        .from("notes" as never)
        .insert(row as never)
        .select()
        .single();

      if (error) {
        setAllNotes((prev) => prev.filter((n) => n.id !== optimisticNote.id));
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
    [currentUserId, currentUserName, dealId, supabase]
  );

  // ── Send deal message (borrower-visible) ──

  const sendMessage = useCallback(
    async (body: string) => {
      const optimisticMsg: Record<string, unknown> = {
        id: `temp-msg-${Date.now()}`,
        deal_id: dealId,
        sender_type: "admin",
        sender_id: currentUserId,
        contact_id: null,
        source: "portal",
        body,
        metadata: null,
        created_at: new Date().toISOString(),
        sender_name: currentUserName,
      };
      setDealMessages((prev) => [...prev, optimisticMsg]);

      try {
        const res = await fetch("/api/deal-messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, body }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message");
        }

        showSuccess("Message sent");
        fetchStream(true);
      } catch (err) {
        setDealMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        showError("Could not send message", err instanceof Error ? err.message : "Unknown error");
      }
    },
    [dealId, currentUserId, currentUserName, fetchStream]
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
        deal_id: dealId,
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
        const real = { ...(data as unknown as NoteData), note_likes: [], note_attachments: [] };
        setAllNotes((prev) => [real, ...prev]);
      }
    },
    [currentUserId, currentUserName, dealId, supabase]
  );

  const editNote = useCallback(
    async (noteId: string, body: string, mentionIds: string[]) => {
      // Optimistic
      setAllNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, body, mentions: mentionIds, is_edited: true, edited_at: new Date().toISOString() }
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
      // Optimistic
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
      // Optimistic
      setAllNotes((prev) =>
        prev.map((n) => {
          if (n.id !== noteId) return n;
          const likes = isCurrentlyLiked
            ? n.note_likes.filter((l) => l.user_id !== currentUserId)
            : [...n.note_likes, { user_id: currentUserId, profiles: { full_name: currentUserName } }];
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
          .update({ is_pinned: false, pinned_by: null, pinned_at: null } as never)
          .eq("deal_id" as never, dealId as never)
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
    [supabase, dealId, currentUserId]
  );

  // ── Toggle task ──

  const toggleTask = useCallback(
    async (taskId: string, currentStatus: string) => {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      const { error } = await supabase
        .from("unified_deal_tasks" as never)
        .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
        .eq("id" as never, taskId as never);

      if (error) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t))
        );
        return { error: error.message };
      }

      return { success: true };
    },
    [supabase]
  );

  // ── Update condition status (optimistic) ──

  const updateConditionStatus = useCallback(
    (conditionId: string, newStatus: string) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === conditionId ? { ...c, status: newStatus } : c))
      );
    },
    []
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
    sendMessage,
    editNote,
    deleteNote,
    toggleLike,
    pinNote,

    // Rail
    conditions,
    conditionDocs,
    conditionProfiles,
    tasks,
    railLoading,
    toggleTask,
    updateConditionStatus,
    refetchRail: fetchRail,
  };
}
