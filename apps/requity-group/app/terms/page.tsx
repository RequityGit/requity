import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Requity Group",
  description:
    "Terms of Service for TRG Management LLC d/b/a Requity, Requity Lending, and TRG Resorts. Governs use of websites, services, AI assistants, SMS communications, and reservation bookings.",
};

export default function TermsPage() {
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
            Terms of Service
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
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the websites, services, and communication channels operated by TRG Management LLC and its trade names including Requity, Requity Lending, Requity LLC, and TRG Resorts (collectively, &ldquo;Requity,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By using our services, you agree to these Terms.
            </p>

            <h2 style={headingStyle}>1. Services</h2>
            <p style={bodyStyle}>Requity operates campground and RV resort properties, a private real estate lending platform, and related investment services. Our websites include requitygroup.com, arrowcreekcamp.com, covecreekrvresort.com, and affiliated domains. We also operate AI-powered chat and voice assistants on our property websites to help guests with reservation inquiries.</p>

            <h2 style={headingStyle}>2. Use of Our Services</h2>
            <p style={bodyStyle}>You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
            <ul style={listStyle}>
              <li style={liStyle}>Use our services in any way that violates applicable law or regulation</li>
              <li style={liStyle}>Attempt to interfere with or disrupt the operation of our websites or services</li>
              <li style={liStyle}>Misrepresent your identity or provide false information</li>
              <li style={liStyle}>Use automated systems (other than our own AI assistants) to access our services without permission</li>
            </ul>

            <h2 style={headingStyle}>3. AI-Powered Assistants</h2>
            <p style={bodyStyle}>Our campground and RV resort properties use AI-powered chat and voice assistants to help answer guest inquiries, provide property information, and facilitate booking. These assistants are automated and may not always have complete or current information. For definitive answers on pricing, availability, and policies, we recommend confirming with our property management team directly.</p>

            <h2 style={headingStyle}>4. SMS Communications</h2>
            <p style={bodyStyle}>When you interact with our AI assistants or team members and provide your phone number with a request to receive information via text, you consent to receive SMS messages from Requity. These messages are transactional only and include reservation booking links and callback confirmations. We do not send marketing text messages.</p>
            <p style={bodyStyle}>Message frequency varies; typically 1-2 messages per interaction. Message and data rates may apply. You can opt out at any time by replying STOP to any message. For full details, see our <Link href="/sms-terms" style={{ color: "var(--gold)" }}>SMS Terms &amp; Conditions</Link>.</p>

            <h2 style={headingStyle}>5. Reservations &amp; Bookings</h2>
            <p style={bodyStyle}>Reservation bookings made through third-party platforms (such as Campspot) are subject to the terms and conditions of those platforms. Requity is not responsible for the terms, pricing, or policies of third-party booking services. Cancellation and refund policies vary by property and are communicated at the time of booking.</p>

            <h2 style={headingStyle}>6. Intellectual Property</h2>
            <p style={bodyStyle}>All content on our websites, including text, images, logos, and design, is the property of TRG Management LLC or its licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our prior written consent.</p>

            <h2 style={headingStyle}>7. Disclaimers</h2>
            <p style={bodyStyle}>Our services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that our websites or AI assistants will be uninterrupted, error-free, or completely accurate. Information provided by our AI assistants is for general informational purposes and should not be considered a binding offer or guarantee.</p>

            <h2 style={headingStyle}>8. Limitation of Liability</h2>
            <p style={bodyStyle}>To the maximum extent permitted by law, Requity and its affiliates, officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>

            <h2 style={headingStyle}>9. Privacy</h2>
            <p style={bodyStyle}>Your use of our services is also governed by our <Link href="/privacy-policy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>, which describes how we collect, use, and protect your personal information.</p>

            <h2 style={headingStyle}>10. Governing Law</h2>
            <p style={bodyStyle}>These Terms are governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.</p>

            <h2 style={headingStyle}>11. Changes to These Terms</h2>
            <p style={bodyStyle}>We may update these Terms from time to time. Changes will be posted on this page with an updated effective date. Your continued use of our services after any changes constitutes acceptance of the updated Terms.</p>

            <h2 style={headingStyle}>12. Contact Us</h2>
            <p style={bodyStyle}>If you have questions about these Terms, contact us at:</p>
            <p style={bodyStyle}>
              TRG Management LLC<br />
              Email: <a href="mailto:info@requitygroup.com" style={{ color: "var(--gold)" }}>info@requitygroup.com</a><br />
              Phone: <a href="tel:+18137106681" style={{ color: "var(--gold)" }}>(813) 710-6681</a>
            </p>

            <div style={footerStyle}>
              <p>&copy; 2026 TRG Management LLC. All rights reserved.</p>
              <p style={{ marginTop: 8 }}>
                <Link href="/privacy-policy" style={{ color: "var(--gold)" }}>Privacy Policy</Link>
                {" | "}
                <Link href="/sms-terms" style={{ color: "var(--gold)" }}>SMS Terms</Link>
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
