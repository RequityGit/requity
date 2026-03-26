"use client";

import { useEffect } from "react";

const WIDGET_ATTRS: Record<string, string> = {
  "data-public-key": "public_key_b2e3b961e5076c4619ab6",
  "data-agent-id": "agent_b392bf026c0c3af8395b9e9c2d",
  "data-agent-version": "0",
  "data-title": "Chat with Requity Lending",
  "data-bot-name": "Sarah",
  "data-color": "#1a1a2e",
  "data-popup-message": "Have a deal? Get a term sheet in 24 hours.",
  "data-show-ai-popup": "true",
  "data-show-ai-popup-time": "5",
};

export default function RetellChatWidget() {
  useEffect(() => {
    // Skip if the script is already present (e.g. StrictMode double-mount)
    if (document.querySelector('script[src*="retell-widget"]')) return;

    const script = document.createElement("script");
    script.src = "https://dashboard.retellai.com/retell-widget.js";
    script.type = "module";
    for (const [attr, value] of Object.entries(WIDGET_ATTRS)) {
      script.setAttribute(attr, value);
    }
    document.body.appendChild(script);

    return () => {
      script.remove();
      document.querySelector("retell-chat-widget")?.remove();
    };
  }, []);

  return null;
}
