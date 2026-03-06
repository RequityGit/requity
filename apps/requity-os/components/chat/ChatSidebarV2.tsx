"use client";

import { useState } from "react";
import { useChatTheme } from "@/contexts/chat-theme-context";
import { ChatAvatarV2, StatusDot, UnreadBadge } from "./ChatPrimitives";
import { BADGE_COLOR } from "@/lib/chat-theme";
import { formatChatTime, truncate, getInitials } from "@/lib/chat-utils";
import type {
  ChatChannelWithUnread,
  ChatChannelGroup,
  PresenceStatus,
  ChatChannelType,
} from "@/lib/chat-types";
import {
  Edit3,
  Pin,
  Clock,
  Loader2,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ChatterMultiSearch, type SearchSelection } from "./ChatterMultiSearch";

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "deals", label: "Deals", types: ["deal_room"] as ChatChannelType[] },
  { id: "investors", label: "Investors", types: ["investor_room"] as ChatChannelType[] },
  { id: "team", label: "Team", types: ["team", "group"] as ChatChannelType[] },
  { id: "dms", label: "Direct", types: ["direct"] as ChatChannelType[] },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChatSidebarV2Props {
  groups: ChatChannelGroup[];
  channels: ChatChannelWithUnread[];
  archivedChannels?: ChatChannelWithUnread[];
  activeChannelId: string | null;
  searchQuery: string;
  loading: boolean;
  totalUnread: number;
  onSelectChannel: (channelId: string) => void;
  onSearchChange: (query: string) => void;
  onNewChannel: () => void;
  onStartConversation?: (selections: SearchSelection[]) => void;
  onArchiveChannel?: (channelId: string) => void;
  onUnarchiveChannel?: (channelId: string) => void;
  currentUser?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  getPresenceStatus?: (uid: string) => PresenceStatus;
}

