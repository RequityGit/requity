"use client";

import { useState } from "react";
import { Send, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { T, DotPill, Av, Btn, fD, getInitials, type CommentData } from "../components";
import { postComment } from "../actions";

interface CommentsTabProps {
  comments: CommentData[];
  loanId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserInitials: string;
}

export function CommentsTab({
  comments,
  loanId,
  currentUserId,
  currentUserName,
  currentUserInitials,
}: CommentsTabProps) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const filtered = showAll ? comments : comments.filter((c) => !c.is_internal);

  const handlePost = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const result = await postComment(loanId, currentUserId, currentUserName, commentText.trim(), true);
      if (result.error) {
        console.error("Post comment error:", result.error);
      } else {
        setCommentText("");
        router.refresh();
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Compose box */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: T.bg.surface, border: `1px solid ${T.bg.border}` }}
      >
        <div className="flex gap-3">
          <Av text={currentUserInitials} size={32} />
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment... use @name to mention"
              className="box-border w-full resize-y rounded-lg p-3 text-[13px] outline-none"
              style={{
                minHeight: 72,
                backgroundColor: T.bg.input,
                border: `1px solid ${T.bg.border}`,
                color: T.text.primary,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock size={12} color={T.accent.amber} strokeWidth={1.5} />
                <span className="text-xs font-medium" style={{ color: T.accent.amber }}>
                  Internal Only
                </span>
              </div>
              <button
                onClick={handlePost}
                disabled={posting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg border-none px-3 py-1.5 text-xs font-medium cursor-pointer"
                style={{
                  backgroundColor: T.accent.blue,
                  color: "#fff",
                  opacity: posting || !commentText.trim() ? 0.5 : 1,
                }}
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
            className="cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium"
            style={{
              color: showAll === val ? "#FFF" : T.text.muted,
              background: showAll === val ? T.accent.blue : T.bg.surface,
              borderColor: showAll === val ? T.accent.blue : T.bg.border,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Comment list */}
      {filtered.length === 0 && (
        <div
          className="rounded-xl px-5 py-8 text-center text-sm"
          style={{ backgroundColor: T.bg.surface, border: `1px solid ${T.bg.border}`, color: T.text.muted }}
        >
          No comments yet.
        </div>
      )}
      {filtered.map((c) => {
        const initials = c.author_name ? getInitials(c.author_name) : "??";

        return (
          <div
            key={c.id}
            className="rounded-xl px-5 py-3.5"
            style={{
              backgroundColor: T.bg.surface,
              border: `1px solid ${c.is_internal ? T.accent.amber + "30" : T.bg.border}`,
            }}
          >
            <div className="flex gap-2.5">
              <Av text={initials} size={32} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: T.text.primary }}>
                    {c.author_name || "Unknown"}
                  </span>
                  <span className="text-[11px] num" style={{ color: T.text.muted }}>
                    {fD(c.created_at)}
                  </span>
                  {c.is_internal && <DotPill label="Internal" color={T.accent.amber} />}
                </div>
                <div className="mt-1.5 text-[13px] leading-relaxed" style={{ color: T.text.primary }}>
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
