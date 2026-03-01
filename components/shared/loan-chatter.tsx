"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MentionInput } from "@/components/shared/mention-input";
import { CommentRenderer } from "@/components/shared/comment-renderer";
import { useToast } from "@/components/ui/use-toast";
import { MessageCircle, Send, Lock, Pencil } from "lucide-react";

interface LoanComment {
  id: string;
  created_at: string;
  updated_at: string;
  loan_id: string;
  author_id: string;
  author_name: string | null;
  comment: string;
  mentions: string[] | null;
  is_internal: boolean;
  is_edited: boolean;
  edited_at: string | null;
  parent_comment_id: string | null;
}

interface LoanChatterProps {
  loanId: string;
  currentUserId: string;
  /** If true, user is admin and can toggle internal/external + see all comments */
  isAdmin: boolean;
}

export function LoanChatter({
  loanId,
  currentUserId,
  isAdmin,
}: LoanChatterProps) {
  const [comments, setComments] = useState<LoanComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { toast } = useToast();

  const loadComments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("loan_comments")
      .select("*")
      .eq("loan_id", loanId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading comments:", error);
    } else {
      setComments(data ?? []);
    }
    setLoading(false);
  }, [loanId]);

  // Initial load
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`loan-comments-${loanId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loan_comments",
          filter: `loan_id=eq.${loanId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => {
              // Avoid duplicates from optimistic updates
              if (prev.some((c) => c.id === (payload.new as LoanComment).id)) {
                return prev;
              }
              return [...prev, payload.new as LoanComment];
            });
          } else if (payload.eventType === "UPDATE") {
            setComments((prev) =>
              prev.map((c) =>
                c.id === (payload.new as LoanComment).id
                  ? (payload.new as LoanComment)
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
  }, [loanId]);

  async function handleSubmit(text: string, mentionIds: string[]) {
    setPosting(true);
    const supabase = createClient();

    // Fetch author name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", currentUserId)
      .single();
    const authorName = profile?.full_name ?? "Team";

    const { data, error } = await (supabase as any)
      .from("loan_comments")
      .insert({
        loan_id: loanId,
        author_id: currentUserId,
        author_name: authorName,
        comment: text,
        mentions: mentionIds.length > 0 ? mentionIds : [],
        is_internal: isAdmin ? isInternal : false,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      // Optimistic: add immediately (realtime will de-dup)
      setComments((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [...prev, data]
      );
      setCommentText("");
      toast({ title: isInternal ? "Internal note added" : "Comment posted" });
    }
    setPosting(false);
  }

  async function handleEdit(commentId: string, text: string, mentionIds: string[]) {
    const supabase = createClient();
    const { error } = await (supabase as any)
      .from("loan_comments")
      .update({
        comment: text,
        mentions: mentionIds.length > 0 ? mentionIds : [],
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) {
      toast({
        title: "Error updating comment",
        description: error.message,
        variant: "destructive",
      });
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
      toast({ title: "Comment updated" });
    }
  }

  // Separate top-level comments and replies
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const replies = comments.filter((c) => c.parent_comment_id);

  function getReplies(parentId: string) {
    return replies.filter((r) => r.parent_comment_id === parentId);
  }

  return (
    <Card>
      <CardHeader className="pb-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-[#1a2b4a]" />
          <CardTitle className="text-sm">
            Loan Comments
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {comments.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Comments thread */}
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading comments...</p>
        ) : topLevel.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No comments yet. Start the conversation.
          </p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {topLevel.map((c) => (
              <div key={c.id}>
                {editingId === c.id ? (
                  <div className="space-y-2 border rounded-md p-2 bg-slate-50">
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
                  <CommentRenderer
                    comment={c.comment}
                    authorName={c.author_name}
                    isInternal={c.is_internal}
                    isEdited={c.is_edited}
                    createdAt={c.created_at}
                    isOwnComment={c.author_id === currentUserId}
                    actions={
                      c.author_id === currentUserId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditText(c.comment);
                          }}
                          className="text-muted-foreground hover:text-foreground ml-1"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      ) : undefined
                    }
                  />
                )}
                {/* Replies */}
                {getReplies(c.id).length > 0 && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                    {getReplies(c.id).map((r) => (
                      <CommentRenderer
                        key={r.id}
                        comment={r.comment}
                        authorName={r.author_name}
                        isInternal={r.is_internal}
                        isEdited={r.is_edited}
                        createdAt={r.created_at}
                        isOwnComment={r.author_id === currentUserId}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New comment input */}
        <div className="border-t pt-3">
          <MentionInput
            value={commentText}
            onChange={setCommentText}
            onSubmit={handleSubmit}
            placeholder={
              isAdmin
                ? "Add a comment... (type @ to mention)"
                : "Ask a question or add a note..."
            }
            disabled={posting}
            submitLabel={posting ? "Posting..." : "Post"}
            submitIcon={<Send className="h-3 w-3" />}
            rows={2}
            extraControls={
              isAdmin ? (
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 h-3 w-3"
                  />
                  <Lock className="h-3 w-3 text-amber-600" />
                  Internal only
                </label>
              ) : undefined
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
