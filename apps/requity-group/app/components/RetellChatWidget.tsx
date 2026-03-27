export default function RetellChatWidget() {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `<script
          id="retell-widget"
          src="https://dashboard.retellai.com/retell-widget.js"
          type="module"
          data-public-key="public_key_b2e3b961e5076c4619ab6"
          data-agent-id="agent_8921021b191a03d12b216949b1"
          data-agent-version="0"
          data-title="Chat with Requity Lending"
          data-bot-name="Sarah"
          data-color="#1a1a2e"
          data-popup-message="Have a deal? Get a term sheet in 24 hours."
          data-show-ai-popup="true"
          data-show-ai-popup-time="5"
        ></script>`,
      }}
    />
  );
}
