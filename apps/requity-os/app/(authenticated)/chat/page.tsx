"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { ChatSidebarV2 } from "@/components/chat/ChatSidebarV2";
import { ChannelViewV2 } from "@/components/chat/ChannelViewV2";
import { ChannelCreateModal } from "@/components/chat/ChannelCreateModal";
import { useChat } from "@/hooks/useChat";
import { usePresence } from "@/hooks/usePresence";
import type { ChatChannelWithUnread, ChatChannelType } from "@/lib/chat-types";
import type { SearchSelection } from "@/components/chat/ChatterMultiSearch";
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

  // Handle multi-select search: create a channel with selected members/deals
  const handleStartConversation = useCallback(
    async (selections: SearchSelection[]) => {
      if (!userId) return;

      const supabase = createClient();
      const members = selections.filter(
        (s): s is Extract<SearchSelection, { type: "member" }> =>
          s.type === "member"
      );
      const deals = selections.filter(
        (s): s is Extract<SearchSelection, { type: "deal" }> =>
          s.type === "deal"
      );

      // Determine channel type and name
      let channelType: ChatChannelType;
      let channelName: string;
      let linkedEntityType: string | null = null;
      let linkedEntityId: string | null = null;

      if (deals.length === 1 && members.length === 0) {
        // Single deal -> deal_room
        channelType = "deal_room";
        const deal = deals[0].data;
        channelName = deal.loan_number || "Deal Chat";
        linkedEntityType = "loan";
        linkedEntityId = deal.id;
      } else if (deals.length === 0 && members.length === 1) {
        // Single member -> direct message
        channelType = "direct";
        const member = members[0].data;
        channelName = member.full_name || member.email || "DM";

        // Check for existing DM with this user
        const { data: existingChannels } = await supabase
          .from("chat_channel_members")
          .select("channel_id")
          .eq("user_id", userId);

        if (existingChannels) {
          for (const ec of existingChannels as unknown as Array<{
            channel_id: string;
          }>) {
            const { data: ch } = await supabase
              .from("chat_channels")
              .select("id, channel_type")
              .eq("id", ec.channel_id)
              .eq("channel_type", "direct")
              .single();

            if (ch) {
              const { data: otherMember } = await supabase
                .from("chat_channel_members")
                .select("id")
                .eq("channel_id", (ch as unknown as { id: string }).id)
                .eq("user_id", member.id)
                .single();

              if (otherMember) {
                // Existing DM found, navigate to it
                setActiveChannelId((ch as unknown as { id: string }).id);
                return;
              }
            }
          }
        }
      } else if (deals.length > 0 && members.length > 0) {
        // Mix of deals + members -> group with deal context
        channelType = "group";
        const dealLabels = deals.map(
          (d) => d.data.loan_number || "Deal"
        );
        const memberLabels = members.map(
          (m) => m.data.full_name?.split(" ")[0] || "?"
        );
        channelName = [...dealLabels, ...memberLabels].join(", ");
        // Link to first deal
        linkedEntityType = "loan";
        linkedEntityId = deals[0].data.id;
      } else if (members.length > 1) {
        // Multiple members -> group
        channelType = "group";
        channelName = members
          .map((m) => m.data.full_name?.split(" ")[0] || "?")
          .join(", ");
      } else {
        // Multiple deals, no members -> group deal room
        channelType = "group";
        channelName = deals
          .map((d) => d.data.loan_number || "Deal")
          .join(", ");
        linkedEntityType = "loan";
        linkedEntityId = deals[0].data.id;
      }

      // Create the channel
      const { data: channelData, error } = await supabase
        .from("chat_channels")
        .insert({
          name: channelName,
          channel_type: channelType,
          is_private: true,
          ...(linkedEntityType && linkedEntityId
            ? {
                linked_entity_type: linkedEntityType as "loan",
                linked_entity_id: linkedEntityId,
              }
            : {}),
        })
        .select("id")
        .single();

      const channel = channelData as unknown as { id: string } | null;
      if (error || !channel) {
        console.error("Error creating channel from search:", error);
        return;
      }

      // Add members
      const memberInserts = [
        {
          channel_id: channel.id,
          user_id: userId,
          role: "owner" as const,
        },
        ...members.map((m) => ({
          channel_id: channel.id,
          user_id: m.data.id,
          role: "member" as const,
        })),
      ];

      await supabase.from("chat_channel_members").insert(memberInserts);

      // If deals are linked, send a system message for context
      if (deals.length > 0) {
        const dealList = deals
          .map(
            (d) =>
              `${d.data.loan_number || "Deal"}${
                d.data.property_address ? ` (${d.data.property_address})` : ""
              }`
          )
          .join(", ");

        await supabase.from("chat_messages").insert({
          channel_id: channel.id,
          sender_id: null,
          message_type: "system",
          content: `Conversation started about: ${dealList}`,
          linked_entities: deals.map((d) => ({
            type: "loan",
            id: d.data.id,
            label: d.data.loan_number || "Deal",
          })),
        });
      }

      // Navigate to the new channel
      setActiveChannelId(channel.id);
    },
    [userId, setActiveChannelId]
  );

  // Global keyboard shortcut: Cmd+K for search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector(
          '[placeholder="Search people & deals..."]'
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
        onStartConversation={handleStartConversation}
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
      data-empty
      className="empty-state"
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
        No conversations yet
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
