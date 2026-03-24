"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Send,
  Loader2,
  ChevronUp,
  Shield,
  Mail,
  Smartphone,
  Monitor,
} from "lucide-react";
import { useDealMessages, type DealMessage } from "@/hooks/useDealMessages";
import { cn } from "@/lib/utils";

// ── Source badge icon ──

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case "email":
      return <Mail className="h-3 w-3" />;
    case "sms":
      return <Smartphone className="h-3 w-3" />;
    default:
      return <Monitor className="h-3 w-3" />;
  }
}

// ── Time formatting ──

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Date separator ──

function shouldShowDateSeparator(
  current: DealMessage,
  previous: DealMessage | undefined
): boolean {
  if (!previous) return true;
  const currentDate = new Date(current.created_at).toDateString();
  const previousDate = new Date(previous.created_at).toDateString();
  return currentDate !== previousDate;
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Main Component ──

interface DealMessagesPanelProps {
  dealId: string;
  currentUserId: string;
}

export function DealMessagesPanel({
  dealId,
  currentUserId,
}: DealMessagesPanelProps) {
  const { messages, loading, hasMore, sending, sendMessage, loadOlder } =
    useDealMessages({ dealId });

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-scroll to bottom on new messages if user is at bottom
  useEffect(() => {
    if (isAtBottom && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isAtBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [loading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const threshold = 100;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Messages</span>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Security disclaimer */}
      <div className="flex items-start gap-2 px-4 py-2 bg-muted/50 border-b text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Secure messaging channel. Do not share passwords, full SSNs, or bank
          login credentials here. Use the secure upload portal for sensitive
          documents.
        </span>
      </div>

      {/* Messages area */}
      <ScrollArea
        className="flex-1 px-4"
        onScrollCapture={handleScroll}
        ref={scrollRef}
      >
        {loading && messages.length === 0 ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Send a message to start a conversation with the borrower
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-1">
            {/* Load older button */}
            {hasMore && (
              <div className="flex justify-center pb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadOlder}
                  className="text-xs text-muted-foreground"
                >
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Load older messages
                </Button>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isAdmin = msg.sender_type === "admin";
              const isSystem = msg.sender_type === "system";
              const isOwnMessage = isAdmin && msg.sender_id === currentUserId;
              const showDateSep = shouldShowDateSeparator(
                msg,
                messages[idx - 1]
              );

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {isSystem ? (
                    // System messages: centered, muted
                    <div className="flex justify-center py-1.5">
                      <span className="text-xs text-muted-foreground italic px-3 py-1 bg-muted/50 rounded-full">
                        {msg.body}
                      </span>
                    </div>
                  ) : (
                    // User messages
                    <div
                      className={cn(
                        "flex items-start gap-2.5 py-1.5",
                        isOwnMessage && "flex-row-reverse"
                      )}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-[10px] font-medium",
                            isAdmin
                              ? "bg-primary/10 text-primary"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          )}
                        >
                          {getInitials(msg.sender_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={cn(
                          "max-w-[75%] space-y-0.5",
                          isOwnMessage && "items-end"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center gap-1.5",
                            isOwnMessage && "flex-row-reverse"
                          )}
                        >
                          <span className="text-xs font-medium">
                            {msg.sender_name}
                          </span>
                          {msg.source !== "portal" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 h-4 gap-0.5"
                            >
                              <SourceIcon source={msg.source} />
                              {msg.source}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatMessageTime(msg.created_at)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : isAdmin
                                ? "bg-muted"
                                : "bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30"
                          )}
                        >
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Compose area */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none text-sm"
            rows={1}
            disabled={sending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="shrink-0 h-10 w-10"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
