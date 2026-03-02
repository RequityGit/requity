"use client";

import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MentionSuggestion } from "@/lib/chat-types";

export function useMentions(channelId: string | null) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabaseRef = useRef(createClient());

  const searchMentions = useCallback(
    async (query: string) => {
      if (!query || query.length < 1) {
        setSuggestions([]);
        return;
      }
      setIsSearching(true);
      const supabase = supabaseRef.current;
      const results: MentionSuggestion[] = [];

      // @everyone
      if ("everyone".startsWith(query.toLowerCase())) {
        results.push({
          id: "everyone",
          type: "everyone",
          label: "@everyone",
          sublabel: "Notify all members",
        });
      }

      // Search users (channel members first, then all)
      if (channelId) {
        const { data: members } = await supabase
          .from("chat_channel_members" as never)
          .select("user_id, profiles:user_id(id, full_name, avatar_url, email)")
          .eq("channel_id", channelId)
          .is("left_at", null);

        if (members) {
          for (const m of members as unknown as Array<{
            user_id: string;
            profiles: { id: string; full_name: string | null; avatar_url: string | null; email: string | null } | null;
          }>) {
            const p = m.profiles;
            if (!p) continue;
            const name = p.full_name || p.email || "";
            if (name.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                id: p.id,
                type: "user",
                label: p.full_name || p.email || "Unknown",
                sublabel: p.email || undefined,
                avatar_url: p.avatar_url,
              });
            }
          }
        }
      }

      // Search loans by loan_number
      if (query.length >= 2) {
        const { data: loans } = await supabase
          .from("loans")
          .select("id, loan_number, property_address")
          .ilike("loan_number", `%${query}%`)
          .is("deleted_at", null)
          .limit(5);

        if (loans) {
          for (const loan of loans) {
            results.push({
              id: loan.id,
              type: "entity",
              label: loan.loan_number || "Loan",
              sublabel: loan.property_address || undefined,
              entity_type: "loan",
            });
          }
        }
      }

      setSuggestions(results.slice(0, 10));
      setIsSearching(false);
    },
    [channelId]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return { suggestions, isSearching, searchMentions, clearSuggestions };
}
