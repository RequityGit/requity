import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import FooterCTA from "../../components/FooterCTA";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Tax Advantages | Requity Income Fund",
  description:
    "Tax-advantaged investing through the Requity Income Fund. Section 199A deduction via Sub-REIT structure. Invest through self-directed IRA, Solo 401(k), or HSA.",
};

export default function FundTaxPage() {
  return (
    <main>
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(140px, 18vw, 200px)",
          paddingBottom: "clamp(60px, 8vw, 100px)",
          position: "relative", overflow: "hidden",
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
              color: "#fff", maxWidth: 700, fontSize: "clamp(36px, 4.5vw, 56px)",
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            Tax{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Advantages</em>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.75,
              color: "var(--navy-text-mid)", maxWidth: 540, marginTop: 20,
              animation: "fadeUp 0.8s 0.2s ease both",
            }}
          >
            Potential 20% deduction on qualified REIT dividends, plus tax-advantaged
            account options for eligible investors.
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Sub-REIT & 199A */}
      <section className="light-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 100px)", alignItems: "start",
              }}
              className="fund-pitch-grid"
            >
              <div>
                <SectionLabel>Sub-REIT Structure</SectionLabel>
                <h2 className="section-title" style={{ maxWidth: 440, marginBottom: 24 }}>
                  Section 199A <em>Deduction</em>
                </h2>
                <p style={{
                  fontSize: 16, lineHeight: 1.85, color: "var(--text-mid)",
                  marginBottom: 24, maxWidth: 480,
                }}>
                  The General Partner intends to elect REIT status for a subsidiary
                  entity (the &ldquo;Sub-REIT&rdquo;) that will hold qualifying loans.
                  Income distributed as qualified REIT dividends may be eligible for
                  the Section 199A deduction.
                </p>

                <h3 style={{
                  fontFamily: "var(--font-serif)", fontSize: 20,
                  color: "var(--text)", marginBottom: 16, marginTop: 32,
                }}>
                  How it works
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { num: "1", text: "Sub-REIT holds qualifying real estate loans from the portfolio" },
                    { num: "2", text: "Interest income distributed by the Sub-REIT as qualified REIT dividends to the Partnership" },
                    { num: "3", text: "Income allocated to Limited Partners on K-1, characterized as qualified REIT dividend income" },
                    { num: "4", text: "Eligible investors deduct 20% of qualified REIT dividend income on personal tax returns" },
                  ].map((step) => (
                    <div key={step.num} style={{ display: "flex", gap: 14, alignItems: "start" }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: "rgba(160,138,78,0.1)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 600, color: "var(--gold)",
                      }}>
                        {step.num}
                      </div>
                      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-mid)", paddingTop: 3 }}>
                        {step.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Illustrative Tax Impact */}
              <div style={{ paddingTop: 48 }}>
                <div style={{
                  background: "var(--white)", border: "1px solid var(--border-light)",
                  borderRadius: 16, overflow: "hidden",
                }}>
                  <div style={{
                    padding: "20px 28px",
                    borderBottom: "1px solid var(--border-light)",
                    background: "var(--cream)",
                  }}>
                    <p style={{
                      fontSize: 12, fontWeight: 500, letterSpacing: "2px",
                      textTransform: "uppercase", color: "var(--gold)",
                    }}>
                      Illustrative Tax Impact
                    </p>
                    <p style={{ fontSize: 14, color: "var(--text-mid)", marginTop: 4 }}>
                      $500,000 investment at 10% return
                    </p>
                  </div>
                  {[
                    { label: "Qualified REIT Dividend", without: "N/A", with: "$50,000" },
                    { label: "199A Deduction (20%)", without: "$0", with: "($10,000)" },
                    { label: "Taxable Income", without: "$50,000", with: "$40,000" },
                    { label: "Federal Tax (37%)", without: "$18,500", with: "$14,800" },
                    { label: "Annual Tax Savings", without: "", with: "$3,700" },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr",
                        borderBottom: i < 4 ? "1px solid var(--border-light)" : "none",
                      }}
                    >
                      <span style={{
                        padding: "14px 28px", fontSize: 14, fontWeight: 500,
                        color: i === 4 ? "var(--gold)" : "var(--text-mid)",
                      }}>
                        {row.label}
                      </span>
                      <span style={{
                        padding: "14px 16px", fontSize: 14, color: "var(--text-light)",
                        textAlign: "center",
                        borderLeft: "1px solid var(--border-light)",
                      }}>
                        {row.without}
                      </span>
                      <span style={{
                        padding: "14px 16px", fontSize: 14,
                        color: i === 4 ? "var(--gold)" : "var(--text)",
                        fontWeight: i === 4 ? 600 : 500,
                        textAlign: "center",
                        borderLeft: "1px solid var(--border-light)",
                      }}>
                        {row.with}
                      </span>
                    </div>
                  ))}
                  {/* Column headers overlay */}
                </div>
                <p style={{
                  fontSize: 12, color: "var(--text-light)", marginTop: 16,
                  fontStyle: "italic", lineHeight: 1.6,
                }}>
                  Illustrative only. Tax treatment depends on individual circumstances.
                  Sub-REIT election subject to IRS requirements. Consult your tax advisor.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Retirement Accounts */}
      <section className="cream-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Retirement Accounts</SectionLabel>
            <h2 className="section-title" style={{ maxWidth: 600, marginBottom: 24 }}>
              Invest with tax-advantaged <em>accounts</em>
            </h2>
            <p className="section-desc" style={{ maxWidth: 600, marginBottom: 56 }}>
              Tax-advantaged accounts unlock significant benefits while earning
              real estate-backed monthly income.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {[
                {
                  title: "Self-Directed IRA",
                  highlights: [
                    "Invest with pre-tax (Traditional) or post-tax (Roth) dollars",
                    "Distributions grow tax-deferred or tax-free (Roth)",
                    "No capital gains on reinvested earnings inside the account",
                    "Ideal for diversifying beyond stocks and bonds",
                    "Requires qualified custodian (we work with multiple)",
                  ],
                },
                {
                  title: "Solo 401(k)",
                  highlights: [
                    "Higher contribution limits ($69,000+ for 2025)",
                    "Available to self-employed and business owners",
                    "Roth option for tax-free growth",
                    "Checkbook control for faster execution",
                    "Employee + employer contributions directed to fund",
                  ],
                },
                {
                  title: "HSA",
                  highlights: [
                    "Triple tax: deductible contributions, tax-free growth, tax-free medical withdrawals",
                    "After 65, any-purpose withdrawals taxed as ordinary income",
                    "No required minimum distributions",
                    "Requires self-directed HSA custodian",
                    "Ideal for maxed-out retirement accounts",
                  ],
                },
              ].map((account, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--white)", border: "1px solid var(--border-light)",
                    borderRadius: 16, padding: "clamp(24px, 3vw, 36px)",
                  }}
                >
                  <h3 style={{
                    fontFamily: "var(--font-serif)", fontSize: 22,
                    color: "var(--text)", marginBottom: 20, letterSpacing: "-0.3px",
                  }}>
                    {account.title}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {account.highlights.map((h, j) => (
                      <div key={j} style={{ display: "flex", gap: 10, alignItems: "start" }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "var(--gold)", flexShrink: 0, marginTop: 7,
                        }} />
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-mid)" }}>
                          {h}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* How to Get Started */}
          <ScrollReveal>
            <div style={{
              marginTop: 56, padding: "32px 40px",
              background: "var(--white)", border: "1px solid var(--border-light)",
              borderRadius: 16,
            }}>
              <p style={{
                fontSize: 12, fontWeight: 500, letterSpacing: "3px",
                textTransform: "uppercase", color: "var(--gold)", marginBottom: 24,
              }}>
                How to Get Started
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 24,
                }}
              >
                {[
                  { num: "1", text: "Open or use existing self-directed account with qualified custodian" },
                  { num: "2", text: "Direct custodian to invest in Requity Income Fund LP" },
                  { num: "3", text: "Complete Subscription Agreement and Custodian Acknowledgement" },
                  { num: "4", text: "Custodian wires funds; distributions flow to your tax-advantaged account" },
                ].map((step) => (
                  <div key={step.num} style={{ display: "flex", gap: 12, alignItems: "start" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(160,138,78,0.1)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 600, color: "var(--gold)",
                    }}>
                      {step.num}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-mid)", paddingTop: 4 }}>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
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

      {/* Responsive */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .fund-pitch-grid {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
