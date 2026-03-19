import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Requity Group",
  description:
    "Privacy Policy for TRG Management LLC d/b/a Requity, Requity Lending, and TRG Resorts. How we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main>
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: 15, color: "var(--navy-text-mid)" }}>
            TRG Management LLC &amp; Affiliated Trade Names
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      <section className="light-zone" style={{ padding: "clamp(48px, 8vw, 80px) 0" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="legal-content">
            <p style={metaStyle}>
              <strong>Effective Date:</strong> March 19, 2026<br />
              <strong>Last Updated:</strong> March 19, 2026
            </p>

            <p style={bodyStyle}>
              This Privacy Policy describes how TRG Management LLC and its trade names including Requity, Requity Lending, Requity LLC, and TRG Resorts (collectively, &ldquo;Requity,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collect, use, and protect your personal information when you interact with our websites, services, AI-powered chat and voice agents, and other communication channels.
            </p>

            <h2 style={headingStyle}>1. Information We Collect</h2>
            <p style={bodyStyle}>We may collect the following types of personal information:</p>
            <ul style={listStyle}>
              <li style={liStyle}><strong>Contact information:</strong> Name, email address, phone number, mailing address</li>
              <li style={liStyle}><strong>Inquiry details:</strong> Reservation requests, stay dates, site preferences, party size, loan inquiry details</li>
              <li style={liStyle}><strong>Communication records:</strong> Transcripts of chat and voice conversations with our AI assistants and team members</li>
              <li style={liStyle}><strong>Device and usage data:</strong> IP address, browser type, pages visited, referring URLs</li>
              <li style={liStyle}><strong>Financial information:</strong> Only when voluntarily submitted as part of a loan application or investment inquiry</li>
            </ul>

            <h2 style={headingStyle}>2. How We Collect Information</h2>
            <p style={bodyStyle}>We collect information when you:</p>
            <ul style={listStyle}>
              <li style={liStyle}>Visit our websites (requitygroup.com, arrowcreekcamp.com, covecreekrvresort.com, and affiliated domains)</li>
              <li style={liStyle}>Interact with our AI-powered chat or voice assistants</li>
              <li style={liStyle}>Submit a contact form, reservation request, or loan application</li>
              <li style={liStyle}>Communicate with us via phone, email, or text message</li>
              <li style={liStyle}>Provide your phone number and request that we send you information via SMS</li>
            </ul>

            <h2 style={headingStyle}>3. How We Use Your Information</h2>
            <p style={bodyStyle}>We use the information we collect to:</p>
            <ul style={listStyle}>
              <li style={liStyle}>Respond to your inquiries and provide requested information</li>
              <li style={liStyle}>Send reservation booking links and callback confirmations via SMS when you request them</li>
              <li style={liStyle}>Process reservation and loan applications</li>
              <li style={liStyle}>Improve our services, AI assistants, and customer experience</li>
              <li style={liStyle}>Send transactional communications related to your interactions with us</li>
              <li style={liStyle}>Comply with legal obligations</li>
            </ul>

            <h2 style={headingStyle}>4. SMS Communications</h2>
            <p style={bodyStyle}>
              When you provide your phone number during an interaction with one of our AI-powered chat or voice assistants and request that we text you information, you consent to receive SMS messages from us. These messages are limited to:
            </p>
            <ul style={listStyle}>
              <li style={liStyle}>Reservation booking links you have requested</li>
              <li style={liStyle}>Callback confirmations</li>
            </ul>
            <p style={bodyStyle}>
              We do not send marketing or promotional text messages. Message frequency varies; typically 1-2 messages per interaction. Message and data rates may apply. You can opt out at any time by replying STOP. For full SMS terms, see our <Link href="/sms-terms" style={{ color: "var(--gold)" }}>SMS Terms &amp; Conditions</Link>.
            </p>
            <p style={{ ...bodyStyle, fontWeight: 600, color: "var(--text)" }}>
              We do not sell, share, or rent your phone number or any personal information to third parties for marketing purposes.
            </p>

            <h2 style={headingStyle}>5. Information Sharing</h2>
            <p style={bodyStyle}>We do not sell your personal information. We may share information only in the following circumstances:</p>
            <ul style={listStyle}>
              <li style={liStyle}><strong>Service providers:</strong> With trusted vendors who assist in operating our services (e.g., SMS delivery, payment processing, property management software), under strict confidentiality agreements</li>
              <li style={liStyle}><strong>Legal compliance:</strong> When required by law, regulation, or legal process</li>
              <li style={liStyle}><strong>Business operations:</strong> Between Requity affiliated entities for the purpose of fulfilling your request</li>
            </ul>

            <h2 style={headingStyle}>6. Data Security</h2>
            <p style={bodyStyle}>We implement reasonable administrative, technical, and physical safeguards to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of electronic transmission or storage is 100% secure.</p>

            <h2 style={headingStyle}>7. Data Retention</h2>
            <p style={bodyStyle}>We retain your personal information for as long as necessary to fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements.</p>

            <h2 style={headingStyle}>8. Your Rights</h2>
            <p style={bodyStyle}>Depending on your jurisdiction, you may have the right to:</p>
            <ul style={listStyle}>
              <li style={liStyle}>Access, correct, or delete your personal information</li>
              <li style={liStyle}>Opt out of SMS communications by replying STOP to any message</li>
              <li style={liStyle}>Request information about how your data is used</li>
            </ul>
            <p style={bodyStyle}>To exercise any of these rights, contact us at <a href="mailto:info@requitygroup.com" style={{ color: "var(--gold)" }}>info@requitygroup.com</a>.</p>

            <h2 style={headingStyle}>9. Children&apos;s Privacy</h2>
            <p style={bodyStyle}>Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.</p>

            <h2 style={headingStyle}>10. Changes to This Policy</h2>
            <p style={bodyStyle}>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>

            <h2 style={headingStyle}>11. Contact Us</h2>
            <p style={bodyStyle}>If you have questions about this Privacy Policy, contact us at:</p>
            <p style={bodyStyle}>
              TRG Management LLC<br />
              Email: <a href="mailto:info@requitygroup.com" style={{ color: "var(--gold)" }}>info@requitygroup.com</a><br />
              Phone: <a href="tel:+18137106681" style={{ color: "var(--gold)" }}>(813) 710-6681</a>
            </p>

            <div style={footerStyle}>
              <p>&copy; 2026 TRG Management LLC. All rights reserved.</p>
              <p style={{ marginTop: 8 }}>
                <Link href="/sms-terms" style={{ color: "var(--gold)" }}>SMS Terms</Link>
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
  fontFamily: "var(--font-serif)", fontSize: 20, color: "var(--text)",
  fontWeight: 400, marginTop: 32, marginBottom: 12, paddingBottom: 8,
  borderBottom: "1px solid var(--border-light)",
};
const bodyStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.75, color: "var(--text-mid)", marginBottom: 16,
};
const metaStyle: React.CSSProperties = {
  fontSize: 14, lineHeight: 1.7, color: "var(--text-mid)", marginBottom: 24,
};
const listStyle: React.CSSProperties = { margin: "12px 0 16px 24px", listStyleType: "disc" };
const liStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.7, color: "var(--text-mid)", marginBottom: 6,
};
const footerStyle: React.CSSProperties = {
  marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border-light)",
  fontSize: 13, color: "var(--text-light)", textAlign: "center",
};
