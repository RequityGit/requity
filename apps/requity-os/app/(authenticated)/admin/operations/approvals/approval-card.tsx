"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Landmark,
  FileText,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Send,
} from "lucide-react";
import { relativeTime, parseComment } from "@/lib/comment-utils";
import { MentionInput } from "@/components/shared/mention-input";
import type { EnrichedApproval, Profile } from "./approvals-card-view";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  changes_requested: {
    label: "Changes Requested",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
};

const ENTITY_ICONS: Record<string, { icon: typeof Building2; color: string }> = {
  loan: { icon: Building2, color: "text-blue-400" },
  draw_request: { icon: FileText, color: "text-amber-400" },
  borrower: { icon: Users, color: "text-purple-400" },
  investor: { icon: Users, color: "text-purple-400" },
  fund: { icon: Landmark, color: "text-amber-400" },
  exception: { icon: FileText, color: "text-orange-400" },
  payoff: { icon: FileText, color: "text-green-400" },
  opportunity: { icon: Building2, color: "text-blue-400" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatContextKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ApprovalCommentData {
  id: string;
  author_id: string | null;
  author_name: string | null;
  comment: string;
  likes: string[];
  created_at: string;
}

interface ApprovalCardProps {
  approval: EnrichedApproval;
  profiles: Profile[];
  currentUserId: string;
  isSuperAdmin: boolean;
  onAction: (approvalId: string, status: string, notes: string) => void;
}

export function ApprovalCard({
  approval,
  profiles,
  currentUserId,
  isSuperAdmin,
  onAction,
}: ApprovalCardProps) {
  const [actionComment, setActionComment] = useState("");
  const [comments, setComments] = useState<ApprovalCommentData[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const { toast } = useToast();
  const isPending = approval.status === "pending";

  const statusConfig = STATUS_CONFIG[approval.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const entityConfig = ENTITY_ICONS[approval.entity_type];

  // Load comments
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("approval_comments" as never)
      .select("*" as never)
      .eq("approval_id" as never, approval.id as never)
      .order("created_at" as never, { ascending: true })
      .then(({ data }) => {
        if (data) setComments(data as unknown as ApprovalCommentData[]);
      });
  }, [approval.id]);

  // Realtime for comments
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`approval-comments-${approval.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "approval_comments",
          filter: `approval_id=eq.${approval.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => {
              if (prev.some((c) => c.id === (payload.new as ApprovalCommentData).id)) return prev;
              return [...prev, payload.new as ApprovalCommentData];
            });
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((c) =>
                c.id === (payload.new as ApprovalCommentData).id
                  ? (payload.new as ApprovalCommentData)
                  : c
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
  }, [approval.id]);

  const handlePostComment = useCallback(
    async (text: string, mentionIds: string[]) => {
      if (!text.trim()) return;
      setPosting(true);
      const supabase = createClient();

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", currentUserId)
        .single();

      const { data, error } = await supabase
        .from("approval_comments" as never)
        .insert({
          approval_id: approval.id,
          author_id: currentUserId,
          author_name: profile?.full_name ?? "Team",
          comment: text,
          mentions: mentionIds.length > 0 ? mentionIds : [],
          likes: [],
        } as never)
        .select()
        .single();

      if (error) {
        toast({
          title: "Failed to post comment",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setComments((prev) =>
          prev.some((c) => c.id === (data as unknown as ApprovalCommentData).id)
            ? prev
            : [...prev, data as unknown as ApprovalCommentData]
        );
        setCommentText("");
      }
      setPosting(false);
    },
    [approval.id, currentUserId, toast]
  );

  const handleToggleLike = useCallback(
    async (commentId: string) => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const likes = comment.likes ?? [];
      const newLikes = likes.includes(currentUserId)
        ? likes.filter((l) => l !== currentUserId)
        : [...likes, currentUserId];

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: newLikes } : c
        )
      );

      const supabase = createClient();
      await supabase
        .from("approval_comments" as never)
        .update({ likes: newLikes } as never)
        .eq("id" as never, commentId as never);
    },
    [comments, currentUserId]
  );

  const snapshot = approval.deal_snapshot;
  const hasContext = snapshot && Object.keys(snapshot).length > 0;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Main content */}
      <div className="p-4 md:p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold leading-snug mb-1">
              {approval.submission_notes
                ? `${approval.entity_type.replace(/_/g, " ")} — ${approval.submission_notes.slice(0, 80)}`
                : `${approval.entity_type.replace(/_/g, " ")} approval`}
            </div>
            {approval.submission_notes && (
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                {approval.submission_notes}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] flex-shrink-0",
              statusConfig.color,
              statusConfig.bg,
              statusConfig.border
            )}
          >
            <StatusIcon className="h-[11px] w-[11px] mr-1" strokeWidth={2} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Entity tag */}
        {entityConfig && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium bg-secondary rounded px-1.5 py-0.5",
              entityConfig.color
            )}
          >
            <entityConfig.icon
              className="h-[11px] w-[11px]"
              strokeWidth={1.5}
            />
            {approval.entity_type.replace(/_/g, " ")}
          </span>
        )}

        {/* Context snapshot (only for pending) */}
        {hasContext && isPending && (
          <div className="bg-secondary rounded-md p-3 flex gap-4 flex-wrap">
            {Object.entries(snapshot).map(([key, value]) => (
              <div key={key} className="min-w-[80px]">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {formatContextKey(key)}
                </div>
                <div className="text-[13px] font-semibold num">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* People row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-semibold">
              {getInitials(approval.submitter_name)}
            </div>
            <span className="text-[12px] text-muted-foreground">
              by{" "}
              <span className="font-semibold text-foreground">
                {approval.submitter_name}
              </span>
            </span>
          </div>
          <span className="text-muted-foreground/50 text-[10px]">
            {"\u00B7"}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-semibold">
              {getInitials(approval.approver_name)}
            </div>
            <span className="text-[12px] text-muted-foreground">
              for{" "}
              <span className="font-semibold text-foreground">
                {approval.approver_name}
              </span>
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground num ml-auto">
            <Calendar
              className="h-[11px] w-[11px] inline mr-1"
              strokeWidth={1.5}
            />
            {new Date(approval.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Comment thread */}
      <div className="px-4 md:px-5 py-3 border-t border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <MessageSquare
            className="h-3 w-3 text-muted-foreground"
            strokeWidth={1.5}
          />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Activity ({comments.length})
          </span>
        </div>

        {comments.length > 0 && (
          <div className="border border-border rounded-md overflow-hidden mb-3 max-h-[300px] overflow-y-auto">
            {comments.map((c, i) => {
              const myLike = c.likes?.includes(currentUserId);
              const likeCount = c.likes?.length ?? 0;
              const segments = parseComment(c.comment);
              return (
                <div
                  key={c.id}
                  className={cn(
                    "px-3.5 py-3 bg-secondary",
                    i < comments.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-[22px] h-[22px] rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-semibold">
                      {getInitials(c.author_name ?? "?")}
                    </div>
                    <span className="text-[12px] font-semibold">
                      {c.author_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground/60 ml-auto num">
                      {c.created_at ? relativeTime(c.created_at) : ""}
                    </span>
                  </div>
                  <div className="text-[13px] leading-relaxed pl-[30px]">
                    {segments.map((seg, idx) =>
                      seg.type === "mention" ? (
                        <span
                          key={idx}
                          className="inline-flex items-center font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded px-1 mx-0.5 text-[12px]"
                        >
                          @{seg.value}
                        </span>
                      ) : (
                        <span key={idx}>{seg.value}</span>
                      )
                    )}
                  </div>
                  <div className="pl-[30px] mt-1.5">
                    <button
                      onClick={() => handleToggleLike(c.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors",
                        myLike
                          ? "border-blue-400/30 bg-blue-400/10 text-blue-400"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ThumbsUp
                        className="h-3 w-3"
                        strokeWidth={1.5}
                        fill={myLike ? "currentColor" : "none"}
                      />
                      {likeCount > 0 && (
                        <span className="num">{likeCount}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New comment */}
        <MentionInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handlePostComment}
          placeholder="Add a comment... (type @ to mention)"
          disabled={posting}
          submitLabel={posting ? "..." : "Post"}
          submitIcon={<Send className="h-3 w-3" />}
          rows={1}
        />
      </div>

      {/* Action bar (pending only) */}
      {isPending && (
        <div className="px-4 md:px-5 py-3 border-t border-border bg-secondary flex items-center gap-2">
          <Input
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            placeholder="Decision comment..."
            className="flex-1 h-8 text-[12px] bg-card"
          />
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-400/30 hover:bg-red-400/10 hover:text-red-400"
            onClick={() => {
              onAction(approval.id, "declined", actionComment);
              setActionComment("");
            }}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
            Reject
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              onAction(approval.id, "approved", actionComment);
              setActionComment("");
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
            Approve
          </Button>
        </div>
      )}

      {/* Decision notes for decided approvals */}
      {!isPending && approval.decision_notes && (
        <div className="px-4 md:px-5 py-3 border-t border-border">
          <div
            className={cn(
              "text-[12px] text-muted-foreground italic bg-muted px-3 py-2 rounded-md border-l-[3px]",
              approval.status === "approved"
                ? "border-l-green-500"
                : "border-l-red-400"
            )}
          >
            {approval.decision_notes}
          </div>
        </div>
      )}
    </div>
  );
}
