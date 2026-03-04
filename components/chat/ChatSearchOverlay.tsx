"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatAvatar } from "./ChatAvatar";
import { formatMessageTime } from "@/lib/chat-utils";
import type { ChatMessageWithSender } from "@/lib/chat-types";
import { Search, X, Loader2 } from "lucide-react";

interface ChatSearchOverlayProps {
  channelId: string;
  onClose: () => void;
  onNavigateToMessage: (messageId: string) => void;
}

export function ChatSearchOverlay({
  channelId,
  onClose,
  onNavigateToMessage,
}: ChatSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatMessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const supabase = supabaseRef.current;

      const tsQuery = searchQuery.trim().split(/\s+/).join(" & ");

      const { data } = await supabase
        .from("chat_messages")
        .select(
          "*, sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url, email)"
        )
        .eq("channel_id", channelId)
        .is("is_deleted", false)
        .textSearch("content", tsQuery)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setResults(data as unknown as ChatMessageWithSender[]);
      }
      setLoading(false);
    },
    [channelId]
  );

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-40 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages in this channel..."
          className="flex-1 bg-transparent border-0 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.06)] text-muted-foreground flex-shrink-0 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {query.trim()
              ? "No messages found"
              : "Type to search messages..."}
          </div>
        ) : (
          <div className="py-2">
            {results.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  onNavigateToMessage(msg.id);
                  onClose();
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-200"
              >
                <ChatAvatar
                  src={msg.sender?.avatar_url}
                  name={msg.sender?.full_name}
                  size="message"
                  className="flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {msg.sender?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {msg.content}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
