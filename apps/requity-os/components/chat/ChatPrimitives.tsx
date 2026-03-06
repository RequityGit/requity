"use client";

import { useChatTheme } from "@/contexts/chat-theme-context";
import { AVATAR_COLORS, BADGE_COLOR, ONLINE_COLOR, getStagePillStyle } from "@/lib/chat-theme";
import type { ChatTheme } from "@/lib/chat-theme";

// ─── Avatar ──────────────────────────────────────────────────────────────────
interface ChatAvatarV2Props {
  initials: string;
  size?: number;
  color?: string;
  src?: string | null;
}

export function ChatAvatarV2({
  initials,
  size = 40,
  color,
  src,
}: ChatAvatarV2Props) {
  const idx = initials.charCodeAt(0) % AVATAR_COLORS.length;
  const bg = color || AVATAR_COLORS[idx];
  const borderRadius = size * 0.28;
  const fontSize = size * 0.32;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        style={{
          width: size,
          height: size,
          borderRadius,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        flexShrink: 0,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 600,
        color: "#FFFFFF",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "-0.01em",
      }}
    >
      {initials.slice(0, 2)}
    </div>
  );
}

// ─── Status Dot (Slack-style) ─────────────────────────────────────────────────
interface StatusDotProps {
  status: string;
  size?: number;
  borderColor?: string;
}

export function StatusDot({
  status,
  size = 10,
  borderColor,
}: StatusDotProps) {
  const { t } = useChatTheme();
  const isOnline = status === "online" || status === "active";
  const isPending = status === "pending" || status === "away";
  if (!isOnline && !isPending) return null;

  const dotColor = isOnline ? ONLINE_COLOR : "#F0A030";
  const border = borderColor || t.bgSecondary;

  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: dotColor,
        display: "inline-block",
        flexShrink: 0,
        border: `2px solid ${border}`,
      }}
    />
  );
}

// ─── Unread Badge ─────────────────────────────────────────────────────────────
interface UnreadBadgeProps {
  count: number;
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  const { mode } = useChatTheme();
  if (!count) return null;

  return (
    <span
      style={{
        background: BADGE_COLOR,
        color: mode === "dark" ? "#000000" : "#FFFFFF",
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        minWidth: 20,
        height: 17,
        borderRadius: 20,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 7px",
        lineHeight: 1,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ─── Stage Pill ───────────────────────────────────────────────────────────────
interface StagePillProps {
  stage: string;
  theme?: ChatTheme;
}

export function StagePill({ stage, theme }: StagePillProps) {
  const { t: contextTheme } = useChatTheme();
  const t = theme || contextTheme;
  const styles = getStagePillStyle(stage, t);

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 6,
        background: styles.bg,
        color: styles.color,
        whiteSpace: "nowrap",
      }}
    >
      {stage}
    </span>
  );
}
