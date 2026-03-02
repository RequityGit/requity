"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// ─── Theme Tokens ─────────────────────────────────────────────────────────────
export const themes = {
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
    gold: "#B8860B",
    goldSoft: "rgba(184,134,11,0.08)",
    success: "#1A8754",
    successSoft: "rgba(26,135,84,0.08)",
    warning: "#CC7A00",
    warningSoft: "rgba(204,122,0,0.08)",
    danger: "#D42620",
    dangerSoft: "rgba(212,38,32,0.08)",
    blue: "#2563EB",
    blueSoft: "rgba(37,99,235,0.06)",
    shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
    shadowHover: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
    shadowFloat: "0 8px 24px rgba(0,0,0,0.08)",
    scrollThumb: "rgba(0,0,0,0.12)",
    headerBlur: "rgba(255,255,255,0.88)",
    badge: "#F0719B",
    badgeText: "#FFFFFF",
    chartLine: "#1A1A1A",
    chartFill: "rgba(26,26,26,0.06)",
    chartGrid: "rgba(0,0,0,0.04)",
    tooltipBg: "#1A1A1A",
    tooltipText: "#FFFFFF",
    invertedText: "#FFFFFF",
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
    gold: "#D4A84B",
    goldSoft: "rgba(212,168,75,0.1)",
    success: "#34C77B",
    successSoft: "rgba(52,199,123,0.1)",
    warning: "#F0A030",
    warningSoft: "rgba(240,160,48,0.1)",
    danger: "#EF4444",
    dangerSoft: "rgba(239,68,68,0.1)",
    blue: "#3B82F6",
    blueSoft: "rgba(59,130,246,0.1)",
    shadow: "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
    shadowHover: "0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)",
    shadowFloat: "0 8px 24px rgba(0,0,0,0.5)",
    scrollThumb: "rgba(255,255,255,0.1)",
    headerBlur: "rgba(12,12,12,0.88)",
    badge: "#F0719B",
    badgeText: "#000000",
    chartLine: "#F0F0F0",
    chartFill: "rgba(240,240,240,0.06)",
    chartGrid: "rgba(255,255,255,0.04)",
    tooltipBg: "#2A2A2A",
    tooltipText: "#F0F0F0",
    invertedText: "#0C0C0C",
  },
};

export type ThemeTokens = {
  [K in keyof (typeof themes)["light"]]: string;
};
export type ThemeMode = "light" | "dark";

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  t: ThemeTokens;
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function CEOThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const saved = localStorage.getItem("requity-dashboard-theme") as ThemeMode | null;
    if (saved === "dark" || saved === "light") setMode(saved);
  }, []);

  const toggleMode = () => {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem("requity-dashboard-theme", next);
  };

  return (
    <ThemeContext.Provider value={{ t: themes[mode], mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useCEOTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useCEOTheme must be used within CEOThemeProvider");
  return ctx;
}

// ─── Helper Components ────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#3B82F6", "#EF4444", "#14B8A6",
];

export function CEOAvatar({ initials, size = 32 }: { initials: string; size?: number }) {
  const idx = initials.charCodeAt(0) % AVATAR_COLORS.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        flexShrink: 0,
        background: AVATAR_COLORS[idx],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 600,
        color: "#FFF",
      }}
    >
      {initials}
    </div>
  );
}

export function CEOStagePill({ stage, t }: { stage: string; t: ThemeTokens }) {
  const conf: Record<string, { bg: string; color: string }> = {
    Lead: { bg: t.accentSoft, color: t.textSecondary },
    Application: { bg: t.blueSoft, color: t.blue },
    Processing: { bg: t.blueSoft, color: t.blue },
    Underwriting: { bg: t.warningSoft, color: t.warning },
    Approved: { bg: t.goldSoft, color: t.gold },
    Closing: { bg: t.goldSoft, color: t.gold },
    Funded: { bg: t.successSoft, color: t.success },
  };
  const c = conf[stage] || conf.Lead;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 6,
        background: c.bg,
        color: c.color,
        whiteSpace: "nowrap",
      }}
    >
      {stage}
    </span>
  );
}

export function CEOPriorityDot({ priority, t }: { priority: string; t: ThemeTokens }) {
  const colors: Record<string, string> = {
    high: t.danger,
    hot: t.danger,
    medium: t.warning,
    on_hold: t.warning,
    normal: t.textTertiary,
    low: t.textTertiary,
  };
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: colors[priority] || t.textTertiary,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function CEOChartTooltip({
  active,
  payload,
  label,
  t,
  prefix = "$",
  suffix = "M",
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  t: ThemeTokens;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: t.tooltipBg,
        color: t.tooltipText,
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        border: `1px solid ${t.border}`,
        boxShadow: t.shadowFloat,
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {prefix}{payload[0].value}{suffix}
      </div>
      <div
        style={{
          fontSize: 11,
          color: t.textTertiary,
          fontFamily: "'Inter', sans-serif",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
