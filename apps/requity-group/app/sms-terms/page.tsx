import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | TRG Resorts",
  description:
    "SMS Terms & Conditions for TRG Management LLC d/b/a TRG Resorts campground and RV resort properties. Opt-in consent, message types, frequency, opt-out instructions, and privacy.",
};

export default function SMSTermsPage() {
  return (
    <main>
      {/* Header */}
      <section
        className="dark-zone"
        style={{
          paddingTop: "clamp(120px, 16vw, 180px)",
          paddingBottom: "clamp(40px, 6vw, 60px)",
        }}
      >
        <div className="container" style={{ maxWidth: 760 }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(28px, 3.5vw, 40px)",
              color: "#fff",
              fontWeight: 400,
              marginBottom: 8,
            }}
          >
            SMS Terms &amp; Conditions
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--navy-text-mid)",
            }}
          >
            TRG Management LLC (d/b/a TRG Resorts) &mdash; Campground &amp; RV Resort Properties
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Content */}
      <section className="light-zone" style={{ padding: "clamp(48px, 8vw, 80px) 0" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="legal-content">
            {/* Consent Box */}
            <div
              style={{
                background: "var(--cream)",
                borderLeft: "3px solid var(--gold)",
                padding: "20px 24px",
                borderRadius: 4,
                marginBottom: 32,
              }}
            >
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text)", fontWeight: 500, margin: 0 }}>
                By providing your phone number to any TRG Resorts property through our website chat agents, voice agents, or contact forms, you consent to receive text messages from TRG Management LLC (d/b/a TRG Resorts). Messages may include reservation booking links, callback confirmations, and property information you have requested.
              </p>
            </div>

            <p style={bodyStyle}>
              Your consent is obtained when you voluntarily provide your phone number during an interaction with one of our AI-powered chat or voice assistants and request that we send you information via text message. You will only receive SMS messages that you have specifically requested during your interaction.
            </p>

            <h2 style={headingStyle}>What Messages You Will Receive</h2>
            <p style={bodyStyle}>TRG Management LLC (d/b/a TRG Resorts) sends the following types of transactional SMS messages:</p>
            <ul style={listStyle}>
              <li style={liStyle}><strong>Reservation booking links</strong> &mdash; A direct link to book your stay at the property you inquired about</li>
              <li style={liStyle}><strong>Callback confirmations</strong> &mdash; Confirmation that your callback request has been received and a team member will contact you</li>
            </ul>
            <p style={bodyStyle}>We do not send marketing or promotional text messages. All messages are in direct response to a request you made during a conversation with our team or AI assistant.</p>

            <h2 style={headingStyle}>Message Frequency</h2>
            <p style={bodyStyle}>Message frequency varies. You will typically receive 1-2 messages per interaction. You will not receive recurring or scheduled messages unless you initiate a new conversation with one of our properties.</p>

            <h2 style={headingStyle}>Participating Properties</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "16px 0 24px" }}>
              {[
                { name: "Arrow Creek Campground", loc: "Gatlinburg, TN", url: "arrowcreekcamp.com" },
                { name: "Cove Creek RV Resort", loc: "Sevierville, TN", url: "covecreekrv.com" },
              ].map((p, i) => (
                <div key={i} style={{
                  background: "var(--cream)", border: "1px solid var(--border-light)",
                  borderRadius: 8, padding: 16,
                }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{p.name}</p>
                  <p style={{ fontSize: 13, color: "var(--text-mid)", margin: "0 0 4px" }}>{p.loc}</p>
                  <a href={`https://${p.url}`} style={{ fontSize: 13, color: "var(--gold)" }}>{p.url}</a>
                </div>
              ))}
            </div>

            <h2 style={headingStyle}>Opt-Out</h2>
            <p style={bodyStyle}>You can opt out of receiving SMS messages at any time by replying <strong>STOP</strong> to any message you receive from us. You may also reply <strong>HELP</strong> for assistance. After opting out, you will receive one final confirmation message and will not receive further texts unless you re-initiate contact and provide consent again.</p>

            <h2 style={headingStyle}>Cost</h2>
            <p style={bodyStyle}>Message and data rates may apply depending on your mobile carrier and plan. TRG Management LLC (d/b/a TRG Resorts) does not charge for SMS messages, but your carrier&apos;s standard messaging rates will apply.</p>

            <h2 style={headingStyle}>Privacy</h2>
            <p style={bodyStyle}>Your phone number and personal information will not be sold, rented, or shared with third parties for marketing purposes. Your information is used solely for the purpose of responding to your inquiry. For full details, see our <Link href="/privacy-policy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>.</p>

            <h2 style={headingStyle}>Contact</h2>
            <p style={bodyStyle}>If you have questions about our SMS program, contact us at:</p>
            <ul style={listStyle}>
              <li style={liStyle}>Email: <a href="mailto:info@requitygroup.com" style={{ color: "var(--gold)" }}>info@requitygroup.com</a></li>
              <li style={liStyle}>Phone: <a href="tel:+18137106681" style={{ color: "var(--gold)" }}>(813) 710-6681</a></li>
            </ul>

            {/* Footer */}
            <div style={{
              marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-light)",
              fontSize: 13, color: "var(--text-light)", textAlign: "center",
            }}>
              <p>&copy; 2026 TRG Management LLC. All rights reserved.</p>
              <p style={{ marginTop: 8 }}>
                <Link href="/privacy-policy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>
                {" | "}
                <Link href="/terms" style={{ color: "var(--gold)" }}>Terms of Service</Link>
              </p>
              <p style={{ marginTop: 8 }}>Last updated: March 19, 2026</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: 20,
  color: "var(--text)",
  fontWeight: 400,
  marginTop: 32,
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border-light)",
};

const bodyStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--text-mid)",
  marginBottom: 16,
};

const listStyle: React.CSSProperties = {
  margin: "12px 0 16px 24px",
  listStyleType: "disc",
};

const liStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.7,
  color: "var(--text-mid)",
  marginBottom: 8,
};
