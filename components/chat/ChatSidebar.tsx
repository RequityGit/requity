"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Landmark,
  Users,
  MessageCircle,
  MessagesSquare,
  PiggyBank,
  Building2,
  FolderKanban,
  Hash,
  Pin,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import { formatChatTime, truncate } from "@/lib/chat-utils";
import type {
  ChatChannelWithUnread,
  ChatChannelGroup,
  ChatChannelType,
} from "@/lib/chat-types";

const typeIcons: Record<ChatChannelType | "pinned", React.ElementType> = {
  pinned: Pin,
  deal_room: Landmark,
  team: Users,
  direct: MessageCircle,
  group: MessagesSquare,
  investor_room: PiggyBank,
  borrower_room: Building2,
  project_room: FolderKanban,
};

interface ChatSidebarProps {
  groups: ChatChannelGroup[];
  activeChannelId: string | null;
  searchQuery: string;
  loading: boolean;
  onSelectChannel: (channelId: string) => void;
  onSearchChange: (query: string) => void;
  onNewChannel: () => void;
}

export function ChatSidebar({
  groups,
  activeChannelId,
  searchQuery,
  loading,
  onSelectChannel,
  onSearchChange,
  onNewChannel,
}: ChatSidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

  return (
    <div className="w-72 h-full flex flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">Messages</h2>
          <button
            onClick={onNewChannel}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="New message"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search channels..."
            className="pl-8 h-8 text-sm bg-slate-50"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-slate-100 animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
                  <div className="h-2.5 w-36 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400">
            {searchQuery ? "No channels found" : "No channels yet"}
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            const GroupIcon = typeIcons[group.type] || Hash;
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-700"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {group.label}
                  <span className="text-slate-400 font-normal normal-case">
                    ({group.channels.length})
                  </span>
                </button>

                {!isCollapsed && (
                  <div>
                    {group.channels.map((channel) => (
                      <ChannelRow
                        key={channel.id}
                        channel={channel}
                        isActive={channel.id === activeChannelId}
                        onSelect={() => onSelectChannel(channel.id)}
                        icon={
                          channel.is_pinned
                            ? Pin
                            : typeIcons[channel.channel_type] || Hash
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChannelRow({
  channel,
  isActive,
  onSelect,
  icon: Icon,
}: {
  channel: ChatChannelWithUnread;
  isActive: boolean;
  onSelect: () => void;
  icon: React.ElementType;
}) {
  const lastMsg = channel.last_message as {
    content?: string | null;
    created_at?: string;
    message_type?: string;
  } | null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
        isActive
          ? "bg-blue-50 border-l-2 border-l-blue-600"
          : "hover:bg-slate-50 border-l-2 border-l-transparent",
        channel.is_muted && "opacity-60"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center mt-0.5",
          isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "text-sm truncate",
              channel.unread_count > 0 && !channel.is_muted
                ? "font-semibold text-slate-900"
                : "font-medium text-slate-700"
            )}
          >
            {channel.name}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {channel.is_muted && <VolumeX className="h-3 w-3 text-slate-400" />}
            {lastMsg?.created_at && (
              <span className="text-[11px] text-slate-400">
                {formatChatTime(lastMsg.created_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs text-slate-500 truncate">
            {lastMsg?.message_type === "system"
              ? lastMsg.content || ""
              : truncate(lastMsg?.content || "", 40)}
          </span>
          {channel.unread_count > 0 && !channel.is_muted && (
            <Badge
              variant="default"
              className="h-4 min-w-[16px] px-1 text-[10px] bg-blue-600 flex-shrink-0"
            >
              {channel.unread_count > 99 ? "99+" : channel.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
