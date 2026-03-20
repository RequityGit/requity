import { useState } from "react";

const gold = "#A08A4E";
const goldM = "#B89D5C";
const navy = "#0C1C30";
const navyMid = "#122842";
const navyLight = "#1A3456";
const cream = "#F8F6F1";
const creamDark = "#E8E5DF";
const textDark = "#1C1C1C";
const textMid = "#5C5C5C";
const textLight = "#9A9A9A";
const border = "#E0DCD4";
const white = "#FFFFFF";

/* ─── Shared Nav ─── */
const Nav = ({ site, onNav }) => {
  const isCorp = site === "corporate";
  const corpLinks = ["About", "Invest", "Lending"];
  const lendLinks = ["Programs", "Process", "About Us"];

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: isCorp ? `${navy}ee` : `${navy}ee`,
      backdropFilter: "blur(16px)",
      borderBottom: `1px solid rgba(255,255,255,0.06)`,
      padding: "0 32px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onNav("corporate")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill={gold} opacity="0.8"/>
            <path d="M2 17l10 5 10-5" stroke={gold} strokeWidth="1.5" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke={gold} strokeWidth="1.5" fill="none"/>
          </svg>
          <span style={{ color: white, fontWeight: 700, fontSize: 15, letterSpacing: "0.08em", fontFamily: "'Inter',sans-serif" }}>
            {isCorp ? "REQUITY GROUP" : "REQUITY LENDING"}
          </span>
        </div>

        {/* Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {(isCorp ? corpLinks : lendLinks).map(link => (
            <span
              key={link}
              onClick={() => {
                if (link === "Lending") onNav("lending");
                else if (link === "About Us" && !isCorp) onNav("corporate");
                else if (link === "Invest" && !isCorp) onNav("corporate");
              }}
              style={{
                color: link === "Lending" ? goldM : "rgba(255,255,255,0.7)",
                fontSize: 13,
                fontWeight: link === "Lending" ? 600 : 400,
                cursor: "pointer",
                letterSpacing: "0.01em",
                fontFamily: "'Inter',sans-serif",
                transition: "color 0.2s",
              }}
            >
              {link}
            </span>
          ))}

          {/* CTA */}
          <span style={{
            color: goldM,
            fontSize: 12,
            fontWeight: 600,
            padding: "7px 16px",
            border: `1px solid ${gold}55`,
            borderRadius: 6,
            cursor: "pointer",
            letterSpacing: "0.02em",
            fontFamily: "'Inter',sans-serif",
          }}>
            {isCorp ? "Investor Login" : "Submit a Deal"}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── Corporate Homepage ─── */
const CorporateHome = ({ onNav }) => (
  <div>
    {/* Hero */}
    <div style={{
      background: `linear-gradient(165deg, ${navy} 0%, ${navyMid} 50%, ${navyLight} 100%)`,
      padding: "100px 32px 80px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Grid pattern */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${12.5 * (i + 1)}%`, top: 0, bottom: 0, width: 1, background: white }} />
        ))}
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", textAlign: "center" }}>
        <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>
          Real Estate Investment
        </div>
        <h1 style={{ color: white, fontSize: 44, fontWeight: 300, lineHeight: 1.2, margin: 0, fontFamily: "Georgia,serif" }}>
          Built for investors who <em style={{ color: goldM, fontStyle: "italic" }}>demand more</em>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.7, marginTop: 20, fontFamily: "'Inter',sans-serif" }}>
          Vertically integrated real estate investment and lending, powered by operator-level insight and institutional discipline.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <span style={{ background: goldM, color: navy, padding: "12px 28px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            Invest with Us
          </span>
          <span onClick={() => onNav("lending")} style={{ background: "transparent", color: white, padding: "12px 28px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: `1px solid rgba(255,255,255,0.2)`, fontFamily: "'Inter',sans-serif" }}>
            Bridge Lending
          </span>
        </div>
      </div>
    </div>

    {/* Stats Bar */}
    <div style={{ background: navy, padding: "28px 32px", borderBottom: `1px solid ${navyLight}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20, textAlign: "center" }}>
        {[["$70M+", "Capital Raised"], ["150+", "Loans Funded"], ["$200M+", "Assets Managed"], ["8-22%", "Target Returns"]].map(([v, l]) => (
          <div key={l}>
            <div style={{ color: goldM, fontSize: 28, fontWeight: 300, fontFamily: "Georgia,serif" }}>{v}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Platform section */}
    <div style={{ background: cream, padding: "72px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>Our Platform</div>
        <h2 style={{ color: textDark, fontSize: 32, fontWeight: 300, margin: "0 0 40px", fontFamily: "Georgia,serif" }}>Two strategies, one team</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Equity Card */}
          <div style={{ background: white, borderRadius: 12, padding: 32, border: `1px solid ${border}` }}>
            <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>Equity</div>
            <h3 style={{ color: textDark, fontSize: 22, fontWeight: 400, margin: "0 0 12px", fontFamily: "Georgia,serif" }}>Value-Add Acquisitions</h3>
            <p style={{ color: textMid, fontSize: 14, lineHeight: 1.7, margin: "0 0 20px", fontFamily: "'Inter',sans-serif" }}>Acquire, renovate, and manage residential properties targeting 15-22% IRR with 2-4 year hold periods.</p>
            <div style={{ display: "flex", gap: 16 }}>
              {[["15-22%", "Target IRR"], ["$50K", "Minimum"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ color: textDark, fontSize: 20, fontWeight: 300, fontFamily: "Georgia,serif" }}>{v}</div>
                  <div style={{ color: textLight, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Card */}
          <div onClick={() => onNav("lending")} style={{ background: navy, borderRadius: 12, padding: 32, cursor: "pointer", border: `1px solid ${navyLight}`, transition: "transform 0.2s" }}>
            <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>Credit</div>
            <h3 style={{ color: white, fontSize: 22, fontWeight: 400, margin: "0 0 12px", fontFamily: "Georgia,serif" }}>Bridge Lending</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px", fontFamily: "'Inter',sans-serif" }}>Short-term bridge loans for residential and commercial real estate. Fast execution, certainty of close.</p>
            <div style={{ display: "flex", gap: 16 }}>
              {[["8-12%", "Yield"], ["65%", "Avg LTV"]].map(([v, l]) => (
                <div key={l}>
                  <div style={{ color: goldM, fontSize: 20, fontWeight: 300, fontFamily: "Georgia,serif" }}>{v}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'Inter',sans-serif" }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, color: goldM, fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif" }}>
              View Lending Programs &#8594;
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <Footer variant="corporate" />
  </div>
);

/* ─── Lending Homepage ─── */
const LendingHome = () => (
  <div>
    {/* Hero */}
    <div style={{
      background: `linear-gradient(165deg, ${navy} 0%, ${navyMid} 60%, ${navyLight} 100%)`,
      padding: "100px 32px 80px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ position: "absolute", left: `${12.5 * (i + 1)}%`, top: 0, bottom: 0, width: 1, background: white }} />
        ))}
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", textAlign: "center" }}>
        <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>
          Bridge Lending
        </div>
        <h1 style={{ color: white, fontSize: 44, fontWeight: 300, lineHeight: 1.2, margin: 0, fontFamily: "Georgia,serif" }}>
          Close in <em style={{ color: goldM, fontStyle: "italic" }}>10 days</em>, not 10 weeks
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 16, lineHeight: 1.7, marginTop: 20, fontFamily: "'Inter',sans-serif" }}>
          Residential and commercial bridge loans from an operator who understands your deal. Direct communication, fast execution, certainty of close.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32 }}>
          <span style={{ background: goldM, color: navy, padding: "12px 28px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
            Submit a Deal
          </span>
          <span style={{ background: "transparent", color: white, padding: "12px 28px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: `1px solid rgba(255,255,255,0.2)`, fontFamily: "'Inter',sans-serif" }}>
            View Programs
          </span>
        </div>
      </div>
    </div>

    {/* Why Us */}
    <div style={{ background: cream, padding: "72px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>Why Requity</div>
        <h2 style={{ color: textDark, fontSize: 32, fontWeight: 300, margin: "0 0 40px", fontFamily: "Georgia,serif" }}>Built by operators, for operators</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
          {[
            ["Fast Execution", "Term sheets in 24 hours, close in as fast as 10 days"],
            ["Certainty of Close", "Direct balance sheet lender with capital ready to deploy"],
            ["Operator Mentality", "We invest in real estate too, so we understand your deal"],
            ["Direct Access", "Talk to decision-makers, not a call center"],
          ].map(([t, d]) => (
            <div key={t} style={{ background: white, borderRadius: 10, padding: 24, border: `1px solid ${border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${gold}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="1.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h4 style={{ color: textDark, fontSize: 15, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Inter',sans-serif" }}>{t}</h4>
              <p style={{ color: textMid, fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: "'Inter',sans-serif" }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Loan Programs */}
    <div style={{ background: white, padding: "72px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>Loan Programs</div>
        <h2 style={{ color: textDark, fontSize: 32, fontWeight: 300, margin: "0 0 40px", fontFamily: "Georgia,serif" }}>Flexible bridge financing</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            ["Residential Bridge", "1-4 unit properties", ["Up to 85% LTV", "12-24 month terms", "Interest only", "No prepay penalty"]],
            ["Commercial Bridge", "5+ units and mixed-use", ["Up to 75% LTV", "12-36 month terms", "Interest only", "Flexible structures"]],
            ["Fix & Flip", "Value-add residential", ["Up to 90% LTC", "6-18 month terms", "Draw schedule", "Rehab funding included"]],
          ].map(([title, sub, features]) => (
            <div key={title} style={{ background: cream, borderRadius: 10, padding: 28, border: `1px solid ${border}` }}>
              <h4 style={{ color: textDark, fontSize: 17, fontWeight: 600, margin: "0 0 4px", fontFamily: "'Inter',sans-serif" }}>{title}</h4>
              <p style={{ color: textLight, fontSize: 12, margin: "0 0 18px", fontFamily: "'Inter',sans-serif" }}>{sub}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    <span style={{ color: textMid, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Process */}
    <div style={{ background: navy, padding: "72px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: goldM, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>Process</div>
        <h2 style={{ color: white, fontSize: 32, fontWeight: 300, margin: "0 0 40px", fontFamily: "Georgia,serif" }}>From submission to close</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
          {[
            ["01", "Submit Deal", "Send us your deal summary and property details"],
            ["02", "Term Sheet", "Receive a term sheet within 24 hours"],
            ["03", "Underwriting", "Streamlined diligence with clear communication"],
            ["04", "Close & Fund", "Close in as fast as 10 business days"],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: navyMid, borderRadius: 10, padding: 24, border: `1px solid ${navyLight}` }}>
              <div style={{ color: goldM, fontSize: 28, fontWeight: 300, marginBottom: 12, fontFamily: "Georgia,serif" }}>{n}</div>
              <h4 style={{ color: white, fontSize: 15, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Inter',sans-serif" }}>{t}</h4>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0, fontFamily: "'Inter',sans-serif" }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* CTA */}
    <div style={{ background: cream, padding: "64px 32px", textAlign: "center" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h2 style={{ color: textDark, fontSize: 28, fontWeight: 300, margin: "0 0 12px", fontFamily: "Georgia,serif" }}>Ready to move fast?</h2>
        <p style={{ color: textMid, fontSize: 14, margin: "0 0 28px", fontFamily: "'Inter',sans-serif" }}>Send us your deal and get a term sheet within 24 hours.</p>
        <span style={{ display: "inline-block", background: goldM, color: navy, padding: "14px 32px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
          Submit a Deal
        </span>
      </div>
    </div>

    <Footer variant="lending" />
  </div>
);

/* ─── Footer ─── */
const Footer = ({ variant }) => (
  <div style={{ background: navy, borderTop: `1px solid ${navyLight}`, padding: "40px 32px" }}>
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
          {variant === "lending" ? "Requity Lending" : "Requity Group"} &copy; 2026
        </div>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        {["Privacy", "Terms", "Contact"].map(l => (
          <span key={l} style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{l}</span>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Domain indicator pill ─── */
const DomainBar = ({ site }) => (
  <div style={{
    position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 100,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
    borderRadius: 20, padding: "6px 16px",
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid rgba(255,255,255,0.1)",
  }}>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={site === "lending" ? "#FB923C" : "#60A5FA"} strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
    <span style={{ color: white, fontSize: 12, fontFamily: "'SF Mono',monospace", fontWeight: 500 }}>
      {site === "lending" ? "requitylending.com" : "requitygroup.com"}
    </span>
    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'Inter',sans-serif" }}>
      {site === "lending" ? "(click Requity logo to go back)" : "(click Lending to switch)"}
    </span>
  </div>
);

/* ─── Main ─── */
export default function RequitySiteMockup() {
  const [site, setSite] = useState("corporate");

  return (
    <div style={{ background: cream, minHeight: "100vh", fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <DomainBar site={site} />
      <Nav site={site} onNav={setSite} />
      {site === "corporate" ? (
        <CorporateHome onNav={setSite} />
      ) : (
        <LendingHome />
      )}
    </div>
  );
}
