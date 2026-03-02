"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { createClient } from "@/lib/supabase/client";
import type { MentionSuggestion, LinkedEntity } from "@/lib/chat-types";
import { useMentions } from "@/hooks/useMentions";
import { Send, Paperclip, Smile } from "lucide-react";

interface MessageInputProps {
  channelId: string;
  userId: string;
  onTyping: () => void;
  onStopTyping: () => void;
  parentMessageId?: string | null;
  placeholder?: string;
}

export function MessageInput({
  channelId,
  userId,
  onTyping,
  onStopTyping,
  parentMessageId = null,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, searchMentions, clearSuggestions } = useMentions(channelId);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  }, [content]);

  const handleChange = (value: string) => {
    setContent(value);
    onTyping();

    // Check for @mention trigger
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setSelectedMentionIndex(0);
      searchMentions(query);
    } else {
      setMentionQuery(null);
      clearSuggestions();
    }
  };

  const insertMention = useCallback(
    (suggestion: MentionSuggestion) => {
      const cursorPos = textareaRef.current?.selectionStart ?? content.length;
      const textBeforeCursor = content.slice(0, cursorPos);
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const beforeMention = textBeforeCursor.slice(
          0,
          mentionMatch.index
        );
        const afterCursor = content.slice(cursorPos);
        const mentionText =
          suggestion.type === "everyone"
            ? "@everyone"
            : `@${suggestion.label}`;
        const newContent = beforeMention + mentionText + " " + afterCursor;
        setContent(newContent);
      }

      setMentionQuery(null);
      clearSuggestions();
      textareaRef.current?.focus();
    },
    [content, clearSuggestions]
  );

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    onStopTyping();

    const supabase = createClient();

    // Extract linked entities from mention patterns
    const linkedEntities: LinkedEntity[] = [];
    const entityMentionRegex = /@(LN-\S+)/g;
    let match;
    while ((match = entityMentionRegex.exec(trimmed)) !== null) {
      const { data: loan } = await supabase
        .from("loans")
        .select("id, loan_number")
        .eq("loan_number", match[1])
        .single();
      if (loan) {
        linkedEntities.push({
          type: "loan",
          id: loan.id,
          label: loan.loan_number || match[1],
        });
      }
    }

    // Extract user mentions for chat_mentions table
    const mentionUserIds: string[] = [];
    let isEveryoneMention = false;
    if (trimmed.includes("@everyone")) {
      isEveryoneMention = true;
    }

    const { error } = await supabase.from("chat_messages" as never).insert({
      channel_id: channelId,
      sender_id: userId,
      message_type: "text" as const,
      content: trimmed,
      parent_message_id: parentMessageId,
      linked_entities: linkedEntities.length > 0 ? linkedEntities : [],
      attachments: [],
      reactions: {},
    } as never);

    if (error) {
      console.error("Error sending message:", error);
      setSending(false);
      return;
    }

    setContent("");
    setSending(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention navigation
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedMentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        clearSuggestions();
        return;
      }
    }

    // Send on Enter (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative border-t border-slate-200 bg-white px-4 py-3">
      {/* Mention autocomplete */}
      {mentionQuery !== null && suggestions.length > 0 && (
        <MentionAutocomplete
          suggestions={suggestions}
          selectedIndex={selectedMentionIndex}
          onSelect={insertMention}
        />
      )}

      <div className="flex items-end gap-2">
        <button
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Delay to allow click on mention suggestion
              setTimeout(() => {
                setMentionQuery(null);
                clearSuggestions();
              }, 200);
            }}
            placeholder={placeholder}
            rows={1}
            className="w-full resize-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
            disabled={sending}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className={cn(
            "p-2 rounded-lg transition-colors flex-shrink-0",
            content.trim()
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-slate-100 text-slate-400"
          )}
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-4 mt-1.5 px-1 text-xs text-slate-400">
        <span>
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">Enter</kbd> to send,{" "}
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">Shift+Enter</kbd> for newline
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">@</kbd> to mention
        </span>
      </div>
    </div>
  );
}
