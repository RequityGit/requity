"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatChatTime, truncate } from "@/lib/chat-utils";
import { ChatAvatar, ChatGroupIcon } from "./ChatAvatar";
import { PresenceIndicator } from "./PresenceIndicator";
import { GroupIconPicker } from "./ChatEmojiPicker";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatChannelWithUnread,
  ChatChannelGroup,
  PresenceStatus,
} from "@/lib/chat-types";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  VolumeX,
} from "lucide-react";

interface ChatSidebarProps {
  groups: ChatChannelGroup[];
  activeChannelId: string | null;
  searchQuery: string;
  loading: boolean;
  onSelectChannel: (channelId: string) => void;
  onSearchChange: (query: string) => void;
  onNewChannel: () => void;
  currentUser?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  getPresenceStatus?: (uid: string) => PresenceStatus;
}

export function ChatSidebar({
  groups,
  activeChannelId,
  searchQuery,
  loading,
  onSelectChannel,
  onSearchChange,
  onNewChannel,
  currentUser,
  getPresenceStatus,
}: ChatSidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  // Map group types to simplified sidebar section labels
  const getSectionLabel = (group: ChatChannelGroup): string => {
    if (group.type === "direct") return "DIRECT MESSAGES";
    if (group.type === "pinned") return "PINNED";
    return "CHANNELS";
  };

  return (
    <div className="w-80 h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base font-medium tracking-wide text-gold">
            MESSAGES
          </h2>
          <button
            onClick={onNewChannel}
            className="p-1.5 rounded-md text-muted-foreground hover:text-gold hover:bg-[rgba(197,151,91,0.06)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            title="New message"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-8 pr-3 h-8 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-all duration-200"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-[44px] w-[44px] rounded-[10px] bg-secondary animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
                  <div className="h-2.5 w-36 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? "No channels found" : "No channels yet"}
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            const sectionLabel = getSectionLabel(group);
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center gap-1.5 w-full px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.1em] hover:text-muted-foreground transition-colors duration-200"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {sectionLabel}
                  <span className="text-muted-foreground font-normal normal-case ml-1">
                    ({group.channels.length})
                  </span>
                </button>

                {!isCollapsed && (
                  <div>
                    {group.channels.map((channel) => (
                      <ConversationItem
                        key={channel.id}
                        channel={channel}
                        isActive={channel.id === activeChannelId}
                        onSelect={() => onSelectChannel(channel.id)}
                        getPresenceStatus={getPresenceStatus}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Current user footer */}
      {currentUser && (
        <div className="p-3 border-t border-border flex items-center gap-3">
          <div className="relative">
            <ChatAvatar
              src={currentUser.avatar_url}
              name={currentUser.full_name}
              size="footer"
            />
            {getPresenceStatus && (
              <PresenceIndicator
                status={getPresenceStatus(currentUser.id)}
                size="sm"
                className="absolute -bottom-0.5 -right-0.5"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground truncate">
              {currentUser.full_name || "Unknown"}
            </div>
            <div className="text-xs text-[#2D8A56]">Online</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  channel,
  isActive,
  onSelect,
  getPresenceStatus,
}: {
  channel: ChatChannelWithUnread;
  isActive: boolean;
  onSelect: () => void;
  getPresenceStatus?: (uid: string) => PresenceStatus;
}) {
  const [showIconPicker, setShowIconPicker] = useState(false);

  const lastMsg = channel.last_message as {
    content?: string | null;
    created_at?: string;
    message_type?: string;
    sender_id?: string | null;
  } | null;

  const isDM = channel.channel_type === "direct";

  const handleIconChange = async (emoji: string) => {
    const supabase = createClient();
    await supabase
      .from("chat_channels")
      .update({ icon: emoji })
      .eq("id", channel.id);
  };

  return (
    <div className="relative">
      <button
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isActive
            ? "bg-[rgba(197,151,91,0.08)] border-l-[3px] border-l-[#C5975B]"
            : "hover:bg-[rgba(197,151,91,0.06)] border-l-[3px] border-l-transparent",
          channel.is_muted && "opacity-50"
        )}
      >
        {/* Avatar / Icon */}
        <div className="relative flex-shrink-0">
          {isDM ? (
            <>
              <ChatAvatar
                src={null}
                name={channel.name}
                size="sidebar"
              />
              {getPresenceStatus && lastMsg?.sender_id && (
                <PresenceIndicator
                  status={getPresenceStatus(lastMsg.sender_id)}
                  size="md"
                  className="absolute -bottom-0.5 -right-0.5"
                />
              )}
            </>
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowIconPicker(true);
              }}
            >
              <ChatGroupIcon
                icon={channel.icon}
                size="sidebar"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span
              className={cn(
                "text-sm truncate",
                channel.unread_count > 0 && !channel.is_muted
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground"
              )}
            >
              {channel.name}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {channel.is_muted && (
                <VolumeX className="h-3 w-3 text-muted-foreground" />
              )}
              {lastMsg?.created_at && (
                <span className="text-[11px] text-muted-foreground">
                  {formatChatTime(lastMsg.created_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              {lastMsg?.message_type === "system"
                ? lastMsg.content || ""
                : truncate(lastMsg?.content || "", 40)}
            </span>
            {channel.unread_count > 0 && !channel.is_muted && (
              <span className="flex-shrink-0 inline-flex items-center justify-center h-[18px] min-w-[18px] px-1 rounded-full bg-[#C5975B] text-foreground text-[10px] font-bold">
                {channel.unread_count > 99 ? "99+" : channel.unread_count}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Group icon picker popup */}
      {showIconPicker && (
        <div className="absolute left-16 top-0 z-50">
          <GroupIconPicker
            currentIcon={channel.icon}
            onSelect={handleIconChange}
            onClose={() => setShowIconPicker(false)}
          />
        </div>
      )}
    </div>
  );
}
