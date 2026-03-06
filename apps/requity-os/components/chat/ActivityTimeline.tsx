"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatActivityFeedItem } from "@/lib/chat-types";
import {
  Activity,
  FileText,
  DollarSign,
  ArrowRightLeft,
  UserPlus,
  AlertCircle,
  Check,
  Clock,
  Loader2,
} from "lucide-react";

interface ActivityTimelineProps {
  channelId: string;
}

const eventIcons: Record<string, React.ElementType> = {
  loan_status_change: ArrowRightLeft,
  document_upload: FileText,
  payment_received: DollarSign,
  member_joined: UserPlus,
  condition_approved: Check,
  condition_submitted: Clock,
  escalation: AlertCircle,
};

const eventColors: Record<string, string> = {
  loan_status_change: "bg-accent text-foreground",
  document_upload: "bg-muted text-primary/80",
  payment_received: "bg-[rgba(45,138,86,0.15)] text-[#2D8A56]",
  member_joined: "bg-[rgba(45,138,86,0.1)] text-[#2D8A56]",
  condition_approved: "bg-[rgba(45,138,86,0.15)] text-[#2D8A56]",
  condition_submitted: "bg-[rgba(212,149,43,0.15)] text-[#D4952B]",
  escalation: "bg-[rgba(192,57,43,0.15)] text-[#C0392B]",
};

export function ActivityTimeline({ channelId }: ActivityTimelineProps) {
  const [items, setItems] = useState<ChatActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const fetchActivity = async () => {
      const supabase = supabaseRef.current;
      const { data } = await supabase
        .from("chat_activity_feed")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setItems(data as unknown as ChatActivityFeedItem[]);
      }
      setLoading(false);
    };

    fetchActivity();

    const supabase = supabaseRef.current;
    const sub = supabase
      .channel(`activity-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_activity_feed",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const item = payload.new as ChatActivityFeedItem;
          setItems((prev) => [item, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channelId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary">
        <Activity className="h-8 w-8 mb-2" />
        <div className="text-sm">No activity yet</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 bg-secondary">
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

        {items.map((item) => {
          const Icon = eventIcons[item.event_type] || Activity;
          const color =
            eventColors[item.event_type] ||
            "bg-muted text-muted-foreground";

          return (
            <div key={item.id} className="relative flex gap-3 pb-4">
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center z-10 ${color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="text-sm text-foreground">{item.summary}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  {item.event_source && (
                    <span className="ml-2 text-muted-foreground/60">
                      via {item.event_source}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
