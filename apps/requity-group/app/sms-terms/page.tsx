import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "SMS Terms & Conditions | Requity Lending",
  description:
    "SMS Terms & Conditions for Requity Lending - A Division of The Requity Group. Opt-in consent, message types, frequency, opt-out instructions, and privacy.",
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
            Requity Lending &mdash; A Division of The Requity Group
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Content */}
      <section className="light-zone" style={{ padding: "clamp(48px, 8vw, 80px) 0" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="legal-content">
            <h2 style={headingStyle}>CONSENT &amp; OPT-IN</h2>
            <p style={bodyStyle}>
              By providing your phone number to Requity Lending through our website
              (requitygroup.com), loan application portal (app.requitygroup.com),
              contact forms, or during a phone call with our team, you consent to
              receive text messages from Requity LLC (d/b/a Requity Lending). Messages
              may include:
            </p>
            <ul style={listStyle}>
              <li style={liStyle}>Loan status updates and application notifications</li>
              <li style={liStyle}>Appointment reminders and follow-ups</li>
              <li style={liStyle}>Document request reminders</li>
              <li style={liStyle}>Missed call notifications</li>
              <li style={liStyle}>Marketing promotions about our lending products and services</li>
            </ul>

            <h2 style={headingStyle}>MESSAGE FREQUENCY</h2>
            <p style={bodyStyle}>
              Message frequency varies. You may receive up to 5 messages per week
              depending on the status of your loan application and your communication
              preferences.
            </p>

            <h2 style={headingStyle}>OPT-OUT</h2>
            <p style={bodyStyle}>
              You can opt out at any time by replying STOP to any message. You may
              also reply HELP for assistance. After opting out, you will receive one
              final confirmation and will not receive further texts.
            </p>

            <h2 style={headingStyle}>COST</h2>
            <p style={bodyStyle}>
              Message and data rates may apply. Requity LLC does not charge for SMS
              messages, but your carrier&apos;s standard rates apply.
            </p>

            <h2 style={headingStyle}>PRIVACY</h2>
            <p style={bodyStyle}>
              Your phone number and personal information will not be sold, rented, or
              shared with third parties for marketing purposes. For full details, see
              our <Link href="/privacy-policy" style={{ color: "var(--gold)" }}>Privacy Policy</Link> (https://requitygroup.com/privacy-policy).
            </p>

            <h2 style={headingStyle}>CONSENT METHODS</h2>
            <p style={bodyStyle}>
              End users consent to receive messages through the following methods:
            </p>
            <ol style={{ ...listStyle, listStyleType: "decimal" }}>
              <li style={liStyle}>
                Submitting a loan inquiry or application through requitygroup.com or
                app.requitygroup.com where they provide their phone number and
                agree to receive SMS communications
              </li>
              <li style={liStyle}>
                Providing verbal consent during a phone call with our lending team,
                documented in our CRM system
              </li>
              <li style={liStyle}>
                Providing their phone number on a contact form and agreeing to our
                Terms of Service which include SMS consent
              </li>
            </ol>
            <p style={bodyStyle}>
              All consent is recorded with a timestamp.
            </p>

            <h2 style={headingStyle}>CONTACT</h2>
            <p style={bodyStyle}>Requity Lending</p>
            <ul style={listStyle}>
              <li style={liStyle}>Email: <a href="mailto:contact@requitygroup.com" style={{ color: "var(--gold)" }}>contact@requitygroup.com</a></li>
              <li style={liStyle}>Phone: <a href="tel:+18137106681" style={{ color: "var(--gold)" }}>(813) 710-6681</a></li>
            </ul>

            {/* Footer */}
            <div style={{
              marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-light)",
              fontSize: 13, color: "var(--text-light)", textAlign: "center",
            }}>
              <p>&copy; 2026 Requity LLC. All rights reserved.</p>
              <p style={{ marginTop: 8 }}>
                <Link href="/privacy-policy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>
                {" | "}
                <Link href="/terms" style={{ color: "var(--gold)" }}>Terms of Service</Link>
              </p>
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
