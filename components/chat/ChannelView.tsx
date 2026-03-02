"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ChannelHeader } from "./ChannelHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ThreadPanel } from "./ThreadPanel";
import { ContextPanel } from "./ContextPanel";
import { ActivityTimeline } from "./ActivityTimeline";
import { TypingIndicator } from "./TypingIndicator";
import { ChatSearchOverlay } from "./ChatSearchOverlay";
import { ChannelSettingsModal } from "./ChannelSettingsModal";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { useTyping } from "@/hooks/useTyping";
import type { ChatChannelWithUnread, PresenceStatus } from "@/lib/chat-types";
import { Loader2 } from "lucide-react";

interface ChannelViewProps {
  channel: ChatChannelWithUnread;
  userId: string;
  isAdmin: boolean;
  getPresenceStatus: (uid: string) => PresenceStatus;
}

export function ChannelView({
  channel,
  userId,
  isAdmin,
  getPresenceStatus,
}: ChannelViewProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "activity">("chat");
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [members, setMembers] = useState<
    Array<{ id: string; full_name: string | null; avatar_url: string | null }>
  >([]);

  const { messages, loading, hasMore, loadMore } = useChannelMessages(
    channel.id,
    userId
  );
  const { typingUsers, sendTyping, stopTyping } = useTyping(
    channel.id,
    userId
  );

  // Fetch channel members for header display
  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_channel_members" as never)
        .select("user_id, profiles:user_id(id, full_name, avatar_url)")
        .eq("channel_id", channel.id)
        .is("left_at", null)
        .limit(10);

      if (data) {
        setMembers(
          (
            data as unknown as Array<{
              user_id: string;
              profiles: {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
              } | null;
            }>
          )
            .filter((d) => d.profiles)
            .map((d) => d.profiles!)
        );
      }
    };
    fetchMembers();
  }, [channel.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        if (isSearchOpen) setIsSearchOpen(false);
        else if (threadMessageId) setThreadMessageId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSearchOpen, threadMessageId]);

  // Reset state on channel change
  useEffect(() => {
    setThreadMessageId(null);
    setActiveTab("chat");
    setIsSearchOpen(false);
  }, [channel.id]);

  const isDealRoom = channel.channel_type === "deal_room";

  return (
    <div className="flex-1 flex h-full">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChannelHeader
          channel={channel}
          members={members}
          isContextPanelOpen={isContextPanelOpen}
          onToggleContextPanel={() =>
            setIsContextPanelOpen(!isContextPanelOpen)
          }
          onSettings={() => setIsSettingsOpen(true)}
          onSearch={() => setIsSearchOpen(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === "chat" ? (
          <>
            <MessageList
              messages={messages}
              loading={loading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              currentUserId={userId}
              channelId={channel.id}
              getPresenceStatus={getPresenceStatus}
              onThreadClick={setThreadMessageId}
            />
            <TypingIndicator typingUsers={typingUsers} />
            <MessageInput
              channelId={channel.id}
              userId={userId}
              onTyping={sendTyping}
              onStopTyping={stopTyping}
            />
          </>
        ) : (
          <ActivityTimeline channelId={channel.id} />
        )}

        {/* Search overlay */}
        {isSearchOpen && (
          <ChatSearchOverlay
            channelId={channel.id}
            onClose={() => setIsSearchOpen(false)}
            onNavigateToMessage={() => {
              setIsSearchOpen(false);
            }}
          />
        )}
      </div>

      {/* Thread panel */}
      {threadMessageId && (
        <ThreadPanel
          parentMessageId={threadMessageId}
          channelId={channel.id}
          userId={userId}
          getPresenceStatus={getPresenceStatus}
          onClose={() => setThreadMessageId(null)}
          onTyping={sendTyping}
          onStopTyping={stopTyping}
        />
      )}

      {/* Context panel for deal rooms */}
      {isDealRoom && isContextPanelOpen && (
        <ContextPanel
          channel={channel}
          onClose={() => setIsContextPanelOpen(false)}
        />
      )}

      {/* Settings modal */}
      <ChannelSettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        channel={channel}
        userId={userId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
