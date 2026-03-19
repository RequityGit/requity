import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedLine from "../components/AnimatedLine";
import SectionLabel from "../components/SectionLabel";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Requity Income Fund | 10% Target Return from Real Estate Private Credit",
  description:
    "Invest in the Requity Income Fund. 10% target annual return paid monthly. $65M+ deployed, 70+ loans, zero defaults. First-lien bridge loans backed by real estate. $1M GP first-loss. 0% management fee. Accredited investors.",
  openGraph: {
    title: "Requity Income Fund | Requity Group",
    description:
      "10% target annual return, paid monthly. Zero defaults across 70+ loans. $1M GP first-loss protection. Real estate private credit built by operators.",
  },
  twitter: {
    title: "Requity Income Fund | Requity Group",
    description:
      "10% target annual return. Monthly distributions. Zero defaults. Real estate private credit built by operators.",
  },
};

export const revalidate = 300;

export default async function FundPage() {
  const testimonials = await fetchSiteData<Testimonial>("site_testimonials", {
    eq: ["is_published", true],
  });

  const featuredTestimonial = testimonials[0];
  const secondTestimonial = testimonials[1];

  return (
    <main>
      {/* ════════════════════════════════════════════════════════════
          1. HERO — Sell the outcome, not the structure
          ════════════════════════════════════════════════════════════ */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 22vw, 260px)",
          paddingBottom: "clamp(100px, 14vw, 200px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>
        <div className="navy-glow" style={{ top: "5%", right: "10%" }} />
        <div className="navy-bottom-fade" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 900,
              animation: "fadeUp 0.8s ease both",
            }}
          >
            Earn 10%.{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Paid monthly.
            </em>
            <br />
            Backed by real estate.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 18,
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 520,
              marginTop: 32,
              animation: "fadeUp 0.8s 0.15s ease both",
            }}
          >
            First-lien bridge loans. Zero defaults across 70+ loans.
            Your capital is protected before ours.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 48,
              animation: "fadeUp 0.8s 0.3s ease both",
              flexWrap: "wrap",
            }}
          >
            <Link href="/invest/request-access" className="btn-primary">
              Schedule a Call <ArrowRight size={16} />
            </Link>
          </div>

          {/* Floating stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 1,
              marginTop: 80,
              animation: "fadeUp 0.8s 0.45s ease both",
              background: "var(--navy-border)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {[
              { val: "$65M+", lbl: "Capital Deployed" },
              { val: "70+", lbl: "Loans Originated" },
              { val: "0%", lbl: "Default Rate" },
              { val: "0%", lbl: "Management Fee" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "36px 24px",
                  textAlign: "center",
                  background: "rgba(12,28,48,0.85)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(28px, 3.5vw, 40px)",
                    color: "var(--gold-muted)",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: 500,
                  }}
                >
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          2. THE PITCH — Editorial prose, not card grids
          ════════════════════════════════════════════════════════════ */}
      <section className="light-zone" style={{ padding: "clamp(80px, 12vw, 160px) 0" }}>
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 120px)",
                alignItems: "start",
              }}
              className="fund-pitch-grid"
            >
              {/* Left: the argument */}
              <div>
                <SectionLabel>The Fund</SectionLabel>
                <h2
                  className="section-title"
                  style={{ maxWidth: 480, marginBottom: 32 }}
                >
                  Private credit built by{" "}
                  <em>operators</em>, not Wall Street
                </h2>

                <div style={{ maxWidth: 480 }}>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    Requity Income Fund originates first-lien bridge loans
                    secured by real estate you can drive to. Manufactured
                    housing communities, single-family renovations, multifamily,
                    RV parks. Every loan backed by a recorded deed of trust,
                    a personal guarantee, and a borrower who put 20-35% of
                    their own capital in first.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    We underwrite differently because we operate the same
                    asset classes we lend on. 4,000+ units across nine
                    properties. When we evaluate a borrower&apos;s business
                    plan, we&apos;re checking it against what we know from
                    running those properties ourselves. If something goes
                    wrong, we don&apos;t hire a liquidator. We take the keys
                    and run it.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 0,
                    }}
                  >
                    The result: 70+ loans originated. Zero defaults. Zero
                    missed payments. Zero principal losses.
                  </p>
                </div>
              </div>

              {/* Right: pulled-out highlights */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 32,
                  paddingTop: 64,
                }}
              >
                {/* Big number accent */}
                <div
                  style={{
                    borderLeft: "2px solid var(--gold)",
                    paddingLeft: 28,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(48px, 5vw, 72px)",
                      color: "var(--text)",
                      letterSpacing: "-3px",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    10%
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-mid)",
                      lineHeight: 1.6,
                      maxWidth: 280,
                    }}
                  >
                    Target annual return, paid monthly from day one. No waiting
                    period. No capital calls.
                  </p>
                </div>

                <div
                  style={{
                    borderLeft: "2px solid var(--gold)",
                    paddingLeft: 28,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(48px, 5vw, 72px)",
                      color: "var(--text)",
                      letterSpacing: "-3px",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    $1M
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-mid)",
                      lineHeight: 1.6,
                      maxWidth: 280,
                    }}
                  >
                    GP first-loss. Our capital is wiped out before any investor
                    loses a dollar. We don&apos;t earn until you get your 10%.
                  </p>
                </div>

                {/* Testimonial woven in */}
                {featuredTestimonial && (
                  <div
                    style={{
                      background: "var(--cream)",
                      borderRadius: 12,
                      padding: 28,
                      marginTop: 8,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 16,
                        fontStyle: "italic",
                        color: "var(--text)",
                        lineHeight: 1.7,
                        marginBottom: 16,
                      }}
                    >
                      &ldquo;{featuredTestimonial.quote}&rdquo;
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-light)",
                        fontWeight: 500,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                      }}
                    >
                      {featuredTestimonial.author_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. HOW IT WORKS — Three things, visually distinct
          ════════════════════════════════════════════════════════════ */}
      <section
        className="dark-zone"
        style={{
          padding: "clamp(80px, 12vw, 160px) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>

        <div
          className="container"
          style={{ position: "relative", zIndex: 1 }}
        >
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <SectionLabel light>How It Works</SectionLabel>
              <h2
                className="type-h2"
                style={{
                  color: "#fff",
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                Simple by{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--gold-muted)" }}
                >
                  design
                </em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                background: "var(--navy-border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
              className="fund-how-grid"
            >
              {[
                {
                  num: "01",
                  title: "You invest",
                  body: "$100K minimum. Wire once. No capital calls. Admitted as LP on the first of the following month.",
                  accent: "$100K",
                  accentLabel: "Minimum",
                },
                {
                  num: "02",
                  title: "We lend",
                  body: "Your capital funds first-lien bridge loans at 12% interest. Every loan personally guaranteed, actively managed, and scored across 25+ risk factors.",
                  accent: "12%",
                  accentLabel: "Loan Rate",
                },
                {
                  num: "03",
                  title: "You earn",
                  body: "Monthly distributions from interest income. Reinvest via DRIP or take cash. Quarterly liquidity after 12 months. Full portal transparency.",
                  accent: "10%",
                  accentLabel: "Target Return",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  style={{
                    padding: "clamp(36px, 4vw, 56px)",
                    background: "rgba(12,28,48,0.6)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: "2px",
                      color: "var(--gold-muted)",
                      marginBottom: 24,
                    }}
                  >
                    {step.num}
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(24px, 2.5vw, 32px)",
                      color: "#fff",
                      marginBottom: 16,
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--navy-text-mid)",
                      marginBottom: "auto",
                      paddingBottom: 32,
                    }}
                  >
                    {step.body}
                  </p>
                  <div
                    style={{
                      borderTop: "1px solid var(--navy-border)",
                      paddingTop: 24,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 36,
                        color: "var(--gold-muted)",
                        letterSpacing: "-1.5px",
                        lineHeight: 1,
                        marginBottom: 4,
                      }}
                    >
                      {step.accent}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.25)",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: 500,
                      }}
                    >
                      {step.accentLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          4. PROOF — Track record + testimonial as one credibility block
          ════════════════════════════════════════════════════════════ */}
      <section
        className="cream-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Track Record</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 120px)",
                alignItems: "start",
              }}
              className="fund-pitch-grid"
            >
              <div>
                <h2
                  className="section-title"
                  style={{ maxWidth: 500, marginBottom: 32 }}
                >
                  The numbers speak for{" "}
                  <em>themselves</em>
                </h2>
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--text-mid)",
                    maxWidth: 460,
                    marginBottom: 32,
                  }}
                >
                  Since inception, Requity Lending has maintained a perfect
                  record across every asset class we serve. We
                  underwrite as if every loan will be tested, so none
                  of them have been.
                </p>

                {/* Asset mix inline */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {[
                    "Single Family 42%",
                    "MH Community 34%",
                    "Multifamily 14%",
                    "RV / Campground 10%",
                  ].map((mix, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--text-mid)",
                        padding: "8px 16px",
                        background: "var(--white)",
                        border: "1px solid var(--border-light)",
                        borderRadius: 8,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {mix}
                    </span>
                  ))}
                </div>
              </div>

              {/* Big stats, stacked */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  background: "var(--border-light)",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {[
                  { val: "70+", lbl: "Loans Originated" },
                  { val: "$35M+", lbl: "Total Originations" },
                  { val: "$20M+", lbl: "Paid Off / Returned" },
                  { val: "0", lbl: "Defaults. Ever." },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "clamp(28px, 3vw, 44px)",
                      background: "var(--white)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(32px, 4vw, 48px)",
                        color: "var(--text)",
                        letterSpacing: "-2px",
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                    >
                      {s.val}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-light)",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        fontWeight: 500,
                      }}
                    >
                      {s.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Testimonial strip */}
          {secondTestimonial && (
            <ScrollReveal>
              <div
                style={{
                  marginTop: 72,
                  padding: "40px 48px",
                  background: "var(--white)",
                  borderRadius: 16,
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  gap: 32,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 64,
                    color: "var(--gold)",
                    lineHeight: 1,
                    marginTop: -16,
                    flexShrink: 0,
                  }}
                >
                  &ldquo;
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      fontStyle: "italic",
                      color: "var(--text)",
                      lineHeight: 1.7,
                      marginBottom: 12,
                    }}
                  >
                    {secondTestimonial.quote}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-light)",
                      fontWeight: 500,
                    }}
                  >
                    {secondTestimonial.author_name}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. QUICK TERMS + PROTECTION — The 5 things that matter
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <SectionLabel>Key Terms</SectionLabel>
              <h2
                className="section-title"
                style={{ margin: "0 auto", maxWidth: 400 }}
              >
                Designed for <em>alignment</em>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 1,
                background: "var(--border-light)",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 48,
              }}
            >
              {[
                {
                  label: "Target Return",
                  value: "10% Annual",
                  detail: "Paid monthly from day one",
                },
                {
                  label: "Management Fee",
                  value: "0%",
                  detail: "GP absorbs all expenses",
                },
                {
                  label: "GP First-Loss",
                  value: "$1M",
                  detail: "Subordinated to all LPs",
                },
                {
                  label: "Minimum",
                  value: "$100K",
                  detail: "GP discretion for lower",
                },
                {
                  label: "Liquidity",
                  value: "Quarterly",
                  detail: "90-day notice, after 12-mo lock-up",
                },
                {
                  label: "Structure",
                  value: "Evergreen",
                  detail: "506(c), accredited investors",
                },
              ].map((term, i) => (
                <div
                  key={i}
                  style={{
                    padding: "clamp(24px, 3vw, 36px)",
                    background: "var(--white)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-light)",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      fontWeight: 500,
                      marginBottom: 12,
                    }}
                  >
                    {term.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "clamp(28px, 3vw, 40px)",
                      color: "var(--text)",
                      letterSpacing: "-1.5px",
                      lineHeight: 1,
                      marginBottom: 8,
                    }}
                  >
                    {term.value}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-light)",
                    }}
                  >
                    {term.detail}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Protection summary - single line items, not cards */}
          <ScrollReveal>
            <div
              style={{
                maxWidth: 680,
                margin: "0 auto",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  textAlign: "center",
                  marginBottom: 32,
                }}
              >
                Every Loan Protected By
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  "Recorded first-lien deed of trust on every property",
                  "Full personal guarantee from every borrower",
                  "Conservative leverage: max 80% LTC, 70% stabilized value",
                  "$1M GP backstop absorbs losses before any LP is impacted",
                  "Background, credit, and financial screening on every principal",
                  "Active loan management: reporting, inspections, covenant tracking",
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 0",
                      borderBottom:
                        i < 5
                          ? "1px solid var(--border-light)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontSize: 15,
                        color: "var(--text-mid)",
                        lineHeight: 1.5,
                      }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {/* Deep dive links */}
              <div
                style={{
                  display: "flex",
                  gap: 32,
                  marginTop: 40,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "Full Fund Terms", href: "/fund/terms" },
                  { label: "Capital Protection", href: "/fund/protection" },
                  { label: "Tax Advantages", href: "/fund/tax" },
                  { label: "FAQ", href: "/fund/faq" },
                ].map((link, i) => (
                  <Link
                    key={i}
                    href={link.href}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: "var(--text-mid)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "color 0.2s",
                    }}
                    className="fund-deep-link"
                  >
                    {link.label} <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ paddingBottom: 0 }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. CTA — One clear action
          ════════════════════════════════════════════════════════════ */}
      <section
        className="dark-zone"
        style={{
          padding: "clamp(100px, 14vw, 200px) 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="navy-grid-line"
              style={{ left: `${(i + 1) * 7.14}%` }}
            />
          ))}
        </div>
        <div className="navy-glow" style={{ bottom: "10%", left: "20%" }} />

        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 640,
          }}
        >
          <ScrollReveal>
            <h2
              className="type-h2"
              style={{
                color: "#fff",
                marginBottom: 24,
              }}
            >
              Ready to{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
                start earning
              </em>
              ?
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--navy-text-mid)",
                maxWidth: 480,
                margin: "0 auto 44px",
              }}
            >
              Schedule a call with Dylan or Luis. We&apos;ll walk through the
              fund, answer your questions, and send you the offering materials.
            </p>

            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 48,
              }}
            >
              <Link href="/invest/request-access" className="btn-primary">
                Schedule a Call <ArrowRight size={16} />
              </Link>
              <a
                href="mailto:invest@requitygroup.com?subject=Fund Materials Request"
                className="btn-secondary"
              >
                Request Materials
              </a>
            </div>

            {/* Contact info */}
            <div
              style={{
                display: "flex",
                gap: 48,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  name: "Dylan Marma",
                  title: "Fund Manager",
                  contact: "dylan@requitygroup.com",
                },
                {
                  name: "Luis Velez",
                  title: "Investor Relations",
                  contact: "luis@requitygroup.com",
                },
              ].map((person, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#fff",
                      fontWeight: 500,
                      marginBottom: 2,
                    }}
                  >
                    {person.name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--navy-text-light)",
                      marginBottom: 4,
                    }}
                  >
                    {person.title}
                  </p>
                  <a
                    href={`mailto:${person.contact}`}
                    style={{
                      fontSize: 13,
                      color: "var(--gold-muted)",
                      textDecoration: "none",
                    }}
                  >
                    {person.contact}
                  </a>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          DISCLOSURES
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{
          padding: "48px 0",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div className="container">
          <p
            style={{
              fontSize: 11,
              lineHeight: 1.8,
              color: "var(--text-light)",
              maxWidth: 900,
            }}
          >
            <strong style={{ color: "var(--text-mid)", fontWeight: 600 }}>
              Important Disclosures:
            </strong>{" "}
            Requity Income Fund GP LLC is not registered as an investment
            adviser. Interests are offered under a separate PPM pursuant to Rule
            506(c) and have not been registered under the Securities Act of
            1933. The Fund is speculative and involves risk of loss. Past
            performance is not indicative of future results. Target returns are
            not guaranteed. Consult your tax, legal, and financial advisors.
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-light)",
              marginTop: 12,
            }}
          >
            Requity Income Fund GP LLC | 401 E Jackson St, Suite 3300 | Tampa,
            FL 33602
          </p>
        </div>
      </section>

      {/* Responsive overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .fund-pitch-grid {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
              .fund-how-grid {
                grid-template-columns: 1fr !important;
              }
            }
            .fund-deep-link:hover {
              color: var(--gold) !important;
            }
          `,
        }}
      />
    </main>
  );
}
