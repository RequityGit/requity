"use client";

import { parseComment, relativeTime } from "@/lib/comment-utils";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommentRendererProps {
  comment: string;
  authorName: string | null;
  isInternal: boolean;
  isEdited: boolean;
  createdAt: string;
  isOwnComment?: boolean;
  /** Render an "edit" button or other actions */
  actions?: React.ReactNode;
}

export function CommentRenderer({
  comment,
  authorName,
  isInternal,
  isEdited,
  createdAt,
  isOwnComment,
  actions,
}: CommentRendererProps) {
  const segments = parseComment(comment);

  return (
    <div
      className={`rounded-md px-3 py-2 text-xs ${
        isInternal
          ? "bg-muted border border-border"
          : isOwnComment
            ? "bg-primary/5 border border-primary/10 ml-4"
            : "bg-card border"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {isInternal && <Lock className="h-3 w-3 text-amber-600" />}
        <span className="font-medium">
          {isOwnComment ? "You" : authorName ?? "Team"}
        </span>
        {isInternal && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1 py-0">
            Internal
          </Badge>
        )}
        {isEdited && (
          <span className="text-muted-foreground text-[10px]">(edited)</span>
        )}
        <span className="text-muted-foreground ml-auto">
          {relativeTime(createdAt)}
        </span>
        {actions}
      </div>
      <p className="text-muted-foreground whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.type === "mention" ? (
            <span
              key={i}
              className="inline-flex items-center font-semibold text-foreground bg-muted border border-border rounded px-1 mx-0.5"
            >
              @{seg.value}
            </span>
          ) : (
            <span key={i}>{seg.value}</span>
          )
        )}
      </p>
    </div>
  );
}
