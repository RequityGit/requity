"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteComposer } from "@/components/shared/UnifiedNotes/NoteComposer";
import type { UploadedAttachment } from "@/components/shared/attachments";
import { showError } from "@/lib/toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { relativeTime } from "@/lib/comment-utils";
import { parseComment } from "@/lib/comment-utils";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";

interface ConditionPreviewCardProps {
  notification: Notification;
  activeRole: string;
  onNavigate: () => void;
  currentUserId: string;
  currentUserName: string;
}

interface ConditionData {
  id: string;
  condition_name: string;
  status: string;
  deal_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500",
  in_review: "bg-blue-500/10 text-blue-500",
  approved: "bg-emerald-500/10 text-emerald-500",
  waived: "bg-purple-500/10 text-purple-400",
  rejected: "bg-red-500/10 text-red-500",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    { bg: "bg-[#2a1f3d]", text: "text-[#a78bfa]" },
    { bg: "bg-[#1a3d2a]", text: "text-[#4ade80]" },
    { bg: "bg-[#3d2a1f]", text: "text-[#fb923c]" },
    { bg: "bg-[#1f2a3d]", text: "text-[#60a5fa]" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

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

export function ConditionPreviewCard({
  notification,
  activeRole,
  onNavigate,
  currentUserId,
  currentUserName,
}: ConditionPreviewCardProps) {
  const [condition, setCondition] = useState<ConditionData | null>(null);
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!notification.entity_id) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    // Fetch condition
    supabase
      .from("unified_deal_conditions" as never)
      .select("id, condition_name, status, deal_id" as never)
      .eq("id" as never, notification.entity_id as never)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setCondition(data as unknown as ConditionData);
        }
      });

    // Fetch condition notes
    supabase
      .from("notes" as never)
      .select(
        "*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never
      )
      .eq("unified_condition_id" as never, notification.entity_id as never)
      .is("deleted_at" as never, null)
      .order("created_at" as never, { ascending: true })
      .limit(10)
      .then(({ data, error }) => {
        if (!error && data) {
          setNotes(data as unknown as NoteData[]);
        }
        setLoading(false);
      });
  }, [notification.entity_id]);

  const handlePostReply = useCallback(
    async (
      body: string,
      isInternal: boolean,
      mentionIds: string[],
      attachments?: UploadedAttachment[]
    ) => {
      if (!notification.entity_id) return;

      const supabase = createClient();
      const { data: newNote, error } = await supabase
        .from("notes" as never)
        .insert({
          author_id: currentUserId,
          author_name: currentUserName,
          body,
          is_internal: isInternal,
          mentions: mentionIds,
          unified_condition_id: notification.entity_id,
          deal_id: condition?.deal_id ?? null,
        } as never)
        .select(
          "*, note_likes(user_id, profiles(full_name)), note_attachments(id, file_name, file_type, file_size_bytes, storage_path)" as never
        )
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
        setNotes((prev) => [...prev, newNote as unknown as NoteData]);
      }
    },
    [notification.entity_id, currentUserId, currentUserName, condition?.deal_id]
  );

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  }

  const statusColor =
    STATUS_COLORS[condition?.status ?? ""] ?? "bg-foreground/[0.06] text-muted-foreground";

  return (
    <div className="flex flex-col h-full">
      {/* Condition info */}
      <div className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          {condition?.condition_name ?? notification.title}
        </h3>
        <div className="flex items-center gap-2">
          {condition?.status && (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded",
                statusColor
              )}
            >
              {condition.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          )}
          {notification.entity_label && (
            <span className="text-[11px] text-muted-foreground">
              {notification.entity_label}
            </span>
          )}
        </div>

        <button
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground/[0.06] text-[11px] font-medium text-foreground hover:bg-foreground/10 rq-transition"
        >
          Go to Condition
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Condition notes thread */}
      {notes.length > 0 && (
        <div className="flex-1 overflow-y-auto border-t border-border px-5 py-3 space-y-0 min-h-0">
          <div className="text-[10px] text-muted-foreground/50 pb-2">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </div>
          {notes.map((note) => {
            const authorName = note.author_name ?? "Unknown";
            const color = getAvatarColor(authorName);
            return (
              <div
                key={note.id}
                className="flex gap-2.5 py-2 border-t border-foreground/[0.03] first:border-t-0"
              >
                <Avatar className="h-6 w-6 rounded-md flex-shrink-0">
                  <AvatarFallback
                    className={cn(
                      "rounded-md text-[9px] font-semibold",
                      color.bg,
                      color.text
                    )}
                  >
                    {getInitials(authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[11px] font-semibold">
                      {authorName}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50">
                      {relativeTime(note.created_at)}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    <RenderBody body={note.body} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply composer */}
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
    </div>
  );
}
