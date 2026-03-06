import type { ChatChannelType, ChatChannelWithUnread, ChatChannelGroup } from "./chat-types";

/**
 * Format a timestamp for chat display.
 * - Today: "2:34 PM"
 * - This week: "Mon"
 * - This year: "Jan 5"
 * - Older: "1/5/24"
 */
export function formatChatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

/**
 * Format a timestamp for a message bubble.
 * Shows "2:34 PM" for today, "Jan 5, 2:34 PM" otherwise.
 */
export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return time;
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${dateLabel}, ${time}`;
}

/**
 * Format a full date separator for the message list.
 */
export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0 && date.getDate() === now.getDate()) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

/**
 * Get initials from a name for avatar fallbacks.
 */
export function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Map channel type to a display icon name (lucide).
 */
export function getChannelTypeIcon(type: ChatChannelType): string {
  const map: Record<ChatChannelType, string> = {
    deal_room: "landmark",
    team: "users",
    direct: "message-circle",
    group: "messages-square",
    investor_room: "piggy-bank",
    borrower_room: "building-2",
    project_room: "folder-kanban",
  };
  return map[type] || "hash";
}

/**
 * Get the display label for a channel type group.
 */
export function getChannelGroupLabel(type: ChatChannelType | "pinned"): string {
  const labels: Record<string, string> = {
    pinned: "Pinned",
    deal_room: "Deal Rooms",
    team: "Team Channels",
    direct: "Direct Chatter",
    group: "Group Chatter",
    investor_room: "Investor Rooms",
    borrower_room: "Borrower Rooms",
    project_room: "Project Rooms",
  };
  return labels[type] || type;
}

/**
 * Group channels by type, with pinned channels as a separate group at the top.
 */
export function groupChannels(channels: ChatChannelWithUnread[]): ChatChannelGroup[] {
  const pinned = channels.filter((c) => c.is_pinned);
  const unpinned = channels.filter((c) => !c.is_pinned);

  const groupOrder: (ChatChannelType | "pinned")[] = [
    "pinned",
    "deal_room",
    "team",
    "direct",
    "group",
    "investor_room",
    "borrower_room",
    "project_room",
  ];

  const groups: ChatChannelGroup[] = [];

  if (pinned.length > 0) {
    groups.push({ label: "Pinned", type: "pinned", channels: pinned });
  }

  const byType = new Map<ChatChannelType, ChatChannelWithUnread[]>();
  for (const ch of unpinned) {
    const list = byType.get(ch.channel_type) || [];
    list.push(ch);
    byType.set(ch.channel_type, list);
  }

  for (const type of groupOrder) {
    if (type === "pinned") continue;
    const list = byType.get(type as ChatChannelType);
    if (list && list.length > 0) {
      groups.push({
        label: getChannelGroupLabel(type),
        type: type as ChatChannelType,
        channels: list,
      });
    }
  }

  return groups;
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string | null, maxLen: number = 60): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

/**
 * Check if two dates are on the same calendar day.
 */
export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getDate() === db.getDate() &&
    da.getMonth() === db.getMonth() &&
    da.getFullYear() === db.getFullYear()
  );
}
