"use client";

import { useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { formatDateSeparator, isSameDay } from "@/lib/chat-utils";
import type { ChatMessageWithSender, PresenceStatus } from "@/lib/chat-types";
import { Loader2, MessageSquare } from "lucide-react";

interface MessageListProps {
  messages: ChatMessageWithSender[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId?: string;
  channelId?: string;
  getPresenceStatus: (uid: string) => PresenceStatus;
  onThreadClick?: (messageId: string) => void;
}

export function MessageList({
  messages,
  loading,
  hasMore,
  onLoadMore,
  currentUserId,
  channelId,
  getPresenceStatus,
  onThreadClick,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isAtBottomRef = useRef(true);

  // Track if user is at bottom
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  // Scroll to bottom on new messages if user was at bottom
  useEffect(() => {
    if (
      messages.length > prevMessageCountRef.current &&
      isAtBottomRef.current
    ) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Infinite scroll: load more on scroll to top
  const handleScrollTop = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-foreground" />
        </div>
        <div className="font-semibold text-lg font-medium text-foreground">
          No messages yet
        </div>
        <div className="text-sm text-muted-foreground mt-1 mb-4">
          Start the conversation
        </div>
        <button
          className="px-4 py-2 rounded-lg bg-primary text-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200"
          onClick={() => {
            const composer = document.querySelector<HTMLTextAreaElement>(
              'textarea[placeholder="Type a message..."]'
            );
            if (composer) {
              composer.scrollIntoView({ behavior: "smooth", block: "center" });
              composer.focus();
            }
          }}
        >
          Send a message
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-secondary"
      onScroll={() => {
        handleScroll();
        handleScrollTop();
      }}
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center py-3">
          <button
            onClick={onLoadMore}
            className="text-xs text-primary hover:text-primary/80 transition-colors duration-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Load older messages"
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="py-2">
        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const showDateSep =
            !prev || !isSameDay(prev.created_at, msg.created_at);
          const showAvatar =
            !prev ||
            prev.sender_id !== msg.sender_id ||
            showDateSep ||
            new Date(msg.created_at).getTime() -
              new Date(prev.created_at).getTime() >
              5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>
              )}
              <MessageBubble
                message={msg}
                isOwn={msg.sender_id === currentUserId}
                showAvatar={showAvatar}
                getPresenceStatus={getPresenceStatus}
                onThreadClick={onThreadClick}
                currentUserId={currentUserId}
                channelId={channelId}
              />
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
