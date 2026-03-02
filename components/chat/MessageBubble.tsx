"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./ChatAvatar";
import { PresenceIndicator } from "./PresenceIndicator";
import { ChatEmojiPicker, QuickReactionBar } from "./ChatEmojiPicker";
import { formatMessageTime } from "@/lib/chat-utils";
import type { ChatMessageWithSender, PresenceStatus } from "@/lib/chat-types";
import {
  MessageSquare,
  Smile,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
  BookmarkCheck,
  Eye,
  FileText,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/client";

interface MessageBubbleProps {
  message: ChatMessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  getPresenceStatus: (uid: string) => PresenceStatus;
  onThreadClick?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
  channelId?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  getPresenceStatus,
  onThreadClick,
  currentUserId,
  channelId,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const isSystem =
    message.message_type === "system" ||
    message.message_type === "status_update";

  // Check bookmark status on mount
  useEffect(() => {
    if (!currentUserId) return;
    const checkBookmark = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_bookmarks")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("message_id", message.id)
        .maybeSingle();
      setIsBookmarked(!!data);
    };
    checkBookmark();
  }, [currentUserId, message.id]);

  if (isSystem) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="text-xs text-[#8A8680] bg-[#0F2140] px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;
    const supabase = createClient();
    const currentReactions = (message.reactions || {}) as Record<
      string,
      string[]
    >;
    const users = currentReactions[emoji] || [];
    const hasReacted = users.includes(currentUserId);

    let newUsers: string[];
    if (hasReacted) {
      newUsers = users.filter((id) => id !== currentUserId);
    } else {
      newUsers = [...users, currentUserId];
    }

    const newReactions = { ...currentReactions };
    if (newUsers.length === 0) {
      delete newReactions[emoji];
    } else {
      newReactions[emoji] = newUsers;
    }

    await supabase
      .from("chat_messages")
      .update({ reactions: newReactions })
      .eq("id", message.id);

    setShowEmojiPicker(false);
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId || !channelId) return;
    const supabase = createClient();

    if (isBookmarked) {
      await supabase
        .from("chat_bookmarks")
        .delete()
        .eq("user_id", currentUserId)
        .eq("message_id", message.id);
      setIsBookmarked(false);
    } else {
      await supabase.from("chat_bookmarks").insert({
        user_id: currentUserId,
        message_id: message.id,
        channel_id: channelId,
      });
      setIsBookmarked(true);
    }
  };

  const handleMarkUnread = async () => {
    if (!currentUserId || !channelId) return;
    const supabase = createClient();
    await supabase
      .from("chat_channel_members")
      .update({
        last_read_message_id: message.id,
        last_read_at: message.created_at,
      })
      .eq("channel_id", channelId)
      .eq("user_id", currentUserId);
    setShowMoreMenu(false);
  };

  const handleDeleteMessage = async () => {
    const supabase = createClient();
    await supabase
      .from("chat_messages")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", message.id);
    setShowMoreMenu(false);
  };

  const handlePinMessage = async () => {
    if (!currentUserId || !channelId) return;
    const supabase = createClient();
    await supabase.from("chat_pinned_messages").insert({
      channel_id: channelId,
      message_id: message.id,
      pinned_by: currentUserId,
    });
    setShowMoreMenu(false);
  };

  const reactions = message.reactions as Record<string, string[]> | null;
  const hasReactions = reactions && Object.keys(reactions).length > 0;

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-1 hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        !showAvatar && "pl-[60px]"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
        setShowMoreMenu(false);
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="relative flex-shrink-0 w-9">
          <ChatAvatar
            src={message.sender?.avatar_url}
            name={message.sender?.full_name}
            size="message"
          />
          {message.sender_id && (
            <PresenceIndicator
              status={getPresenceStatus(message.sender_id)}
              size="sm"
              borderColor="border-[#0F2140]"
              className="absolute -bottom-0.5 -right-0.5"
            />
          )}
        </div>
      )}

      {/* Message content */}
      <div className="min-w-0 flex-1">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm text-[#FAFAF8]">
              {message.sender?.full_name || "Unknown"}
            </span>
            <span className="text-[11px] text-[#8A8680]">
              {formatMessageTime(message.created_at)}
            </span>
            {message.is_edited && (
              <span className="text-[11px] text-[#8A8680]">(edited)</span>
            )}
          </div>
        )}

        {/* Text content with markdown */}
        {message.content && (
          <div className="text-sm text-[#F0EDE6] prose prose-sm prose-invert max-w-none prose-p:my-0 prose-p:leading-relaxed prose-a:text-[#D4AD72] prose-code:text-sm prose-code:bg-[#1A3355] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[#E8D5B0]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Attachments */}
        {message.attachments &&
          (
            message.attachments as Array<{
              name: string;
              url: string;
              type: string;
              size: number;
            }>
          ).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(
                message.attachments as Array<{
                  name: string;
                  url: string;
                  type: string;
                  size: number;
                }>
              ).map((att, i) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[rgba(197,151,91,0.06)] border border-[rgba(197,151,91,0.12)] px-3 py-1.5 rounded-md text-sm text-[#E8D5B0] hover:bg-[rgba(197,151,91,0.1)] transition-colors duration-200"
                >
                  <FileText className="h-4 w-4 text-[#C5975B]" />
                  <span className="truncate max-w-[200px]">{att.name}</span>
                  <span className="text-xs text-[#8A8680]">
                    {(att.size / 1024).toFixed(0)}KB
                  </span>
                </a>
              ))}
            </div>
          )}

        {/* Action item */}
        {message.action_item && (
          <div className="mt-1.5 flex items-center gap-2 bg-[rgba(212,149,43,0.1)] border border-[rgba(212,149,43,0.2)] px-3 py-1.5 rounded-md">
            <AlertCircle className="h-4 w-4 text-[#D4952B] flex-shrink-0" />
            <span className="text-sm text-[#D4952B]">
              {(message.action_item as { title: string }).title}
            </span>
          </div>
        )}

        {/* Reactions */}
        {hasReactions && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all duration-200",
                  currentUserId && users.includes(currentUserId)
                    ? "bg-[rgba(197,151,91,0.1)] border-[rgba(197,151,91,0.3)] text-[#C5975B]"
                    : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-[#C4C0B8] hover:bg-[rgba(255,255,255,0.08)]"
                )}
                onClick={() => handleReaction(emoji)}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {message.thread_count > 0 && (
          <button
            className="mt-1.5 flex items-center gap-1.5 text-xs text-[#C5975B] hover:text-[#D4AD72] transition-colors duration-200"
            onClick={() => onThreadClick?.(message.id)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-medium">
              {message.thread_count}{" "}
              {message.thread_count === 1 ? "reply" : "replies"}
            </span>
            {message.thread_last_reply_at && (
              <span className="text-[#8A8680]">
                Last reply {formatMessageTime(message.thread_last_reply_at)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Hover toolbar */}
      {showActions && (
        <div className="absolute right-4 -top-3 flex items-center gap-0.5 bg-[#1A2535] border border-[rgba(255,255,255,0.12)] rounded-lg p-0.5 shadow-lg z-20">
          {/* Quick reactions */}
          <QuickReactionBar onReact={handleReaction} />

          {/* Divider */}
          <div className="w-px h-5 bg-[rgba(255,255,255,0.12)] mx-0.5" />

          {/* Emoji picker trigger */}
          <ToolbarButton
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add reaction"
            icon={<Smile className="h-[18px] w-[18px]" />}
          />

          {/* Thread */}
          <ToolbarButton
            onClick={() => onThreadClick?.(message.id)}
            title="Reply in thread"
            icon={<MessageSquare className="h-[18px] w-[18px]" />}
          />

          {/* Bookmark */}
          <ToolbarButton
            onClick={handleToggleBookmark}
            title={isBookmarked ? "Remove bookmark" : "Bookmark"}
            icon={
              isBookmarked ? (
                <BookmarkCheck className="h-[18px] w-[18px] text-[#C5975B]" />
              ) : (
                <Bookmark className="h-[18px] w-[18px]" />
              )
            }
          />

          {/* More actions */}
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              title="More"
              icon={<MoreHorizontal className="h-[18px] w-[18px]" />}
            />

            {showMoreMenu && (
              <div
                ref={moreMenuRef}
                className="absolute right-0 top-full mt-1 w-48 bg-[#1A2535] border border-[rgba(255,255,255,0.12)] rounded-lg shadow-xl py-1 z-50"
              >
                {isOwn && (
                  <MoreMenuItem
                    icon={<Pencil className="h-4 w-4" />}
                    label="Edit message"
                    onClick={() => setShowMoreMenu(false)}
                  />
                )}
                {isOwn && (
                  <MoreMenuItem
                    icon={<Trash2 className="h-4 w-4" />}
                    label="Delete message"
                    onClick={handleDeleteMessage}
                    danger
                  />
                )}
                <MoreMenuItem
                  icon={<Pin className="h-4 w-4" />}
                  label="Pin message"
                  onClick={handlePinMessage}
                />
                <MoreMenuItem
                  icon={<Eye className="h-4 w-4" />}
                  label="Mark unread"
                  onClick={handleMarkUnread}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <div className="absolute right-4 top-6 z-50">
          <ChatEmojiPicker
            onSelect={handleReaction}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  icon,
}: {
  onClick?: () => void;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 rounded hover:bg-[rgba(255,255,255,0.08)] text-[#C4C0B8] transition-colors duration-200"
      title={title}
    >
      {icon}
    </button>
  );
}

function MoreMenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-200",
        danger
          ? "text-[#C0392B] hover:bg-[rgba(192,57,43,0.1)]"
          : "text-[#F0EDE6] hover:bg-[rgba(255,255,255,0.06)]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
