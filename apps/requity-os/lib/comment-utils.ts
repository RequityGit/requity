/**
 * Utilities for @mention parsing and comment rendering.
 *
 * Mention format in stored text: @[Display Name](user-uuid)
 */

/** Extract mentioned user IDs from a comment string */
export function extractMentionIds(text: string): string[] {
  const regex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  const ids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    ids.push(match[2]);
  }
  return ids;
}

/** Split comment text into segments for rendering (text vs mention) */
export interface CommentSegment {
  type: "text" | "mention";
  value: string;
  userId?: string;
}

export function parseComment(text: string): CommentSegment[] {
  const regex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  const segments: CommentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "mention", value: match[1], userId: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

/** Format a relative time string */
export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
