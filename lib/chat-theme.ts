// Chat system theme tokens
// Clean fintech aesthetic — Ramp × Robinhood × AppFolio
// Two modes: Light (clean white) and Dark (true charcoal/black)

export type ChatThemeMode = "light" | "dark";

export interface ChatTheme {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  bgActive: string;
  bgCard: string;
  surface: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  accentHover: string;
  gold: string;
  goldSoft: string;
  goldBorder: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  blue: string;
  blueSoft: string;
  ownBubble: string;
  ownBubbleText: string;
  otherBubble: string;
  otherBubbleText: string;
  shadow: string;
  shadowHover: string;
  shadowFloat: string;
  scrollThumb: string;
  composer: string;
  composerBorder: string;
  kbd: string;
  kbdBorder: string;
  badge: string;
  badgeText: string;
  divider: string;
  sidebarActive: string;
  headerBlur: string;
}

export const chatThemes: Record<ChatThemeMode, ChatTheme> = {
  light: {
    bg: "#FFFFFF",
    bgSecondary: "#F7F7F8",
    bgTertiary: "#EFEFEF",
    bgHover: "#F0F0F2",
    bgActive: "#E8E8EC",
    bgCard: "#FFFFFF",
    surface: "#FAFAFA",
    border: "rgba(0,0,0,0.08)",
    borderLight: "rgba(0,0,0,0.04)",
    borderFocus: "rgba(0,0,0,0.16)",
    text: "#1A1A1A",
    textSecondary: "#6B6B6B",
    textTertiary: "#999999",
    textMuted: "#BFBFBF",
    accent: "#1A1A1A",
    accentSoft: "rgba(26,26,26,0.06)",
    accentHover: "rgba(26,26,26,0.1)",
    gold: "#6B6B6B",
    goldSoft: "rgba(0,0,0,0.04)",
    goldBorder: "rgba(0,0,0,0.08)",
    success: "#1A8754",
    successSoft: "rgba(26,135,84,0.08)",
    warning: "#CC7A00",
    warningSoft: "rgba(204,122,0,0.08)",
    danger: "#D42620",
    dangerSoft: "rgba(212,38,32,0.08)",
    blue: "#2563EB",
    blueSoft: "rgba(37,99,235,0.06)",
    ownBubble: "#1A1A1A",
    ownBubbleText: "#FFFFFF",
    otherBubble: "#F0F0F2",
    otherBubbleText: "#1A1A1A",
    shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
    shadowHover: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
    shadowFloat: "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
    scrollThumb: "rgba(0,0,0,0.12)",
    composer: "#FFFFFF",
    composerBorder: "rgba(0,0,0,0.1)",
    kbd: "rgba(0,0,0,0.04)",
    kbdBorder: "rgba(0,0,0,0.08)",
    badge: "#1A1A1A",
    badgeText: "#FFFFFF",
    divider: "rgba(0,0,0,0.06)",
    sidebarActive: "rgba(0,0,0,0.04)",
    headerBlur: "rgba(255,255,255,0.85)",
  },
  dark: {
    bg: "#0C0C0C",
    bgSecondary: "#141414",
    bgTertiary: "#1C1C1C",
    bgHover: "#1E1E1E",
    bgActive: "#262626",
    bgCard: "#161616",
    surface: "#111111",
    border: "rgba(255,255,255,0.07)",
    borderLight: "rgba(255,255,255,0.04)",
    borderFocus: "rgba(255,255,255,0.16)",
    text: "#F0F0F0",
    textSecondary: "#888888",
    textTertiary: "#606060",
    textMuted: "#404040",
    accent: "#F0F0F0",
    accentSoft: "rgba(240,240,240,0.06)",
    accentHover: "rgba(240,240,240,0.1)",
    gold: "#888888",
    goldSoft: "rgba(255,255,255,0.05)",
    goldBorder: "rgba(255,255,255,0.1)",
    success: "#34C77B",
    successSoft: "rgba(52,199,123,0.1)",
    warning: "#F0A030",
    warningSoft: "rgba(240,160,48,0.1)",
    danger: "#EF4444",
    dangerSoft: "rgba(239,68,68,0.1)",
    blue: "#3B82F6",
    blueSoft: "rgba(59,130,246,0.1)",
    ownBubble: "#2A2A2A",
    ownBubbleText: "#F0F0F0",
    otherBubble: "#1A1A1A",
    otherBubbleText: "#E0E0E0",
    shadow: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
    shadowHover: "0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)",
    shadowFloat: "0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
    scrollThumb: "rgba(255,255,255,0.1)",
    composer: "#161616",
    composerBorder: "rgba(255,255,255,0.08)",
    kbd: "rgba(255,255,255,0.05)",
    kbdBorder: "rgba(255,255,255,0.08)",
    badge: "#F0F0F0",
    badgeText: "#0C0C0C",
    divider: "rgba(255,255,255,0.05)",
    sidebarActive: "rgba(255,255,255,0.05)",
    headerBlur: "rgba(12,12,12,0.85)",
  },
};

// Avatar color palette — cycle through based on user initial
export const AVATAR_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#14B8A6",
];

// Notification badge color
export const BADGE_COLOR = "#F0719B";

// Online indicator
export const ONLINE_COLOR = "#2BAC76";

// Stage pill configuration
export type LoanStageDisplay =
  | "Underwriting"
  | "Due Diligence"
  | "Closing"
  | "Funded"
  | "Lead"
  | "Processing"
  | "Approved"
  | "Servicing";

export function getStagePillStyle(
  stage: string,
  t: ChatTheme
): { bg: string; color: string } {
  const normalized = stage.toLowerCase().replace(/_/g, " ");
  if (normalized === "underwriting")
    return { bg: t.warningSoft, color: t.warning };
  if (normalized === "due diligence") return { bg: t.blueSoft, color: t.blue };
  if (normalized === "closing") return { bg: t.goldSoft, color: t.gold };
  if (
    normalized === "funded" ||
    normalized === "approved" ||
    normalized === "clear to close"
  )
    return { bg: t.successSoft, color: t.success };
  if (normalized === "processing")
    return { bg: t.warningSoft, color: t.warning };
  if (normalized === "servicing")
    return { bg: t.blueSoft, color: t.blue };
  // Default — lead, etc.
  return { bg: t.accentSoft, color: t.textSecondary };
}

// Map DB loan stage to display label
export function getStageDisplayLabel(stage: string): string {
  const map: Record<string, string> = {
    lead: "Lead",
    application: "Application",
    processing: "Processing",
    underwriting: "Underwriting",
    approved: "Approved",
    clear_to_close: "Clear to Close",
    funded: "Funded",
    servicing: "Servicing",
    payoff: "Payoff",
    default: "Default",
    reo: "REO",
    paid_off: "Paid Off",
  };
  return map[stage] || stage.replace(/_/g, " ");
}
