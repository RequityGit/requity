import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
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
        brand: {
          navy: "#0C1C30",
          navyMid: "#122842",
          navyLight: "#1A3456",
          gold: "#A08A4E",
          goldMuted: "#B89D5C",
          bg: "#F8F6F1",
          cream: "#F2EFE8",
          creamDark: "#E8E5DF",
          white: "#FFFFFF",
          text: "#1C1C1C",
          textMid: "#5C5C5C",
          textLight: "#9A9A9A",
          border: "#E0DCD4",
          borderLight: "#EBE8E1",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        serif: ["Georgia", "'Times New Roman'", "serif"],
        sans: ["'Inter'", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        content: "1400px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
