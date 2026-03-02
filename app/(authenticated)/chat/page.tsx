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

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function ChatPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserProfile(profile as UserProfile);
        }

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
      <div className="flex items-center justify-center h-full bg-[#0A1628]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C5975B]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-[#0A1628]">
      {/* Chat Sidebar */}
      <ChatSidebar
        groups={groups}
        activeChannelId={activeChannelId}
        searchQuery={searchQuery}
        loading={channelsLoading}
        onSelectChannel={setActiveChannelId}
        onSearchChange={setSearchQuery}
        onNewChannel={() => setShowCreateModal(true)}
        currentUser={userProfile}
        getPresenceStatus={getStatus}
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
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0F2140]">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(197,151,91,0.08)] flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-[#C5975B]" />
          </div>
          <h3 className="font-display text-lg font-medium text-[#F0EDE6]">
            Requity Command Center
          </h3>
          <p className="text-sm mt-1 text-[#8A8680]">
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
