"use client";

import { useChatTheme } from "@/contexts/chat-theme-context";
import { ChatAvatarV2, StagePill } from "./ChatPrimitives";
import { getInitials } from "@/lib/chat-utils";
import { getStageDisplayLabel } from "@/lib/chat-theme";
import type { ChatChannelWithUnread } from "@/lib/chat-types";
import { Phone, Video, Search, Star, Layers, Archive, ArchiveRestore } from "lucide-react";

interface ChatHeaderV2Props {
  channel: ChatChannelWithUnread;
  members: Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>;
  showDetails: boolean;
  onToggleDetails: () => void;
  onSearch: () => void;
  loanStage?: string | null;
  loanAmount?: string | null;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

export function ChatHeaderV2({
  channel,
  members,
  showDetails,
  onToggleDetails,
  onSearch,
  loanStage,
  loanAmount,
  onArchive,
  onUnarchive,
}: ChatHeaderV2Props) {
  const { mode, t } = useChatTheme();
  const initials = getInitials(channel.name);
  const stageLabel = loanStage ? getStageDisplayLabel(loanStage) : null;

  return (
    <div
      style={{
        padding: "0 20px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${t.border}`,
        background: t.headerBlur,
        backdropFilter: "blur(16px)",
        flexShrink: 0,
      }}
    >
      {/* Left side: channel info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ChatAvatarV2 initials={channel.icon || initials} size={32} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
              {channel.name}
            </span>
            {stageLabel && <StagePill stage={stageLabel} />}
          </div>
          <div
            style={{
              fontSize: 12,
              color: t.textTertiary,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 1,
            }}
          >
            {members.length > 0 && <span>{members.length} members</span>}
            {loanAmount && (
              <>
                <span style={{ color: t.textMuted }}>·</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 500,
                    fontSize: 11,
                    color: t.textSecondary,
                  }}
                >
                  {loanAmount}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {[Phone, Video, Search, Star].map((Icon, i) => (
          <button
            key={i}
            onClick={i === 2 ? onSearch : undefined}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 7,
              borderRadius: 8,
              display: "flex",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Icon size={16} strokeWidth={1.5} color={t.textTertiary} />
          </button>
        ))}

        {/* Archive / Unarchive */}
        {(onArchive || onUnarchive) && (
          <button
            onClick={channel.is_archived ? onUnarchive : onArchive}
            title={channel.is_archived ? "Restore from archive" : "Archive this chat"}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 7,
              borderRadius: 8,
              display: "flex",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.bgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {channel.is_archived ? (
              <ArchiveRestore size={16} strokeWidth={1.5} color={t.textTertiary} />
            ) : (
              <Archive size={16} strokeWidth={1.5} color={t.textTertiary} />
            )}
          </button>
        )}

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 18,
            background: t.divider,
            margin: "0 4px",
          }}
        />

        {/* Details toggle */}
        <button
          onClick={onToggleDetails}
          style={{
            background: showDetails ? t.accentSoft : "transparent",
            border: `1px solid ${showDetails ? t.borderFocus : "transparent"}`,
            cursor: "pointer",
            padding: "5px 10px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!showDetails) e.currentTarget.style.background = t.bgHover;
          }}
          onMouseLeave={(e) => {
            if (!showDetails) e.currentTarget.style.background = "transparent";
          }}
        >
          <Layers
            size={14}
            strokeWidth={1.5}
            color={showDetails ? t.text : t.textTertiary}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: showDetails ? t.text : t.textTertiary,
            }}
          >
            Details
          </span>
        </button>
      </div>
    </div>
  );
}
