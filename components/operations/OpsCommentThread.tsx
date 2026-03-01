"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MentionInput } from "@/components/shared/mention-input";
import { parseComment, relativeTime } from "@/lib/comment-utils";
import { extractMentionIds } from "@/lib/comment-utils";
import { useToast } from "@/components/ui/use-toast";
import {
  MessageCircle,
  Send,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Types ----------

type TaskCommentType = "update" | "blocker" | "question" | "decision" | "handoff";
type ProjectCommentType = "update" | "blocker" | "question" | "decision" | "milestone";

interface OpsComment {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  author_id: string | null;
  author_name: string | null;
  comment: string;
  comment_type: string;
  mentions: string[] | null;
  is_edited: boolean;
  edited_at: string | null;
}

interface TaskComment extends OpsComment {
  task_id: string;
}

interface ProjectComment extends OpsComment {
  project_id: string;
}

// ---------- Badge config ----------

const TASK_COMMENT_TYPES: { value: TaskCommentType; label: string }[] = [
  { value: "update", label: "Update" },
  { value: "blocker", label: "Blocker" },
  { value: "question", label: "Question" },
  { value: "decision", label: "Decision" },
  { value: "handoff", label: "Handoff" },
];

const PROJECT_COMMENT_TYPES: { value: ProjectCommentType; label: string }[] = [
  { value: "update", label: "Update" },
  { value: "blocker", label: "Blocker" },
  { value: "question", label: "Question" },
  { value: "decision", label: "Decision" },
  { value: "milestone", label: "Milestone" },
];

const BADGE_COLORS: Record<string, string> = {
  update: "bg-gray-100 text-gray-700 border-gray-200",
  blocker: "bg-red-100 text-red-700 border-red-200",
  question: "bg-amber-100 text-amber-700 border-amber-200",
  decision: "bg-green-100 text-green-700 border-green-200",
  handoff: "bg-blue-100 text-blue-700 border-blue-200",
  milestone: "bg-purple-100 text-purple-700 border-purple-200",
};

function CommentTypeBadge({ type }: { type: string }) {
  const colors = BADGE_COLORS[type] ?? BADGE_COLORS.update;
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize", colors)}>
      {type}
    </Badge>
  );
}

// ---------- Single comment renderer ----------