export function ChatSidebarV2({
  groups,
  channels,
  archivedChannels = [],
  activeChannelId,
  searchQuery,
  loading,
  totalUnread,
  onSelectChannel,
  onSearchChange,
  onNewChannel,
  onStartConversation,
  onArchiveChannel,
  onUnarchiveChannel,
  currentUser,
  getPresenceStatus,
}: ChatSidebarV2Props) {
  const { mode, t } = useChatTheme();
  const [activeFilter, setActiveFilter] = useState("all");
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Filter channels based on active filter
  const filteredChannels = channels.filter((c) => {
    if (activeFilter === "all") return true;
    const tab = FILTER_TABS.find((f) => f.id === activeFilter);
    if (!tab || !tab.types) return true;
    return tab.types.includes(c.channel_type);
  });

  // Apply search filter
  const searchedChannels = searchQuery.trim()
    ? filteredChannels.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredChannels;

  // Group into pinned and recent
  const pinnedChannels = searchedChannels.filter((c) => c.is_pinned);
  const unpinnedChannels = searchedChannels.filter((c) => !c.is_pinned);

  return (
    <div
      style={{
        width: 320,
        minWidth: 320,
        background: t.bgSecondary,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s",
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Top row: Brand + actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: t.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: mode === "dark" ? "#0C0C0C" : "#FFFFFF",
                  letterSpacing: "-0.02em",
                }}
              >
                R
              </span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: t.text }}>
              Requity
            </span>
            {totalUnread > 0 && <UnreadBadge count={totalUnread} />}
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <SidebarIconButton onClick={onNewChannel}>
              <Edit3 size={16} strokeWidth={1.5} color={t.textSecondary} />
            </SidebarIconButton>
          </div>
        </div>

        {/* Multi-Select Search */}
        <ChatterMultiSearch
          onStartConversation={onStartConversation || (() => {})}
          onSearchChange={onSearchChange}
          searchQuery={searchQuery}
          currentUserId={currentUser?.id}
        />

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 1, background: t.bgTertiary, borderRadius: 8, padding: 2 }}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  borderRadius: 6,
                  background: isActive
                    ? mode === "dark"
                      ? "#2A2A2A"
                      : "#FFFFFF"
                    : "transparent",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: isActive ? t.shadow : "none",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? t.text : t.textSecondary,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Channel List ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <Loader2
              size={24}
              color={t.textTertiary}
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : searchedChannels.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: t.textTertiary }}>
            {searchQuery ? "No channels found" : "No channels yet"}
          </div>
        ) : (
          <>
            {pinnedChannels.length > 0 && (
              <>
                <SectionHeader icon={<Pin size={10} strokeWidth={2.5} color={t.textTertiary} />} label="Pinned" t={t} />
                {pinnedChannels.map((ch, i) => (
                  <ChannelRowV2
                    key={ch.id}
                    channel={ch}
                    active={activeChannelId === ch.id}
                    hovered={hoveredChannel === ch.id}
                    onClick={() => onSelectChannel(ch.id)}
                    onHover={setHoveredChannel}
                    index={i}
                    getPresenceStatus={getPresenceStatus}
                    onArchive={onArchiveChannel ? () => onArchiveChannel(ch.id) : undefined}
                  />
                ))}
              </>
            )}
            {unpinnedChannels.length > 0 && (
              <>
                <SectionHeader icon={<Clock size={10} strokeWidth={2.5} color={t.textTertiary} />} label="Recent" t={t} />
                {unpinnedChannels.map((ch, i) => (
                  <ChannelRowV2
                    key={ch.id}
                    channel={ch}
                    active={activeChannelId === ch.id}
                    hovered={hoveredChannel === ch.id}
                    onClick={() => onSelectChannel(ch.id)}
                    onHover={setHoveredChannel}
                    index={i + pinnedChannels.length}
                    getPresenceStatus={getPresenceStatus}
                    onArchive={onArchiveChannel ? () => onArchiveChannel(ch.id) : undefined}
                  />
                ))}
              </>
            )}

            {/* Archived channels section */}
            {archivedChannels.length > 0 && (
              <>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "14px 8px 4px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  {showArchived ? (
                    <ChevronDown size={10} strokeWidth={2.5} color={t.textTertiary} />
                  ) : (
                    <ChevronRight size={10} strokeWidth={2.5} color={t.textTertiary} />
                  )}
                  <Archive size={10} strokeWidth={2.5} color={t.textTertiary} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: t.textTertiary,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Archived ({archivedChannels.length})
                  </span>
                </button>
                {showArchived &&
                  archivedChannels.map((ch, i) => (
                    <ChannelRowV2
                      key={ch.id}
                      channel={ch}
                      active={activeChannelId === ch.id}
                      hovered={hoveredChannel === ch.id}
                      onClick={() => onSelectChannel(ch.id)}
                      onHover={setHoveredChannel}
                      index={i + pinnedChannels.length + unpinnedChannels.length}
                      getPresenceStatus={getPresenceStatus}
                      isArchived
                      onUnarchive={onUnarchiveChannel ? () => onUnarchiveChannel(ch.id) : undefined}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>

      {/* ── User Footer ── */}
      {currentUser && (
        <div
          style={{
            padding: "12px 12px",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ChatAvatarV2
            initials={getInitials(currentUser.full_name)}
            size={32}
            color="#1A1A1A"
            src={currentUser.avatar_url}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
              {currentUser.full_name || "Unknown"}
            </div>
            <div style={{ fontSize: 11, color: t.textTertiary }}>Online</div>
          </div>
          <StatusDot
            status={getPresenceStatus?.(currentUser.id) || "online"}
            size={10}
            borderColor={t.bgSecondary}
          />
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  label,
  t,
}: {
  icon: React.ReactNode;
  label: string;
  t: { textTertiary: string };
}) {
  return (
    <div
      style={{
        padding: label === "Pinned" ? "10px 8px 4px" : "14px 8px 4px",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {icon}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: t.textTertiary,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Channel Row ──────────────────────────────────────────────────────────────
interface ChannelRowV2Props {
  channel: ChatChannelWithUnread;
  active: boolean;
  hovered: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
  index: number;
  getPresenceStatus?: (uid: string) => PresenceStatus;
  isArchived?: boolean;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

function ChannelRowV2({
  channel,
  active,
  hovered,
  onClick,
  onHover,
  index,
  getPresenceStatus,
  isArchived,
  onArchive,
  onUnarchive,
}: ChannelRowV2Props) {
  const { mode, t } = useChatTheme();
  const isDM = channel.channel_type === "direct";
  const unread = channel.unread_count > 0 && !channel.is_muted;

  const lastMsg = channel.last_message as {
    content?: string | null;
    created_at?: string;
    message_type?: string;
    sender_id?: string | null;
  } | null;

  const initials = getInitials(channel.name);
  const presenceStatus =
    isDM && lastMsg?.sender_id && getPresenceStatus
      ? getPresenceStatus(lastMsg.sender_id)
      : undefined;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(channel.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: active
          ? t.sidebarActive
          : hovered
          ? t.bgHover
          : "transparent",
        transition: "all 0.15s",
        animation: `slideIn 0.2s ease ${index * 0.03}s both`,
        opacity: channel.is_muted ? 0.5 : 1,
      }}
    >
      {/* Avatar with optional presence dot */}
      <div style={{ position: "relative" }}>
        <ChatAvatarV2
          initials={channel.icon || initials}
          size={36}
          src={null}
        />
        {(presenceStatus === "online" || presenceStatus === "away") && (
          <div style={{ position: "absolute", bottom: -8, right: -3 }}>
            <StatusDot
              status={presenceStatus}
              size={12}
              borderColor={
                active
                  ? t.sidebarActive
                  : hovered
                  ? t.bgHover
                  : t.bgSecondary
              }
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: unread ? 700 : 500,
              color: t.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {channel.name}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {/* Archive/Unarchive button on hover */}
            {hovered && (onArchive || onUnarchive) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isArchived) onUnarchive?.();
                  else onArchive?.();
                }}
                title={isArchived ? "Restore from archive" : "Archive chat"}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 3,
                  borderRadius: 4,
                  display: "flex",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = t.bgHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {isArchived ? (
                  <ArchiveRestore size={12} strokeWidth={1.5} color={t.textTertiary} />
                ) : (
                  <Archive size={12} strokeWidth={1.5} color={t.textTertiary} />
                )}
              </button>
            )}
            <span
              style={{
                fontSize: 11,
                color: unread ? t.text : t.textMuted,
                fontWeight: unread ? 600 : 400,
              }}
            >
              {lastMsg?.created_at ? formatChatTime(lastMsg.created_at) : ""}
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 2,
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: unread ? t.textSecondary : t.textTertiary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {lastMsg?.message_type === "system"
              ? lastMsg.content || ""
              : truncate(lastMsg?.content || "", 40)}
          </span>
          {unread && <UnreadBadge count={channel.unread_count} />}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Icon Button ──────────────────────────────────────────────────────
function SidebarIconButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { t } = useChatTheme();
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 6,
        borderRadius: 8,
        display: "flex",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = t.bgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
