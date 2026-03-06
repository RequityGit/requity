"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatChannelWithUnread,
  ChatChannelGroup,
} from "@/lib/chat-types";
import { groupChannels } from "@/lib/chat-utils";

export function useChat(userId: string | undefined) {
  const [channels, setChannels] = useState<ChatChannelWithUnread[]>([]);
  const [groups, setGroups] = useState<ChatChannelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const supabaseRef = useRef(createClient());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch channels from the view
  const fetchChannels = useCallback(async () => {
    if (!userId) return;
    const supabase = supabaseRef.current;
    const { data, error } = await supabase
      .from("chat_channels_with_unread")
      .select("*")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching channels:", error);
      return;
    }

    const parsed = (data as unknown as ChatChannelWithUnread[]) || [];
    setChannels(parsed);
    setGroups(groupChannels(parsed));
    setLoading(false);
  }, [userId]);

  // Debounced version for realtime callbacks to prevent N+1 API calls
  const debouncedFetchChannels = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchChannels();
    }, 300);
  }, [fetchChannels]);

  // Clean up debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Realtime subscription for channel updates
  useEffect(() => {
    if (!userId) return;
    const supabase = supabaseRef.current;

    const subscription = supabase
      .channel("chat-sidebar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_channel_members",
          filter: `user_id=eq.${userId}`,
        },
        () => debouncedFetchChannels()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_channels",
        },
        () => debouncedFetchChannels()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        () => debouncedFetchChannels()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, debouncedFetchChannels]);

  // Separate active and archived channels
  const activeChannels = channels.filter((c) => !c.is_archived);
  const archivedChannels = channels.filter((c) => c.is_archived);

  // Filter channels by search
  const filteredGroups = searchQuery.trim()
    ? groupChannels(
        activeChannels.filter((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : groupChannels(activeChannels);

  // Total unread across active (non-archived) channels
  const totalUnread = activeChannels.reduce((sum, c) => sum + (c.is_muted ? 0 : c.unread_count), 0);

  // Archive / unarchive a channel
  const archiveChannel = useCallback(
    async (channelId: string) => {
      const supabase = supabaseRef.current;
      await supabase
        .from("chat_channels")
        .update({ is_archived: true })
        .eq("id", channelId);
      // If we just archived the active channel, deselect
      if (activeChannelId === channelId) {
        setActiveChannelId(null);
      }
      fetchChannels();
    },
    [activeChannelId, fetchChannels]
  );

  const unarchiveChannel = useCallback(
    async (channelId: string) => {
      const supabase = supabaseRef.current;
      await supabase
        .from("chat_channels")
        .update({ is_archived: false })
        .eq("id", channelId);
      fetchChannels();
    },
    [fetchChannels]
  );

  return {
    channels: activeChannels,
    archivedChannels,
    groups: filteredGroups,
    loading,
    totalUnread,
    activeChannelId,
    setActiveChannelId,
    searchQuery,
    setSearchQuery,
    refetch: fetchChannels,
    archiveChannel,
    unarchiveChannel,
  };
}
