"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { ChatSidebarV2 } from "@/components/chat/ChatSidebarV2";
import { ChannelViewV2 } from "@/components/chat/ChannelViewV2";
import { ChannelCreateModal } from "@/components/chat/ChannelCreateModal";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import type { ChatChannelWithUnread } from "@/lib/chat-types";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { MessageSquare, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

function ChatPageInner() {
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
    archivedChannels,
    groups,
    loading: channelsLoading,
    totalUnread,
    activeChannelId,
    setActiveChannelId,
    searchQuery,
    setSearchQuery,
    archiveChannel,
    unarchiveChannel,
  } = useChat(userId);

  const { getStatus } = usePresence(userId);

  // When active channel changes, find the full channel object (check both active and archived)
  useEffect(() => {
    if (activeChannelId) {
      const ch =
        channels.find((c) => c.id === activeChannelId) ||
        archivedChannels.find((c) => c.id === activeChannelId) ||
        null;
      setSelectedChannel(ch);
    } else {
      setSelectedChannel(null);
    }
  }, [activeChannelId, channels, archivedChannels]);

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
          '[placeholder="Search..."]'
        ) as HTMLInputElement;
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!userId) {
    return <LoadingState />;
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        margin: "-24px",
        overflow: "hidden",
      }}
    >
      {/* Chat animations CSS */}
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes msgIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes dotBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-3px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <ChatSidebarV2
        groups={groups}
        channels={channels}
        archivedChannels={archivedChannels}
        activeChannelId={activeChannelId}
        searchQuery={searchQuery}
        loading={channelsLoading}
        totalUnread={totalUnread}
        onSelectChannel={setActiveChannelId}
        onSearchChange={setSearchQuery}
        onNewChannel={() => setShowCreateModal(true)}
        onArchiveChannel={archiveChannel}
        onUnarchiveChannel={unarchiveChannel}
        currentUser={userProfile}
        getPresenceStatus={getStatus}
      />

      {/* Channel content or empty state */}
      {selectedChannel ? (
        <ChannelViewV2
          channel={selectedChannel}
          userId={userId}
          isAdmin={isAdmin}
          getPresenceStatus={getStatus}
          onArchive={archiveChannel}
          onUnarchive={unarchiveChannel}
        />
      ) : (
        <EmptyState loading={channelsLoading} />
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

function LoadingState() {
  const { t } = useChatTheme();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        background: t.bg,
      }}
    >
      <Loader2
        size={32}
        color={t.textTertiary}
        style={{ animation: "spin 1s linear infinite" }}
      />
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  const { t } = useChatTheme();
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
          width: 64,
          height: 64,
          borderRadius: 16,
          background: t.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <MessageSquare size={32} strokeWidth={1.5} color={t.textTertiary} />
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: t.text,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Requity Chatter
      </div>
      <div
        style={{
          fontSize: 14,
          color: t.textTertiary,
          marginTop: 4,
        }}
      >
        {loading ? "Loading channels..." : "Select a channel to start chatting"}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ChatThemeProvider>
      <ChatPageInner />
    </ChatThemeProvider>
  );
}
