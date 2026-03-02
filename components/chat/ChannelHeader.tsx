"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/chat-utils";
import type { ChatChannelWithUnread } from "@/lib/chat-types";
import {
  Hash,
  Landmark,
  Users,
  MessageCircle,
  Settings,
  Pin,
  ChevronDown,
  ChevronUp,
  PanelRightOpen,
  PanelRightClose,
  Search,
} from "lucide-react";

interface ChannelHeaderProps {
  channel: ChatChannelWithUnread;
  members: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
  isContextPanelOpen: boolean;
  onToggleContextPanel: () => void;
  onSettings: () => void;
  onSearch: () => void;
  activeTab: "chat" | "activity";
  onTabChange: (tab: "chat" | "activity") => void;
}

const channelTypeLabels: Record<string, string> = {
  deal_room: "Deal Room",
  team: "Team Channel",
  direct: "Direct Message",
  group: "Group Chat",
  investor_room: "Investor Room",
  borrower_room: "Borrower Room",
  project_room: "Project Room",
};

export function ChannelHeader({
  channel,
  members,
  isContextPanelOpen,
  onToggleContextPanel,
  onSettings,
  onSearch,
  activeTab,
  onTabChange,
}: ChannelHeaderProps) {
  const isDealRoom = channel.channel_type === "deal_room";

  return (
    <div className="border-b border-slate-200 bg-white">
      {/* Main header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {channel.channel_type === "deal_room" ? (
              <Landmark className="h-5 w-5 text-blue-600 flex-shrink-0" />
            ) : channel.channel_type === "team" ? (
              <Users className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            ) : channel.channel_type === "direct" ? (
              <MessageCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
            ) : (
              <Hash className="h-5 w-5 text-slate-500 flex-shrink-0" />
            )}
            <h2 className="font-semibold text-slate-900 truncate">
              {channel.name}
            </h2>
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {channelTypeLabels[channel.channel_type] || channel.channel_type}
          </Badge>
          {channel.linked_entity_type && (
            <Badge variant="info" className="text-xs flex-shrink-0">
              {channel.linked_entity_type}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Member avatars */}
          <div className="flex -space-x-2 mr-2">
            {members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-7 w-7 border-2 border-white">
                {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                  {getInitials(m.full_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="h-7 w-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] text-slate-600 font-medium">
                +{members.length - 4}
              </div>
            )}
          </div>

          <button
            onClick={onSearch}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>

          {isDealRoom && (
            <button
              onClick={onToggleContextPanel}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isContextPanelOpen
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              )}
              title="Toggle deal context"
            >
              {isContextPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            onClick={onSettings}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Channel settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tab bar for deal rooms */}
      {isDealRoom && (
        <div className="flex gap-0 px-4 border-t border-slate-100">
          <button
            onClick={() => onTabChange("chat")}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "chat"
                ? "text-blue-600 border-blue-600"
                : "text-slate-500 border-transparent hover:text-slate-700"
            )}
          >
            Chat
          </button>
          <button
            onClick={() => onTabChange("activity")}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "activity"
                ? "text-blue-600 border-blue-600"
                : "text-slate-500 border-transparent hover:text-slate-700"
            )}
          >
            Activity
          </button>
        </div>
      )}
    </div>
  );
}