function OpsCommentItem({
  comment,
  currentUserId,
  isSuperAdmin,
  onStartEdit,
  onDelete,
}: {
  comment: OpsComment;
  currentUserId: string;
  isSuperAdmin: boolean;
  onStartEdit: (comment: OpsComment) => void;
  onDelete: (commentId: string) => void;
}) {
  const segments = parseComment(comment.comment);
  const isOwn = comment.author_id === currentUserId;
  const initials = comment.author_name
    ? comment.author_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <div className="flex gap-2.5 group">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-[#1a2b4a] text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5">
        {initials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground">
            {isOwn ? "You" : comment.author_name ?? "Team"}
          </span>
          <CommentTypeBadge type={comment.comment_type} />
          {comment.is_edited && (
            <span className="text-muted-foreground text-[10px]">(edited)</span>
          )}
          <span className="text-muted-foreground text-[10px] ml-auto whitespace-nowrap">
            {comment.created_at ? relativeTime(comment.created_at) : ""}
          </span>

          {/* Actions (visible on hover) */}
          <div className="hidden group-hover:flex items-center gap-0.5">
            {isOwn && (
              <button
                type="button"
                onClick={() => onStartEdit(comment)}
                className="p-0.5 rounded hover:bg-slate-100 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="p-0.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-0.5 leading-relaxed">
          {segments.map((seg, i) =>
            seg.type === "mention" ? (
              <span
                key={i}
                className="inline-flex items-center font-semibold text-[#1a2b4a] bg-blue-50 border border-blue-200 rounded px-1 mx-0.5"
              >
                @{seg.value}
              </span>
            ) : (
              <span key={i}>{seg.value}</span>
            )
          )}
        </p>
      </div>
    </div>
  );
}

// ---------- Main component ----------

interface OpsCommentThreadProps {
  entityType: "task" | "project";
  entityId: string;
  currentUserId: string;
  isSuperAdmin: boolean;
}

export function OpsCommentThread({
  entityType,
  entityId,
  currentUserId,
  isSuperAdmin,
}: OpsCommentThreadProps) {
  const tableName = entityType === "task" ? "ops_task_comments" : "ops_project_comments";
  const fkColumn = entityType === "task" ? "task_id" : "project_id";
  const commentTypes = entityType === "task" ? TASK_COMMENT_TYPES : PROJECT_COMMENT_TYPES;

  const [comments, setComments] = useState<OpsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState<string>("update");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { toast } = useToast();

  // Load comments
  const loadComments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq(fkColumn, entityId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading comments:", error);
    } else {
      setComments((data as OpsComment[]) ?? []);
    }
    setLoading(false);
  }, [tableName, fkColumn, entityId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ops-comments-${entityType}-${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
          filter: `${fkColumn}=eq.${entityId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => {
              if (prev.some((c) => c.id === (payload.new as OpsComment).id)) return prev;
              return [payload.new as OpsComment, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((c) =>
                c.id === (payload.new as OpsComment).id ? (payload.new as OpsComment) : c
              )
            );
          } else if (payload.eventType === "DELETE") {
            setComments((prev) =>
              prev.filter((c) => c.id !== (payload.old as { id: string }).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, fkColumn, entityId, entityType]);

  // Submit new comment
  async function handleSubmit(text: string, mentionIds: string[]) {
    if (!text.trim()) return;
    setPosting(true);
    const supabase = createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", currentUserId)
      .single();
    const authorName = profile?.full_name ?? "Team";

    const insertPayload = {
      [fkColumn]: entityId,
      author_id: currentUserId,
      author_name: authorName,
      comment: text,
      comment_type: commentType,
      mentions: mentionIds.length > 0 ? mentionIds : [],
    };

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertPayload as any)
      .select()
      .single();

    if (error) {
      toast({ title: "Error posting comment", description: error.message, variant: "destructive" });
    } else if (data) {
      setComments((prev) =>
        prev.some((c) => c.id === (data as OpsComment).id) ? prev : [data as OpsComment, ...prev]
      );
      setCommentText("");
      setCommentType("update");

      // Create notifications for @mentioned users
      if (mentionIds.length > 0) {
        const entityLabel = entityType === "task" ? "task" : "project";
        const notifs = mentionIds
          .filter((uid) => uid !== currentUserId)
          .map((uid) => ({
            user_id: uid,
            title: `${authorName} mentioned you in a ${entityLabel} comment`,
            body: text.slice(0, 200),
            entity_type: entityType,
            entity_id: entityId,
            notification_slug: "ops_comment_mention",
            action_url: "/admin/operations",
          }));

        if (notifs.length > 0) {
          await supabase.from("notifications").insert(notifs);
        }
      }
    }
    setPosting(false);
  }

  // Edit comment
  async function handleEdit(commentId: string, text: string, mentionIds: string[]) {
    const supabase = createClient();
    const { error } = await supabase
      .from(tableName)
      .update({
        comment: text,
        mentions: mentionIds.length > 0 ? mentionIds : [],
      } as any)
      .eq("id", commentId);

    if (error) {
      toast({ title: "Error updating comment", description: error.message, variant: "destructive" });
    } else {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, comment: text, is_edited: true, edited_at: new Date().toISOString() }
            : c
        )
      );
      setEditingId(null);
      setEditText("");
    }
  }

  // Delete comment
  async function handleDelete(commentId: string) {
    const supabase = createClient();
    const { error } = await supabase.from(tableName).delete().eq("id", commentId);
    if (error) {
      toast({ title: "Error deleting comment", description: error.message, variant: "destructive" });
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-[#1a2b4a]" />
        <span className="text-sm font-semibold text-[#1a2b4a]">Comments</span>
        <Badge variant="secondary" className="text-xs">
          {comments.length}
        </Badge>
      </div>

      {/* New comment input */}
      <div className="space-y-2">
        <MentionInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmit}
          placeholder="Add a comment... (type @ to mention)"
          disabled={posting}
          submitLabel={posting ? "Posting..." : "Post"}
          submitIcon={<Send className="h-3 w-3" />}
          rows={2}
          extraControls={
            <div className="relative">
              <select
                value={commentType}
                onChange={(e) => setCommentType(e.target.value)}
                className="appearance-none text-xs border rounded-md pl-2 pr-6 py-1 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {commentTypes.map((ct) => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          }
        />
      </div>

      {/* Comments list */}
      {loading ? (
        <p className="text-xs text-muted-foreground py-2">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No comments yet. Start the conversation.
        </p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {comments.map((c) =>
            editingId === c.id ? (
              <div key={c.id} className="space-y-2 border rounded-md p-2 bg-slate-50 ml-9">
                <MentionInput
                  value={editText}
                  onChange={setEditText}
                  onSubmit={(text, ids) => handleEdit(c.id, text, ids)}
                  submitLabel="Save"
                  submitIcon={<Pencil className="h-3 w-3" />}
                  rows={2}
                  extraControls={
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  }
                />
              </div>
            ) : (
              <OpsCommentItem
                key={c.id}
                comment={c}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
                onStartEdit={(comment) => {
                  setEditingId(comment.id);
                  setEditText(comment.comment);
                }}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
