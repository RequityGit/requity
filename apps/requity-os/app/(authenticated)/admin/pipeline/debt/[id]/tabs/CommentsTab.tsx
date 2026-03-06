"use client";

import { useState } from "react";
import { Send, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { DotPill, Av, fD, getInitials, type CommentData } from "../components";
import { postComment } from "../actions";

interface CommentsTabProps {
  comments: CommentData[];
  loanId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserInitials: string;
  isOpportunity?: boolean;
}

export function CommentsTab({
  comments,
  loanId,
  currentUserId,
  currentUserName,
  currentUserInitials,
  isOpportunity = false,
}: CommentsTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const filtered = showAll ? comments : comments.filter((c) => !c.is_internal);

  const handlePost = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const result = await postComment(loanId, currentUserId, currentUserName, commentText.trim(), true, isOpportunity);
      if (result.error) {
        toast({ title: "Failed to post comment", description: result.error, variant: "destructive" });
      } else {
        setCommentText("");
        router.refresh();
      }
    } catch {
      toast({ title: "Failed to post comment", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Compose box */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex gap-3">
          <Av text={currentUserInitials} size={32} />
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment... use @name to mention"
              className="box-border w-full resize-y rounded-lg border border-border bg-muted p-3 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
              style={{ minHeight: 72 }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-amber-500" strokeWidth={1.5} />
                <span className="text-xs font-medium text-amber-500">
                  Internal Only
                </span>
              </div>
              <button
                onClick={handlePost}
                disabled={posting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border-none bg-blue-500 px-3 py-1.5 text-xs font-medium text-white cursor-pointer disabled:opacity-50"
              >
                {posting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} strokeWidth={1.5} />
                )}
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { val: true, label: "All" },
          { val: false, label: "External Only" },
        ].map(({ val, label }) => (
          <button
            key={label}
            onClick={() => setShowAll(val)}
            className={`cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              showAll === val
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Comment list */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No comments yet.
        </div>
      )}
      {filtered.map((c) => {
        const initials = c.author_name ? getInitials(c.author_name) : "??";

        return (
          <div
            key={c.id}
            className={`rounded-xl border px-5 py-3.5 bg-card ${
              c.is_internal ? "border-amber-500/20" : "border-border"
            }`}
          >
            <div className="flex gap-2.5">
              <Av text={initials} size={32} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-foreground">
                    {c.author_name || "Unknown"}
                  </span>
                  <span className="text-[11px] num text-muted-foreground">
                    {fD(c.created_at)}
                  </span>
                  {c.is_internal && <DotPill label="Internal" color="#f59e0b" />}
                </div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-foreground">
                  {c.comment}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
