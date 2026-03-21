"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  dealMessagesChannelName,
  DEAL_MESSAGES_BROADCAST_EVENT,
} from "@/lib/realtime/deal-message-broadcast";

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
    async (cursor?: string, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
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
        if (!opts?.silent) setLoading(false);
      }
    },
    [dealId, token, limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime: postgres_changes for authenticated portal users; broadcast for token (upload link) clients
  useEffect(() => {
    if (token) {
      const channel = supabase
        .channel(dealMessagesChannelName(dealId), {
          config: { broadcast: { self: true } },
        })
        .on("broadcast", { event: DEAL_MESSAGES_BROADCAST_EVENT }, () => {
          void fetchMessages(undefined, { silent: true });
        })
        .subscribe();

      channelRef.current = channel;
      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    }

    const channel = supabase
      .channel(`deal-messages-pg-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "deal_messages",
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          void fetchMessages(undefined, { silent: true });
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

        if (token) {
          await fetchMessages(undefined, { silent: true });
        }
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
