import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import FooterCTA from "../../components/FooterCTA";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Fund Terms | Requity Income Fund",
  description:
    "Key terms and structure of the Requity Income Fund. 10% target return, 0% management fee, $1M GP first-loss, quarterly liquidity, monthly distributions. Full fund overview.",
};

const TERMS = [
  { label: "Fund Strategy", value: "First-Lien Real Estate Direct Lending" },
  { label: "Target Return", value: "10% Annual (Paid Monthly)" },
  { label: "Fund Investments", value: "Secured Bridge Loans on Commercial & Residential RE" },
  { label: "Management Fee", value: "0% (GP Absorbs All Expenses)" },
  { label: "Fund Term", value: "Evergreen (Open-Ended)" },
  { label: "Performance Allocation", value: "100% of Profits Above 10% Hurdle" },
  { label: "Minimum Investment", value: "$100,000 (GP Discretion for Lower)" },
  { label: "GP First-Loss", value: "$1,000,000 Capital at Risk" },
  { label: "Offering Type", value: "Rule 506(c) - Verified Accredited Investors" },
  { label: "Fund-Level Leverage", value: "Up to 1:1 of Capital Accounts" },
  { label: "Redemption", value: "Quarterly, 90-Day Notice (12-Month Lock-Up)" },
  { label: "Reporting", value: "Monthly NAV, Quarterly Statements, Annual K-1" },
];

const UW_PARAMS = [
  { asset: "Manufactured Housing", ltc: "80%", ltv: "75%", ltsv: "70%" },
  { asset: "RV Parks (Seasonal/Annual)", ltc: "75%", ltv: "70%", ltsv: "65%" },
  { asset: "RV Parks (30%+ Transient)", ltc: "70%", ltv: "65%", ltsv: "60%" },
  { asset: "Industrial", ltc: "80%", ltv: "75%", ltsv: "70%" },
  { asset: "Self Storage", ltc: "80%", ltv: "75%", ltsv: "70%" },
  { asset: "Multifamily", ltc: "80%", ltv: "75%", ltsv: "70%" },
  { asset: "Fix and Flip (Residential)", ltc: "80%", ltv: "N/A", ltsv: "70% ARV" },
];

export default function FundTermsPage() {
  return (
    <main>
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(140px, 18vw, 200px)",
          paddingBottom: "clamp(60px, 8vw, 100px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <Link
            href="/fund"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, color: "var(--gold-muted)", textDecoration: "none",
              marginBottom: 32, animation: "fadeUp 0.8s ease both",
            }}
          >
            <ArrowLeft size={14} /> Back to Fund
          </Link>
          <h1
            className="type-hero"
            style={{
              color: "#fff", maxWidth: 600, fontSize: "clamp(36px, 4.5vw, 56px)",
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            Fund <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Terms</em>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.75,
              color: "var(--navy-text-mid)", maxWidth: 520, marginTop: 20,
              animation: "fadeUp 0.8s 0.2s ease both",
            }}
          >
            Key terms and structure of Requity Income Fund LP.
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Fund Terms Table */}
      <section className="light-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Overview</SectionLabel>
            <h2 className="section-title" style={{ maxWidth: 400, marginBottom: 40 }}>
              Fund <em>Structure</em>
            </h2>
            <div
              style={{
                background: "var(--white)", border: "1px solid var(--border-light)",
                borderRadius: 16, overflow: "hidden", maxWidth: 760,
              }}
            >
              {TERMS.map((term, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24,
                    padding: "18px 32px", alignItems: "center",
                    borderBottom: i < TERMS.length - 1 ? "1px solid var(--border-light)" : "none",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-mid)" }}>
                    {term.label}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>
                    {term.value}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Service Providers */}
          <ScrollReveal>
            <div
              style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 24, marginTop: 48, maxWidth: 760,
              }}
            >
              {[
                { role: "Fund Admin", name: "NAV Consulting, Inc." },
                { role: "Fund Counsel", name: "Riveles Wahab LLP" },
                { role: "Lender Counsel", name: "Private Lender Law" },
                { role: "Bank", name: "Five Star Bank" },
              ].map((sp, i) => (
                <div key={i} style={{ textAlign: "center", padding: "16px 0" }}>
                  <p style={{
                    fontSize: 11, fontWeight: 500, letterSpacing: "2px",
                    textTransform: "uppercase", color: "var(--text-light)", marginBottom: 6,
                  }}>
                    {sp.role}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
                    {sp.name}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Underwriting Parameters */}
      <section className="cream-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Underwriting</SectionLabel>
            <h2 className="section-title" style={{ maxWidth: 500, marginBottom: 24 }}>
              Parameters by <em>Asset Class</em>
            </h2>
            <p className="section-desc" style={{ maxWidth: 600, marginBottom: 48 }}>
              Leverage is our primary risk adjustment. Standard terms: 12% rate,
              2 points, 12-24 months, interest-only, full recourse.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <table
                style={{
                  width: "100%", minWidth: 600, borderCollapse: "separate",
                  borderSpacing: 0, fontSize: 14, fontFamily: "var(--font-sans)",
                  background: "var(--white)", borderRadius: 16, overflow: "hidden",
                  border: "1px solid var(--border-light)",
                }}
              >
                <thead>
                  <tr>
                    {["Asset Class", "Max LTC", "Max LTV", "Max LTSV"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left", padding: "16px 20px",
                          fontSize: 11, fontWeight: 600, letterSpacing: "2px",
                          textTransform: "uppercase", color: "var(--text-light)",
                          borderBottom: "1px solid var(--border-light)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {UW_PARAMS.map((row, i) => (
                    <tr key={i}>
                      <td style={{
                        padding: "14px 20px", fontWeight: 500, color: "var(--text)",
                        borderBottom: i < UW_PARAMS.length - 1 ? "1px solid var(--border-light)" : "none",
                      }}>
                        {row.asset}
                      </td>
                      {[row.ltc, row.ltv, row.ltsv].map((val, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "14px 20px", color: "var(--text-mid)",
                            borderBottom: i < UW_PARAMS.length - 1 ? "1px solid var(--border-light)" : "none",
                          }}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-light)", marginTop: 16, fontStyle: "italic" }}>
              Parameters are guidelines. GP reserves the right to adjust based on
              borrower experience, additional collateral, and other risk-mitigating factors.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <FooterCTA
        label="Ready to Invest"
        headline={<>Schedule a <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>call</em></>}
        body="Talk with Dylan or Luis about the fund, your questions, and next steps."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Schedule a Call <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
