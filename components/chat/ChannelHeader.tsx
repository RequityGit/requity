"use client";

import { cn } from "@/lib/utils";
import { ChatAvatar, ChatGroupIcon } from "./ChatAvatar";
import type { ChatChannelWithUnread } from "@/lib/chat-types";
import {
  Search,
  Pin,
  Settings,
  PanelRightOpen,
  PanelRightClose,
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
  const isDM = channel.channel_type === "direct";

  return (
    <div className="border-b border-border bg-secondary">
      {/* Main header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {isDM ? (
            <ChatAvatar src={null} name={channel.name} size="header" />
          ) : (
            <ChatGroupIcon icon={channel.icon} size="header" />
          )}

          <div className="min-w-0">
            <h2 className="font-semibold text-foreground truncate text-sm">
              {channel.name}
            </h2>
            {!isDM && members.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {members.length}{" "}
                {members.length === 1 ? "member" : "members"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          {members.length > 0 && (
            <div className="flex -space-x-1.5 mr-2">
              {members.slice(0, 4).map((m) => (
                <ChatAvatar
                  key={m.id}
                  src={m.avatar_url}
                  name={m.full_name}
                  size="header"
                  className="border-border"
                />
              ))}
              {members.length > 4 && (
                <div className="h-7 w-7 rounded-md bg-muted border-[1.5px] border-border flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                  +{members.length - 4}
                </div>
              )}
            </div>
          )}

          <HeaderButton
            onClick={onSearch}
            title="Search messages"
            icon={<Search className="h-4 w-4" />}
          />
          <HeaderButton
            onClick={() => {}}
            title="Pinned messages"
            icon={<Pin className="h-4 w-4" />}
          />
          {isDealRoom && (
            <HeaderButton
              onClick={onToggleContextPanel}
              title="Toggle deal context"
              isActive={isContextPanelOpen}
              icon={
                isContextPanelOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )
              }
            />
          )}
          <HeaderButton
            onClick={onSettings}
            title="Channel settings"
            icon={<Settings className="h-4 w-4" />}
          />
        </div>
      </div>

      {isDealRoom && (
        <div className="flex gap-0 px-4 border-t border-border">
          <button
            onClick={() => onTabChange("chat")}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-all duration-200",
              activeTab === "chat"
                ? "text-gold border-[#C5975B]"
                : "text-muted-foreground border-transparent hover:text-muted-foreground"
            )}
          >
            Chat
          </button>
          <button
            onClick={() => onTabChange("activity")}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-all duration-200",
              activeTab === "activity"
                ? "text-gold border-[#C5975B]"
                : "text-muted-foreground border-transparent hover:text-muted-foreground"
            )}
          >
            Activity
          </button>
        </div>
      )}
    </div>
  );
}

function HeaderButton({
  onClick,
  title,
  icon,
  isActive,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isActive
          ? "text-gold bg-[rgba(197,151,91,0.08)]"
          : "text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.06)]"
      )}
      title={title}
    >
      {icon}
    </button>
  );
}
