import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Sidebar uses theme tokens
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-bg))",
          foreground: "hsl(var(--sidebar-fg))",
          border: "hsl(var(--sidebar-border))",
          active: "hsl(var(--sidebar-active))",
          hover: "hsl(var(--sidebar-hover))",
        },
        // Gold accent (flat, no glow)
        gold: {
          DEFAULT: "#C5975B",
          light: "#D4AD72",
          pale: "#E8D5B0",
        },
        // Notification badge pink
        badge: {
          pink: "#F0719B",
        },
        // Dashboard semantic colors (light/dark via CSS vars)
        dash: {
          bg: "hsl(var(--dash-bg))",
          surface: "hsl(var(--dash-surface))",
          "surface-alt": "hsl(var(--dash-surface-alt))",
          "surface-hover": "hsl(var(--dash-surface-hover))",
          "text-sec": "hsl(var(--dash-text-sec))",
          "text-mut": "hsl(var(--dash-text-mut))",
          "text-faint": "hsl(var(--dash-text-faint))",
          success: "#1B7A44",
          warning: "#B8822A",
          danger: "#B23225",
          info: "#2E6EA6",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.8)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.45s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.4,0,0.2,1) both",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".tabular-nums": {
          "font-variant-numeric": "tabular-nums",
          "font-feature-settings": '"tnum"',
          "letter-spacing": "-0.025em",
        },
      });
    }),
  ],
} satisfies Config;

export default config;
