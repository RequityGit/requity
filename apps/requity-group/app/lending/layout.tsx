export default function LendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* eslint-disable-next-line @next/next/no-sync-scripts -- module scripts are async by spec; plain <script> needed for SSR */}
      <script
        id="retell-widget"
        src="https://dashboard.retellai.com/retell-widget.js"
        type="module"
        async
        data-public-key="public_key_b2e3b961e5076c4619ab6"
        data-agent-id="agent_b392bf026c0c3af8395b9e9c2d"
        data-agent-version="0"
        data-title="Chat with Requity Lending"
        data-bot-name="Sarah"
        data-color="#1a1a2e"
        data-popup-message="Have a deal? Get a term sheet in 24 hours."
        data-show-ai-popup="true"
        data-show-ai-popup-time="5"
        data-avatar="https://edhlkknvlczhbowasjna.supabase.co/storage/v1/object/public/brand-assets/Diamond%20Favicon%20White.svg"
      />
      <script
        id="retell-auto-greet"
        type="module"
        dangerouslySetInnerHTML={{
          __html: `
            function waitForWidget() {
              const widget = document.querySelector('retell-chat-widget');
              if (widget && widget.shadowRoot) {
                const observer = new MutationObserver(() => {
                  const chatInput = widget.shadowRoot.querySelector('textarea, input[type="text"]');
                  const messages = widget.shadowRoot.querySelectorAll('[class*="message"]');
                  if (chatInput && messages.length === 0) {
                    setTimeout(() => {
                      chatInput.value = 'hi';
                      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                      const sendBtn = widget.shadowRoot.querySelector('button[type="submit"], button[class*="send"]');
                      if (sendBtn) sendBtn.click();
                    }, 500);
                  }
                });
                observer.observe(widget.shadowRoot, { childList: true, subtree: true });
              } else {
                setTimeout(waitForWidget, 500);
              }
            }
            waitForWidget();
          `,
        }}
      />
    </>
  );
}
