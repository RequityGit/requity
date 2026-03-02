"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChannelView } from "@/components/chat/ChannelView";
import { ChannelCreateModal } from "@/components/chat/ChannelCreateModal";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import type { ChatChannelWithUnread } from "@/lib/chat-types";
import { MessageSquare, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChannel, setSelectedChannel] =
    useState<ChatChannelWithUnread | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Check if admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (roles) {
          setIsAdmin(
            roles.some(
              (r) => r.role === "admin" || r.role === "super_admin"
            )
          );
        }
      }
    };
    getUser();
  }, []);

  const {
    channels,
    groups,
    loading: channelsLoading,
    activeChannelId,
    setActiveChannelId,
    searchQuery,
    setSearchQuery,
  } = useChat(userId);

  const { getStatus } = usePresence(userId);

  // When active channel changes, find the full channel object
  useEffect(() => {
    if (activeChannelId) {
      const ch = channels.find((c) => c.id === activeChannelId);
      setSelectedChannel(ch || null);
    } else {
      setSelectedChannel(null);
    }
  }, [activeChannelId, channels]);

  // Auto-select first channel if none selected
  useEffect(() => {
    if (!activeChannelId && channels.length > 0 && !channelsLoading) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId, channelsLoading, setActiveChannelId]);

  // Global keyboard shortcut: Cmd+K for search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Focus the sidebar search
        const input = document.querySelector(
          '[placeholder="Search channels..."]'
        ) as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-white">
      {/* Chat Sidebar */}
      <ChatSidebar
        groups={groups}
        activeChannelId={activeChannelId}
        searchQuery={searchQuery}
        loading={channelsLoading}
        onSelectChannel={setActiveChannelId}
        onSearchChange={setSearchQuery}
        onNewChannel={() => setShowCreateModal(true)}
      />

      {/* Channel content */}
      {selectedChannel ? (
        <ChannelView
          channel={selectedChannel}
          userId={userId}
          isAdmin={isAdmin}
          getPresenceStatus={getStatus}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <MessageSquare className="h-12 w-12 mb-3" />
          <h3 className="text-lg font-medium text-slate-600">
            Requity Command Center
          </h3>
          <p className="text-sm mt-1">
            {channelsLoading
              ? "Loading channels..."
              : "Select a channel to start chatting"}
          </p>
        </div>
      )}

      {/* Create channel modal */}
      <ChannelCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        userId={userId}
        onChannelCreated={(channelId) => {
          setActiveChannelId(channelId);
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
