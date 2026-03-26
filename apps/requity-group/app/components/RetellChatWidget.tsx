"use client";

import { useEffect } from "react";

export default function RetellChatWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://dashboard.retellai.com/retell-widget.js";
    script.type = "module";
    script.dataset.publicKey = "public_key_b2e3b961e5076c4619ab6";
    script.dataset.agentId = "agent_b392bf026c0c3af8395b9e9c2d";
    script.dataset.agentVersion = "0";
    script.dataset.title = "Chat with Requity Lending";
    script.dataset.botName = "Sarah";
    script.dataset.color = "#1a1a2e";
    script.dataset.popupMessage =
      "Have a deal? Get a term sheet in 24 hours.";
    script.dataset.showAiPopup = "true";
    script.dataset.showAiPopupTime = "5";
    document.body.appendChild(script);

    return () => {
      script.remove();
      document.querySelector("retell-chat-widget")?.remove();
    };
  }, []);

  return null;
}
