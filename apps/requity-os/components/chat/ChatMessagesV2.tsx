"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { ChatAvatarV2 } from "./ChatPrimitives";
import { formatMessageTime, formatDateSeparator, isSameDay, getInitials } from "@/lib/chat-utils";
import type { ChatMessageWithSender, PresenceStatus, TypingUser } from "@/lib/chat-types";
import {
  Smile,
  Reply,
  Bookmark,
  MoreHorizontal,
  FileText,
  MessageSquare,
  Check,
  CheckCheck,
  Loader2,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import type { ChatChannelWithUnread } from "@/lib/chat-types";

// ─── Deal Room Context Bar ────────────────────────────────────────────────────
interface DealRoomBarProps {
  channel: ChatChannelWithUnread;
  loanType?: string | null;
  loanId?: string | null;
}

export function DealRoomContextBar({ channel, loanType }: DealRoomBarProps) {
  const { t } = useChatTheme();
  if (channel.channel_type !== "deal_room") return null;

  return (
    <div
      style={{
        margin: "0 20px 16px",
        padding: "10px 14px",
        borderRadius: 10,
        background: t.bgSecondary,
        border: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: t.goldSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DollarSign size={16} strokeWidth={2} color={t.gold} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Deal Room</div>
        <div style={{ fontSize: 11, color: t.textTertiary }}>
          {loanType || "Loan"} · Auto-created from pipeline
        </div>
      </div>
      <button
        style={{
          background: t.accentSoft,
          border: "none",
          borderRadius: 6,
          padding: "5px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = t.accentHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = t.accentSoft;
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>View Loan</span>
        <ArrowUpRight size={12} strokeWidth={2} color={t.text} />
      </button>
    </div>
  );
}

// ─── Message List ─────────────────────────────────────────────────────────────
interface MessageListV2Props {
  messages: ChatMessageWithSender[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId?: string;
  channelId?: string;
  getPresenceStatus: (uid: string) => PresenceStatus;
  onThreadClick?: (messageId: string) => void;
  typingUsers: TypingUser[];
}

export function MessageListV2({
  messages,
  loading,
  hasMore,
  onLoadMore,
  currentUserId,
  getPresenceStatus,
  onThreadClick,
  typingUsers,
}: MessageListV2Props) {
  const { t } = useChatTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const isAtBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (el.scrollTop < 100 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  useEffect(() => {
    if (messages.length > prevCountRef.current && isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading && messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: t.bg,
        }}
      >
        <Loader2
          size={24}
          color={t.textTertiary}
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: t.bg,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: t.bgTertiary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <MessageSquare size={28} strokeWidth={1.5} color={t.textTertiary} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>
          No messages yet
        </div>
        <div style={{ fontSize: 13, color: t.textTertiary, marginTop: 4 }}>
          Start the conversation
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ flex: 1, overflowY: "auto", padding: "16px 0", background: t.bg }}
    >
      {/* Load more */}
      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
          <button
            onClick={onLoadMore}
            style={{
              fontSize: 12,
              color: t.textTertiary,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              "Load older messages"
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, i) => {
        const prev = i > 0 ? messages[i - 1] : null;
        const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at);
        const showAvatar =
          !prev ||
          prev.sender_id !== msg.sender_id ||
          showDateSep ||
          new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() > 5 * 60 * 1000;

        return (
          <div key={msg.id}>
            {showDateSep && <DateSeparator date={msg.created_at} />}
            <MessageRowV2
              message={msg}
              isOwn={msg.sender_id === currentUserId}
              showAvatar={showAvatar}
              index={i}
              onThreadClick={onThreadClick}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      {typingUsers.length > 0 && <TypingIndicatorV2 typingUsers={typingUsers} />}

      <div ref={bottomRef} />
    </div>
  );
}

// ─── Date Separator ───────────────────────────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  const { t } = useChatTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 20px",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, height: 1, background: t.divider }} />
      <span
        style={{
          fontSize: 11,
          color: t.textTertiary,
          fontWeight: 500,
          padding: "3px 10px",
          borderRadius: 6,
          background: t.bgSecondary,
          border: `1px solid ${t.borderLight}`,
          whiteSpace: "nowrap",
        }}
      >
        {formatDateSeparator(date)}
      </span>
      <div style={{ flex: 1, height: 1, background: t.divider }} />
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────
interface MessageRowV2Props {
  message: ChatMessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  index: number;
  onThreadClick?: (messageId: string) => void;
}

function MessageRowV2({
  message,
  isOwn,
  showAvatar,
  index,
  onThreadClick,
}: MessageRowV2Props) {
  const { mode, t } = useChatTheme();
  const [hovered, setHovered] = useState(false);

  const isSystem =
    message.message_type === "system" || message.message_type === "status_update";

  if (isSystem) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 20px",
          gap: 10,
          animation: `fadeIn 0.2s ease ${index * 0.04}s both`,
        }}
      >
        <div style={{ flex: 1, height: 1, background: t.divider }} />
        <span
          style={{
            fontSize: 11,
            color: t.textTertiary,
            fontWeight: 500,
            padding: "3px 10px",
            borderRadius: 6,
            background: t.bgSecondary,
            border: `1px solid ${t.borderLight}`,
            whiteSpace: "nowrap",
          }}
        >
          {message.content}
        </span>
        <div style={{ flex: 1, height: 1, background: t.divider }} />
      </div>
    );
  }

  const senderName = message.sender?.full_name || "Unknown";
  const senderInitials = getInitials(senderName);
  const hasAttachments =
    message.attachments && (message.attachments as Array<{ name: string }>).length > 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        padding: showAvatar ? "4px 20px" : "1px 20px 1px 62px",
        gap: 10,
        alignItems: "flex-start",
        background: hovered ? t.bgHover : "transparent",
        transition: "background 0.1s",
        animation: `msgIn 0.25s ease ${index * 0.04}s both`,
        position: "relative",
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <ChatAvatarV2
          initials={senderInitials}
          size={30}
          src={message.sender?.avatar_url}
        />
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showAvatar && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
              {senderName}
            </span>
            <span
              style={{
                fontSize: 11,
                color: t.textMuted,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {formatMessageTime(message.created_at)}
            </span>
            {message.is_edited && (
              <span style={{ fontSize: 11, color: t.textMuted }}>(edited)</span>
            )}
          </div>
        )}

        {/* File attachment */}
        {hasAttachments && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: message.content ? 6 : 0 }}>
            {(message.attachments as Array<{ name: string; url: string; size: number }>).map(
              (att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: t.bgSecondary,
                    border: `1px solid ${t.border}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    maxWidth: 320,
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      background: t.dangerSoft,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={16} strokeWidth={1.5} color={t.danger} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: t.text }}>
                      {att.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: t.textTertiary,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {(att.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </a>
              )
            )}
          </div>
        )}

        {/* Text bubble */}
        {message.content && (
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 10,
              background: isOwn ? t.ownBubble : t.otherBubble,
              color: isOwn ? t.ownBubbleText : t.otherBubbleText,
              maxWidth: "75%",
              borderBottomLeftRadius: isOwn ? 10 : 3,
              borderBottomRightRadius: isOwn ? 3 : 10,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>{message.content}</span>
          </div>
        )}

        {/* Thread indicator */}
        {message.thread_count > 0 && (
          <button
            onClick={() => onThreadClick?.(message.id)}
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: t.blue,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <MessageSquare size={13} strokeWidth={2} />
            {message.thread_count} {message.thread_count === 1 ? "reply" : "replies"}
          </button>
        )}

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions as Record<string, string[]>).length > 0 && (
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {Object.entries(message.reactions as Record<string, string[]>).map(
              ([emoji, users]) => (
                <span
                  key={emoji}
                  style={{
                    fontSize: 12,
                    padding: "2px 6px",
                    borderRadius: 12,
                    background: t.bgTertiary,
                    border: `1px solid ${t.borderLight}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    color: t.textSecondary,
                  }}
                >
                  {emoji} {users.length}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Hover toolbar */}
      {hovered && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 20,
            display: "flex",
            gap: 1,
            background: t.bgCard,
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            padding: 2,
            boxShadow: t.shadowFloat,
            zIndex: 5,
          }}
        >
          {[Smile, Reply, Bookmark, MoreHorizontal].map((Icon, j) => (
            <button
              key={j}
              onClick={j === 1 ? () => onThreadClick?.(message.id) : undefined}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 5,
                borderRadius: 6,
                display: "flex",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = t.bgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={14} strokeWidth={1.5} color={t.textTertiary} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicatorV2({ typingUsers }: { typingUsers: TypingUser[] }) {
  const { t } = useChatTheme();
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map((u) => u.full_name || "Someone");
  let text: string;
  if (names.length === 1) {
    text = `${names[0]} is typing...`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing...`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing...`;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 20px",
      }}
    >
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: t.textTertiary,
              display: "inline-block",
              animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: t.textTertiary, fontStyle: "italic" }}>
        {text}
      </span>
    </div>
  );
}
