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
        data-public-key="public_key_b2e3b961e5076c4619ab6"
        data-agent-id="agent_b392bf026c0c3af8395b9e9c2d"
        data-agent-version="0"
        data-title="Chat with Requity Lending"
        data-bot-name="Sarah"
        data-color="#1a1a2e"
        data-logo-url="/images/requity-chat-logo.png"
        data-popup-message="Hi there! I can help you get a term sheet today. Click here to chat with our team."
        data-show-ai-popup="true"
        data-show-ai-popup-time="5"
      />
    </>
  );
}
