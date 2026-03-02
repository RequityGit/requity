"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceIndicator } from "./PresenceIndicator";
import { formatMessageTime, getInitials } from "@/lib/chat-utils";
import type { ChatMessageWithSender, PresenceStatus } from "@/lib/chat-types";
import {
  MessageSquare,
  Smile,
  Pin,
  MoreHorizontal,
  Pencil,
  Trash2,
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
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀", "✅"];

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  getPresenceStatus,
  onThreadClick,
  currentUserId,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isSystem = message.message_type === "system" || message.message_type === "status_update";

  if (isSystem) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  const handleReaction = async (emoji: string) => {
    if (!currentUserId) return;
    const supabase = createClient();
    const currentReactions = (message.reactions || {}) as Record<string, string[]>;
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

    setShowReactionPicker(false);
  };

  const reactions = message.reactions as Record<string, string[]> | null;
  const hasReactions = reactions && Object.keys(reactions).length > 0;

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-1 hover:bg-slate-50/50 transition-colors",
        !showAvatar && "pl-[60px]"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="relative flex-shrink-0 w-9">
          <Avatar className="h-9 w-9">
            {message.sender?.avatar_url && (
              <AvatarImage src={message.sender.avatar_url} />
            )}
            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
              {getInitials(message.sender?.full_name || null)}
            </AvatarFallback>
          </Avatar>
          {message.sender_id && (
            <PresenceIndicator
              status={getPresenceStatus(message.sender_id)}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          )}
        </div>
      )}

      {/* Message content */}
      <div className="min-w-0 flex-1">
        {showAvatar && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm text-slate-900">
              {message.sender?.full_name || "Unknown"}
            </span>
            <span className="text-xs text-slate-400">
              {formatMessageTime(message.created_at)}
            </span>
            {message.is_edited && (
              <span className="text-xs text-slate-400">(edited)</span>
            )}
          </div>
        )}

        {/* Text content with markdown */}
        {message.content && (
          <div className="text-sm text-slate-700 prose prose-sm max-w-none prose-p:my-0 prose-p:leading-relaxed prose-a:text-blue-600 prose-code:text-sm prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && (message.attachments as Array<{ name: string; url: string; type: string; size: number }>).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(message.attachments as Array<{ name: string; url: string; type: string; size: number }>).map((att, i) => (
              <a
                key={i}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="truncate max-w-[200px]">{att.name}</span>
                <span className="text-xs text-slate-400">
                  {(att.size / 1024).toFixed(0)}KB
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Action item */}
        {message.action_item && (
          <div className="mt-1.5 flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800">
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
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                  currentUserId && users.includes(currentUserId)
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
            className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => onThreadClick?.(message.id)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="font-medium">
              {message.thread_count} {message.thread_count === 1 ? "reply" : "replies"}
            </span>
            {message.thread_last_reply_at && (
              <span className="text-slate-400">
                Last reply {formatMessageTime(message.thread_last_reply_at)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute right-4 -top-3 flex items-center gap-0.5 bg-white border border-slate-200 rounded-md shadow-sm p-0.5">
          <button
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            title="Add reaction"
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            onClick={() => onThreadClick?.(message.id)}
            title="Reply in thread"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="Pin message"
          >
            <Pin className="h-4 w-4" />
          </button>
          <button
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            title="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Reaction picker */}
      {showReactionPicker && (
        <div className="absolute right-4 top-5 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1 z-50">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="p-1.5 rounded hover:bg-slate-100 text-lg transition-colors"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
