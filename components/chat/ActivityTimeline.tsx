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
  loan_status_change: "bg-blue-100 text-blue-600",
  document_upload: "bg-purple-100 text-purple-600",
  payment_received: "bg-green-100 text-green-600",
  member_joined: "bg-teal-100 text-teal-600",
  condition_approved: "bg-emerald-100 text-emerald-600",
  condition_submitted: "bg-amber-100 text-amber-600",
  escalation: "bg-red-100 text-red-600",
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

    // Realtime
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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <Activity className="h-8 w-8 mb-2" />
        <div className="text-sm">No activity yet</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />

        {items.map((item) => {
          const Icon = eventIcons[item.event_type] || Activity;
          const color =
            eventColors[item.event_type] || "bg-slate-100 text-slate-600";

          return (
            <div key={item.id} className="relative flex gap-3 pb-4">
              <div
                className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center z-10 ${color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="text-sm text-slate-700">{item.summary}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {new Date(item.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  {item.event_source && (
                    <span className="ml-2 text-slate-300">
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
