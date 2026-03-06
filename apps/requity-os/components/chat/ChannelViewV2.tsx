"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { ChatHeaderV2 } from "./ChatHeaderV2";
import { MessageListV2, DealRoomContextBar } from "./ChatMessagesV2";
import { ChatComposerV2 } from "./ChatComposerV2";
import { ChatDetailsPanelV2 } from "./ChatDetailsPanelV2";
import { ThreadPanel } from "./ThreadPanel";
import { ChatSearchOverlay } from "./ChatSearchOverlay";
import { useChannelMessages } from "@/hooks/useChannelMessages";
import { useTyping } from "@/hooks/useTyping";
import { formatCurrency } from "@/lib/format";
import type { ChatChannelWithUnread, PresenceStatus } from "@/lib/chat-types";

interface ChannelViewV2Props {
  channel: ChatChannelWithUnread;
  userId: string;
  isAdmin: boolean;
  getPresenceStatus: (uid: string) => PresenceStatus;
  onArchive?: (channelId: string) => void;
  onUnarchive?: (channelId: string) => void;
}

interface LoanInfo {
  id: string;
  stage: string | null;
  type: string | null;
  loan_amount: number | null;
}

export function ChannelViewV2({
  channel,
  userId,
  isAdmin,
  getPresenceStatus,
  onArchive,
  onUnarchive,
}: ChannelViewV2Props) {
  const { t } = useChatTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [threadMessageId, setThreadMessageId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [members, setMembers] = useState<
    Array<{ id: string; full_name: string | null; avatar_url: string | null }>
  >([]);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);

  const { messages, loading, hasMore, loadMore } = useChannelMessages(
    channel.id,
    userId
  );
  const { typingUsers, sendTyping, stopTyping } = useTyping(
    channel.id,
    userId
  );

  // Fetch channel members
  useEffect(() => {
    const fetchMembers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("chat_channel_members")
        .select("user_id, profiles:user_id(id, full_name, avatar_url)")
        .eq("channel_id", channel.id)
        .is("left_at", null)
        .limit(20);

      if (data) {
        setMembers(
          (
            data as unknown as Array<{
              user_id: string;
              profiles: {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
              } | null;
            }>
          )
            .filter((d) => d.profiles)
            .map((d) => d.profiles!)
        );
      }
    };
    fetchMembers();
  }, [channel.id]);

  // Fetch linked loan info for deal rooms
  useEffect(() => {
    if (channel.linked_entity_type !== "loan" || !channel.linked_entity_id) {
      setLoanInfo(null);
      return;
    }

    const fetchLoan = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("loans")
        .select("id, stage, type, loan_amount")
        .eq("id", channel.linked_entity_id!)
        .single();
      if (data) setLoanInfo(data as LoanInfo);
    };
    fetchLoan();
  }, [channel.linked_entity_id, channel.linked_entity_type]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        if (isSearchOpen) setIsSearchOpen(false);
        else if (threadMessageId) setThreadMessageId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isSearchOpen, threadMessageId]);

  // Reset state on channel change
  useEffect(() => {
    setThreadMessageId(null);
    setIsSearchOpen(false);
  }, [channel.id]);

  const loanAmount = loanInfo?.loan_amount
    ? formatCurrency(loanInfo.loan_amount)
    : null;
  const loanType = loanInfo?.type
    ? loanInfo.type.toUpperCase().replace(/_/g, " ")
    : null;

  return (
    <>
      {/* ══ Center Chat Area ══ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: t.bg,
          minWidth: 0,
          transition: "background 0.3s",
        }}
      >
        <ChatHeaderV2
          channel={channel}
          members={members}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
          onSearch={() => setIsSearchOpen(true)}
          loanStage={loanInfo?.stage}
          loanAmount={loanAmount}
          onArchive={onArchive ? () => onArchive(channel.id) : undefined}
          onUnarchive={onUnarchive ? () => onUnarchive(channel.id) : undefined}
        />

        {/* Messages area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Deal room context bar */}
          {channel.channel_type === "deal_room" && (
            <div style={{ flexShrink: 0, paddingTop: 16 }}>
              <DealRoomContextBar
                channel={channel}
                loanType={loanType}
                loanId={loanInfo?.id}
              />
            </div>
          )}

          <MessageListV2
            messages={messages}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            currentUserId={userId}
            channelId={channel.id}
            getPresenceStatus={getPresenceStatus}
            onThreadClick={setThreadMessageId}
            typingUsers={typingUsers}
          />
        </div>

        <ChatComposerV2
          channelId={channel.id}
          channelName={channel.name}
          userId={userId}
          onTyping={sendTyping}
          onStopTyping={stopTyping}
        />

        {/* Search overlay */}
        {isSearchOpen && (
          <ChatSearchOverlay
            channelId={channel.id}
            onClose={() => setIsSearchOpen(false)}
            onNavigateToMessage={() => setIsSearchOpen(false)}
          />
        )}
      </div>

      {/* ══ Thread Panel ══ */}
      {threadMessageId && (
        <ThreadPanel
          parentMessageId={threadMessageId}
          channelId={channel.id}
          userId={userId}
          getPresenceStatus={getPresenceStatus}
          onClose={() => setThreadMessageId(null)}
          onTyping={sendTyping}
          onStopTyping={stopTyping}
        />
      )}

      {/* ══ Details Panel ══ */}
      {showDetails && (
        <ChatDetailsPanelV2
          channel={channel}
          members={members}
          onClose={() => setShowDetails(false)}
          getPresenceStatus={getPresenceStatus}
        />
      )}
    </>
  );
}
