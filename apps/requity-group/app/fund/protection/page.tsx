import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../components/ScrollReveal";
import SectionLabel from "../../components/SectionLabel";
import FooterCTA from "../../components/FooterCTA";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Capital Protection | Requity Income Fund",
  description:
    "How your capital is protected in the Requity Income Fund. $1M GP first-loss position, first-lien collateral, personal guarantees, conservative leverage, and active loan management.",
};

export default function FundProtectionPage() {
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
            Capital{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Protection</em>
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.75,
              color: "var(--navy-text-mid)", maxWidth: 540, marginTop: 20,
              animation: "fadeUp 0.8s 0.2s ease both",
            }}
          >
            Every loan structured with multiple, overlapping safeguards. This
            hasn&apos;t been tested because we build every loan as if it will be.
          </p>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Layers of Protection */}
      <section className="light-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Six Layers</SectionLabel>
            <h2 className="section-title" style={{ maxWidth: 500, marginBottom: 48 }}>
              How every loan is <em>protected</em>
            </h2>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  num: "01",
                  title: "Recorded First Lien",
                  body: "Every loan secured by a recorded deed of trust or mortgage, providing a prioritized legal claim on the property. If the borrower can't pay, we have first rights to the asset.",
                },
                {
                  num: "02",
                  title: "Full Personal Guarantees",
                  body: "All borrowers provide full recourse guarantees. The fund can pursue personal assets beyond the collateral property. This creates strong incentive for borrowers to perform.",
                },
                {
                  num: "03",
                  title: "Conservative Leverage",
                  body: "Up to 80% of cost, 70% of stabilized value. Every loan adjusted downward by proprietary risk scoring across 25+ factors. The 20-35% borrower equity cushion absorbs losses before our lien is impaired.",
                },
                {
                  num: "04",
                  title: "Background & Credit Screening",
                  body: "Every borrower and principal undergoes comprehensive screening: criminal background, bankruptcy, foreclosure, judgment review, financial statement analysis, and credit evaluation.",
                },
                {
                  num: "05",
                  title: "Title, Hazard & GL Insurance",
                  body: "Title insurance protects lien priority. Hazard and general liability insurance protects against property damage and third-party claims. The fund is named as loss payee on all policies.",
                },
                {
                  num: "06",
                  title: "Active Loan Management",
                  body: "Ongoing borrower reporting, draw verification against verified completion milestones, site inspections when warranted, and covenant compliance tracking through maturity. We don't fund and forget.",
                },
              ].map((layer, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: "60px 1fr", gap: 20,
                    padding: "32px 0",
                    borderBottom: i < 5 ? "1px solid var(--border-light)" : "none",
                    alignItems: "start",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500,
                      letterSpacing: "2px", color: "var(--gold)", paddingTop: 4,
                    }}
                  >
                    {layer.num}
                  </span>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif)", fontSize: 22,
                        color: "var(--text)", marginBottom: 8, letterSpacing: "-0.3px",
                      }}
                    >
                      {layer.title}
                    </h3>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-mid)" }}>
                      {layer.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* GP First-Loss Waterfall */}
      <section className="cream-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>GP First-Loss</SectionLabel>
            <h2 className="section-title" style={{ maxWidth: 600, marginBottom: 24 }}>
              Loss absorption <em>waterfall</em>
            </h2>
            <p className="section-desc" style={{ maxWidth: 600, marginBottom: 56 }}>
              The General Partner has committed $1,000,000 of its own capital in a
              subordinated first-loss position. This capital absorbs losses before
              any Limited Partner is impacted.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                {
                  num: "1",
                  title: "Borrower equity absorbs first",
                  body: "On a 75% LTC loan, the borrower has 25% equity at risk. Property values must decline past that entire cushion before our lien is impaired.",
                },
                {
                  num: "2",
                  title: "GP backstop absorbs next",
                  body: "Realized losses exceeding borrower equity are absorbed by the $1M GP Backstop Account, pro-rata across affected LPs. GP capital is wiped out before any investor dollar is touched.",
                },
                {
                  num: "3",
                  title: "LP capital protected",
                  body: "Only after the full $1M GP backstop is exhausted are losses allocated to LPs. Personal guarantees provide an additional recovery path beyond the collateral.",
                },
                {
                  num: "4",
                  title: "Recovery and replenishment",
                  body: "Subsequent profits restore LPs to their original contribution first, then replenish the GP Backstop, then resume the normal distribution waterfall.",
                },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 20, alignItems: "start" }}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(160,138,78,0.1)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--gold)",
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: 17, fontWeight: 600, color: "var(--text)", marginBottom: 6,
                    }}>
                      {step.title}
                    </h4>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-mid)" }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <p
              style={{
                fontSize: 15, lineHeight: 1.8, color: "var(--text-mid)",
                marginTop: 48, maxWidth: 640, fontStyle: "italic",
                borderLeft: "2px solid var(--gold)", paddingLeft: 24,
              }}
            >
              The GP does not earn Performance Allocation until investors receive
              their 10% preferred return. Full alignment.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Default Handling */}
      <section className="light-zone" style={{ padding: "clamp(60px, 10vw, 120px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Default Handling</SectionLabel>
            <h2 className="section-title" style={{ maxWidth: 600, marginBottom: 24 }}>
              What happens when things go <em>wrong</em>
            </h2>
            <p className="section-desc" style={{ maxWidth: 600, marginBottom: 48 }}>
              This hasn&apos;t happened. But if it does, we have the infrastructure,
              legal rights, and operational capability to protect investor capital
              at every stage.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 24, maxWidth: 900,
              }}
            >
              {[
                {
                  stage: "Early Warning",
                  items: [
                    "Missed payment triggers immediate outreach",
                    "Financial review of borrower and property status",
                    "Site visit if warranted",
                    "Identify root cause: cash flow gap vs. fundamental problem",
                  ],
                  outcome: "Most issues resolved here through modification or additional collateral.",
                },
                {
                  stage: "Default & Cure",
                  items: [
                    "Formal notice of default per loan documents",
                    "Cure period begins (typically 30 days)",
                    "Counsel engaged; enforcement prepared in parallel",
                    "Evaluate whether property value supports full recovery",
                  ],
                  outcome: "Borrower cures or we escalate. Personal guarantee creates strong incentive.",
                },
                {
                  stage: "Enforcement",
                  items: [
                    "Foreclose on property via deed of trust",
                    "Pursue personal guaranty against borrower assets",
                    "GP takes operational control of the property",
                    "Our MHC/MF infrastructure means we run it ourselves",
                  ],
                  outcome: "We don't hire a liquidator. We operate the asset.",
                },
                {
                  stage: "Recovery",
                  items: [
                    "Property sale or refinance recovers principal",
                    "Guaranty pursuit recovers any shortfall",
                    "GP Backstop absorbs losses before LP capital",
                    "Title and hazard insurance covers lien and property risks",
                  ],
                  outcome: "Multiple recovery paths ensure maximum protection.",
                },
              ].map((phase, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--white)", border: "1px solid var(--border-light)",
                    borderRadius: 16, padding: "clamp(24px, 3vw, 36px)",
                    display: "flex", flexDirection: "column",
                  }}
                >
                  <p style={{
                    fontSize: 12, fontWeight: 500, letterSpacing: "2px",
                    textTransform: "uppercase", color: "var(--gold)", marginBottom: 12,
                  }}>
                    Stage {i + 1}
                  </p>
                  <h4 style={{
                    fontFamily: "var(--font-serif)", fontSize: 20,
                    color: "var(--text)", marginBottom: 16, letterSpacing: "-0.3px",
                  }}>
                    {phase.stage}
                  </h4>
                  <div style={{ marginBottom: "auto", paddingBottom: 20 }}>
                    {phase.items.map((item, j) => (
                      <div key={j} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "start" }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "var(--gold)", flexShrink: 0, marginTop: 7,
                        }} />
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-mid)" }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p style={{
                    fontSize: 13, fontStyle: "italic", color: "var(--text-light)",
                    borderTop: "1px solid var(--border-light)", paddingTop: 16,
                  }}>
                    {phase.outcome}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <p
              style={{
                fontSize: 15, color: "var(--text-mid)", marginTop: 40,
                textAlign: "center", maxWidth: 640, margin: "40px auto 0",
              }}
            >
              In 70+ loans originated, this process has never been triggered.
              Zero defaults. Zero principal losses. But we build every loan as
              if it will be tested.
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
