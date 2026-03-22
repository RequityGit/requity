/**
 * Team color system — accent colors for user avatars and author names.
 *
 * Priority: profile.accent_color > deterministic hash fallback.
 * Used in activity feeds, note cards, and any component showing user identity.
 */

export const ACCENT_COLOR_PRESETS = [
  "#6366f1", // indigo
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#06b6d4", // cyan
] as const;

/**
 * Returns the accent color for a user. Falls back to a deterministic
 * hash-based color if no accent_color is set on the profile.
 */
export function getUserColor(profile: {
  accent_color?: string | null;
  id: string;
}): string {
  if (profile.accent_color) return profile.accent_color;
  let hash = 0;
  for (let i = 0; i < profile.id.length; i++) {
    hash = (hash * 31 + profile.id.charCodeAt(i)) | 0;
  }
  return ACCENT_COLOR_PRESETS[Math.abs(hash) % ACCENT_COLOR_PRESETS.length];
}

/**
 * Same as getUserColor but returns a Tailwind class pair for text coloring.
 * Used when inline style is not desirable (e.g., existing NoteCard pattern).
 */
/**
 * Derives opacity variants from a hex color string for tinted UI elements.
 * Used by like pills, toolbar buttons, and particle bursts.
 */
export function colorVariants(hex: string): {
  base: string;
  bg: string;
  border: string;
  hover: string;
} {
  return {
    base: hex,
    bg: `${hex}1a`,       // ~10% opacity
    border: `${hex}33`,   // ~20% opacity
    hover: `${hex}14`,    // ~8% opacity
  };
}

export function getUserColorClass(authorId: string): string {
  const AUTHOR_COLORS = [
    "text-blue-600 dark:text-blue-400",
    "text-violet-600 dark:text-violet-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-amber-600 dark:text-amber-400",
    "text-rose-600 dark:text-rose-400",
    "text-cyan-600 dark:text-cyan-400",
    "text-fuchsia-600 dark:text-fuchsia-400",
    "text-orange-600 dark:text-orange-400",
    "text-teal-600 dark:text-teal-400",
    "text-indigo-600 dark:text-indigo-400",
  ];
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) {
    hash = (hash * 31 + authorId.charCodeAt(i)) | 0;
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}