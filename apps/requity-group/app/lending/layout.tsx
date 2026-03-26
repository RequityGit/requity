import Script from "next/script";

export default function LendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Script
        id="retell-widget"
        src="https://dashboard.retellai.com/retell-widget.js"
        type="module"
        strategy="beforeInteractive"
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
    </>
  );
}
