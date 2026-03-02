"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatMessageTime } from "@/lib/chat-utils";
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

  // Keyboard shortcut: Escape to close
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

      // Use full-text search on chat_messages
      const tsQuery = searchQuery
        .trim()
        .split(/\s+/)
        .join(" & ");

      const { data } = await supabase
        .from("chat_messages" as never)
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-40 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
        <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages in this channel..."
          className="border-0 shadow-none focus-visible:ring-0 text-base"
        />
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 flex-shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
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
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {msg.sender?.avatar_url && (
                    <AvatarImage src={msg.sender.avatar_url} />
                  )}
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(msg.sender?.full_name || null)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {msg.sender?.full_name || "Unknown"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mt-0.5 line-clamp-2">
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
