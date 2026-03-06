"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useTheme } from "@/components/theme-provider";
import {
  chatThemes,
  type ChatTheme,
  type ChatThemeMode,
} from "@/lib/chat-theme";

interface ChatThemeContextValue {
  mode: ChatThemeMode;
  t: ChatTheme;
}

const ChatThemeContext = createContext<ChatThemeContextValue>({
  mode: "dark",
  t: chatThemes.dark,
});

export function ChatThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const mode: ChatThemeMode = theme === "dark" ? "dark" : "light";
  const t = chatThemes[mode];

  return (
    <ChatThemeContext.Provider value={{ mode, t }}>
      {children}
    </ChatThemeContext.Provider>
  );
}

export function useChatTheme() {
  return useContext(ChatThemeContext);
}
