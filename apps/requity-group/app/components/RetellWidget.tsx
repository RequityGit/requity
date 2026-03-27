'use client';

import { useEffect } from 'react';

export function RetellWidget() {
  useEffect(() => {
    // If widget is already present and working, skip
    if (document.querySelector('retell-chat-widget')) return;

    // Remove any stale script tag from SSR
    const existing = document.getElementById('retell-widget');
    if (existing) existing.remove();

    // Create fresh script tag with all data attributes
    const script = document.createElement('script');
    script.id = 'retell-widget';
    script.src = 'https://dashboard.retellai.com/retell-widget.js';
    script.type = 'module';
    script.setAttribute('data-public-key', 'public_key_b2e3b961e5076c4619ab6');
    script.setAttribute('data-agent-id', 'agent_b392bf026c0c3af8395b9e9c2d');
    script.setAttribute('data-agent-version', '0');
    script.setAttribute('data-title', 'Chat with Requity Group');
    script.setAttribute('data-bot-name', 'Sarah');
    script.setAttribute('data-color', '#1a1a2e');
    script.setAttribute('data-logo-url', '/images/requity-chat-logo.png');
    script.setAttribute(
      'data-popup-message',
      'Hi there! I am here to help with any question you may have. Click here to chat with our team.'
    );
    script.setAttribute(
      'data-begin-message',
      'Welcome to Requity Group, I\'m Sarah from our team. What can I help you with today?'
    );
    script.setAttribute('data-show-ai-popup', 'true');
    script.setAttribute('data-show-ai-popup-time', '5');
    document.head.appendChild(script);

    return () => {
      const s = document.getElementById('retell-widget');
      if (s) s.remove();
      const w = document.querySelector('retell-chat-widget');
      if (w) w.remove();
    };
  }, []);

  return null;
}
