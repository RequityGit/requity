"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageInput } from "./MessageInput";
import { formatMessageTime, getInitials } from "@/lib/chat-utils";
import type { ChatMessageWithSender, PresenceStatus } from "@/lib/chat-types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Loader2 } from "lucide-react";

interface ThreadPanelProps {
  parentMessageId: string;
  channelId: string;
  userId: string;
  getPresenceStatus: (uid: string) => PresenceStatus;
  onClose: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function ThreadPanel({
  parentMessageId,
  channelId,
  userId,
  getPresenceStatus,
  onClose,
  onTyping,
  onStopTyping,
}: ThreadPanelProps) {
  const [parentMessage, setParentMessage] = useState<ChatMessageWithSender | null>(null);
  const [replies, setReplies] = useState<ChatMessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef(createClient());

  // Fetch parent message and replies
  const fetchThread = useCallback(async () => {
    const supabase = supabaseRef.current;

    // Fetch parent
    const { data: parent } = await supabase
      .from("chat_messages")
      .select(
        "*, sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url, email)"
      )
      .eq("id", parentMessageId)
      .single();

    if (parent) {
      setParentMessage(parent as unknown as ChatMessageWithSender);
    }

    // Fetch replies
    const { data: replyData } = await supabase
      .from("chat_messages")
      .select(
        "*, sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url, email)"
      )
      .eq("parent_message_id", parentMessageId)
      .is("is_deleted", false)
      .order("created_at", { ascending: true });

    if (replyData) {
      setReplies(replyData as unknown as ChatMessageWithSender[]);
    }
    setLoading(false);
  }, [parentMessageId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  // Scroll to bottom on new replies
  useEffect(() => {
    if (replies.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies.length]);

  // Realtime subscription for thread replies
  useEffect(() => {
    const supabase = supabaseRef.current;

    const sub = supabase
      .channel(`thread-${parentMessageId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `parent_message_id=eq.${parentMessageId}`,
        },
        async (payload) => {
          const newReply = payload.new as ChatMessageWithSender;
          if (newReply.sender_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, email")
              .eq("id", newReply.sender_id)
              .single();
            if (profile) {
              newReply.sender = profile;
            }
          }
          setReplies((prev) => {
            if (prev.some((r) => r.id === newReply.id)) return prev;
            return [...prev, newReply];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [parentMessageId]);

  return (
    <div className="w-96 h-full border-l border-slate-200 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Thread</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Parent message */}
          {parentMessage && (
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar className="h-7 w-7">
                  {parentMessage.sender?.avatar_url && (
                    <AvatarImage src={parentMessage.sender.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(parentMessage.sender?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-slate-900">
                  {parentMessage.sender?.full_name || "Unknown"}
                </span>
                <span className="text-xs text-slate-400">
                  {formatMessageTime(parentMessage.created_at)}
                </span>
              </div>
              <div className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {parentMessage.content || ""}
                </ReactMarkdown>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </div>
            </div>
          )}

          {/* Replies */}
          <div className="flex-1 overflow-y-auto py-2">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5 px-4 py-1.5">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  {reply.sender?.avatar_url && (
                    <AvatarImage src={reply.sender.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(reply.sender?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-slate-900">
                      {reply.sender?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatMessageTime(reply.created_at)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {reply.content || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Thread input */}
          <MessageInput
            channelId={channelId}
            userId={userId}
            parentMessageId={parentMessageId}
            onTyping={onTyping}
            onStopTyping={onStopTyping}
            placeholder="Reply in thread..."
          />
        </>
      )}
    </div>
  );
}
