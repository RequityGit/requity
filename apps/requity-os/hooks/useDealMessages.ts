"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DealMessage {
  id: string;
  deal_id: string;
  sender_type: "admin" | "borrower" | "system";
  sender_id: string | null;
  contact_id: string | null;
  source: "portal" | "email" | "sms";
  body: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  sender_name: string;
}

interface UseDealMessagesOptions {
  dealId: string;
  token?: string; // for borrower auth
  limit?: number;
}

export function useDealMessages({ dealId, token, limit = 50 }: UseDealMessagesOptions) {
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch messages from API
  const fetchMessages = useCallback(
    async (cursor?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(limit) });
        if (token) params.set("token", token);
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/deal-messages/${dealId}?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("Failed to fetch messages:", res.status);
          return;
        }
        // Guard against HTML redirect responses (e.g. middleware redirect to /login)
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          console.error("Unexpected content type for deal messages:", contentType);
          return;
        }

        const data = await res.json();
        if (cursor) {
          // Prepend older messages
          setMessages((prev) => [...(data.messages as DealMessage[]), ...prev]);
        } else {
          setMessages(data.messages as DealMessage[]);
        }
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error fetching deal messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [dealId, token, limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    // Only subscribe via Supabase realtime if admin (has auth session)
    // Borrowers poll or rely on optimistic updates since they don't have Supabase auth
    if (token) return;

    const channel = supabase
      .channel(`deal-messages-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload) => {
          const newMsg = payload.new as {
            id: string;
            deal_id: string;
            sender_type: string;
            sender_id: string | null;
            contact_id: string | null;
            source: string;
            body: string;
            metadata: Record<string, unknown> | null;
            created_at: string;
          };

          // Avoid duplicates (in case our optimistic update already added it)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                ...newMsg,
                sender_type: newMsg.sender_type as DealMessage["sender_type"],
                source: newMsg.source as DealMessage["source"],
                sender_name: newMsg.sender_type === "system" ? "System" : "...",
              },
            ];
          });

          // Re-fetch to get enriched sender names
          // Small delay to let the DB settle
          setTimeout(() => fetchMessages(), 500);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, token]);

  // Borrower polling fallback (every 10s)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchMessages();
    }, 10000);

    return () => clearInterval(interval);
  }, [token, fetchMessages]);

  // Send a message
  const sendMessage = useCallback(
    async (body: string, contactId?: string) => {
      if (!body.trim()) return;
      setSending(true);
      try {
        const payload: Record<string, string> = { dealId, body: body.trim() };
        if (token) payload.token = token;
        if (contactId) payload.contactId = contactId;

        const res = await fetch("/api/deal-messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to send");
        }

        // If token (borrower), immediately re-fetch since no realtime
        if (token) {
          await fetchMessages();
        }
        // Admin gets the message via realtime subscription
      } finally {
        setSending(false);
      }
    },
    [dealId, token, fetchMessages]
  );

  const loadOlder = useCallback(() => {
    if (messages.length > 0) {
      fetchMessages(messages[0].created_at);
    }
  }, [messages, fetchMessages]);

  return {
    messages,
    loading,
    hasMore,
    sending,
    sendMessage,
    loadOlder,
    refetch: () => fetchMessages(),
  };
}
