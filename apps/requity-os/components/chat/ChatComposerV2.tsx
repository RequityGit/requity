"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type KeyboardEvent,
} from "react";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { createClient } from "@/lib/supabase/client";
import type { MentionSuggestion, LinkedEntity } from "@/lib/chat-types";
import { useMentions } from "@/hooks/useMentions";
import { Send, Paperclip, Image, AtSign } from "lucide-react";

interface ChatComposerV2Props {
  channelId: string;
  channelName: string;
  userId: string;
  onTyping: () => void;
  onStopTyping: () => void;
  parentMessageId?: string | null;
}

export function ChatComposerV2({
  channelId,
  channelName,
  userId,
  onTyping,
  onStopTyping,
  parentMessageId = null,
}: ChatComposerV2Props) {
  const { mode, t } = useChatTheme();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { suggestions, searchMentions, clearSuggestions } =
    useMentions(channelId);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
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
      setMentionQuery(mentionMatch[1]);
      setSelectedMentionIndex(0);
      searchMentions(mentionMatch[1]);
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
        const beforeMention = textBeforeCursor.slice(0, mentionMatch.index);
        const afterCursor = content.slice(cursorPos);
        const mentionText =
          suggestion.type === "everyone"
            ? "@everyone"
            : `@${suggestion.label}`;
        setContent(beforeMention + mentionText + " " + afterCursor);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("chat_messages").insert({
      channel_id: channelId,
      sender_id: userId,
      message_type: "text",
      content: trimmed,
      parent_message_id: parentMessageId,
      linked_entities: linkedEntities.length > 0 ? linkedEntities : [],
      attachments: [],
      reactions: {},
    });

    if (error) {
      console.error("Error sending message:", error);
      setSending(false);
      return;
    }

    setContent("");
    setSending(false);
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

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = content.trim().length > 0;

  return (
    <div
      style={{
        padding: "8px 20px 14px",
        borderTop: `1px solid ${t.border}`,
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Mention autocomplete */}
      {mentionQuery !== null && suggestions.length > 0 && (
        <MentionAutocomplete
          suggestions={suggestions}
          selectedIndex={selectedMentionIndex}
          onSelect={insertMention}
        />
      )}

      {/* Composer wrapper */}
      <div
        ref={wrapRef}
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          background: t.composer,
          border: `1px solid ${isFocused
            ? mode === "dark"
              ? "rgba(255,255,255,0.16)"
              : "rgba(0,0,0,0.2)"
            : t.composerBorder
          }`,
          borderRadius: 12,
          padding: "4px 4px 4px 14px",
          transition: "all 0.2s",
          boxShadow: isFocused
            ? mode === "dark"
              ? "0 0 0 3px rgba(255,255,255,0.04)"
              : "0 0 0 3px rgba(0,0,0,0.04)"
            : t.shadow,
        }}
      >
        {/* Attachment icons */}
        <div style={{ display: "flex", gap: 1, paddingBottom: 6, paddingTop: 6 }}>
          {[Paperclip, Image, AtSign].map((Icon, i) => (
            <button
              key={i}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 5,
                borderRadius: 6,
                display: "flex",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = t.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={15} strokeWidth={1.5} color={t.textTertiary} />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: t.divider,
            flexShrink: 0,
            alignSelf: "center",
          }}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setTimeout(() => {
              setMentionQuery(null);
              clearSuggestions();
            }, 200);
          }}
          placeholder={`Message ${channelName}...`}
          rows={1}
          disabled={sending}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: t.text,
            fontSize: 14,
            resize: "none",
            fontFamily: "'Inter', sans-serif",
            outline: "none",
            padding: "8px 4px",
            lineHeight: "1.5",
            maxHeight: 120,
            minHeight: 22,
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!hasContent || sending}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            flexShrink: 0,
            marginBottom: 2,
            background: hasContent ? t.text : t.bgTertiary,
            border: "none",
            cursor: hasContent ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: hasContent
              ? mode === "dark"
                ? "0 2px 8px rgba(255,255,255,0.1)"
                : "0 2px 8px rgba(0,0,0,0.12)"
              : "none",
          }}
          onMouseEnter={(e) => {
            if (hasContent) e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <Send
            size={14}
            strokeWidth={2}
            color={
              hasContent
                ? mode === "dark"
                  ? "#0C0C0C"
                  : "#FFFFFF"
                : t.textMuted
            }
            style={{ marginLeft: 1 }}
          />
        </button>
      </div>

      {/* Keyboard hints */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 5,
          padding: "0 4px",
        }}
      >
        <span style={{ fontSize: 11, color: t.textMuted }}>
          <kbd
            style={{
              padding: "1px 4px",
              borderRadius: 3,
              background: t.kbd,
              border: `1px solid ${t.kbdBorder}`,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ↵
          </kbd>{" "}
          send
          <span style={{ margin: "0 6px", color: t.textMuted }}>·</span>
          <kbd
            style={{
              padding: "1px 4px",
              borderRadius: 3,
              background: t.kbd,
              border: `1px solid ${t.kbdBorder}`,
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ⇧↵
          </kbd>{" "}
          new line
        </span>
      </div>
    </div>
  );
}
