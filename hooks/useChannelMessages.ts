"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessageWithSender } from "@/lib/chat-types";

const PAGE_SIZE = 50;

export function useChannelMessages(channelId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const supabaseRef = useRef(createClient());

  // Fetch messages with sender profile info
  const fetchMessages = useCallback(
    async (before?: string) => {
      if (!channelId) return;
      const supabase = supabaseRef.current;

      let query = supabase
        .from("chat_messages" as never)
        .select("*, sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url, email)")
        .eq("channel_id", channelId)
        .is("is_deleted", false)
        .is("parent_message_id", null)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
        return;
      }

      const rows = (data as unknown as ChatMessageWithSender[]) || [];
      const reversed = [...rows].reverse();

      if (before) {
        setMessages((prev) => [...reversed, ...prev]);
      } else {
        setMessages(reversed);
      }

      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    },
    [channelId]
  );

  // Initial load
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);
    fetchMessages();
  }, [fetchMessages]);

  // Mark messages as read
  useEffect(() => {
    if (!channelId || !userId) return;
    const supabase = supabaseRef.current;

    const markRead = async () => {
      await supabase
        .from("chat_channel_members" as never)
        .update({
          unread_count: 0,
          last_read_at: new Date().toISOString(),
        } as never)
        .eq("channel_id", channelId)
        .eq("user_id", userId);
    };

    // Slight delay so UI renders first
    const timer = setTimeout(markRead, 500);
    return () => clearTimeout(timer);
  }, [channelId, userId, messages.length]);

  // Realtime: new + edited messages
  useEffect(() => {
    if (!channelId) return;
    const supabase = supabaseRef.current;

    const sub = supabase
      .channel(`room-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessageWithSender;
          // Only append root messages (not thread replies)
          if (newMsg.parent_message_id) return;

          // Fetch sender profile
          if (newMsg.sender_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, email")
              .eq("id", newMsg.sender_id)
              .single();
            if (profile) {
              newMsg.sender = profile;
            }
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessageWithSender;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id ? { ...m, ...updated, sender: m.sender } : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channelId]);

  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[0].created_at);
    }
  }, [messages, hasMore, fetchMessages]);

  return { messages, loading, hasMore, loadMore };
}
