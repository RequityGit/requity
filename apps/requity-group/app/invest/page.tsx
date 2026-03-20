import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import { renderEmText } from "../../lib/renderEmText";
import type { PageSection, SiteStat, Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import FooterCTA from "../components/FooterCTA";
import FAQSchema from "../components/FAQSchema";
import FAQSection from "../components/FAQSection";
import SectionLabel from "../components/SectionLabel";
import {
  ArrowRight,
  Layers,
  Users,
  TrendingUp,
  ShieldCheck,
  Calendar,
  DollarSign,
  Lock,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Invest",
  description:
    "Invest in value-add real estate with Requity Group. Direct equity (15-22% target IRR) and bridge lending (8-12% target yield). $50K minimum. Accredited investors only.",
  openGraph: {
    title: "Invest in Real Estate | Requity Group",
    description:
      "Access institutional-quality real estate investments. Direct equity and income-producing credit strategies. $50K minimum for accredited investors.",
  },
  twitter: {
    title: "Invest in Real Estate | Requity Group",
    description:
      "Access institutional-quality real estate investments. Direct equity and credit strategies for accredited investors.",
  },
};

export const revalidate = 300;

const BENEFIT_ICONS: Record<string, React.ReactNode> = {
  "Vertically Integrated": <Layers size={22} />,
  "Investor-First Approach": <Users size={22} />,
  "Proven Track Record": <TrendingUp size={22} />,
  "Asset-Backed Security": <ShieldCheck size={22} />,
};

const FUND_HIGHLIGHTS = [
  { icon: <Calendar size={20} />, label: "Monthly Distributions" },
  { icon: <ShieldCheck size={20} />, label: "$1M GP First-Loss Position" },
  { icon: <Lock size={20} />, label: "Accredited Investors Only" },
  { icon: <BarChart3 size={20} />, label: "Asset-Backed Real Estate" },
];

export default async function InvestPage() {
  const [sections, stats, testimonials] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "invest" },
    }),
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whySection = sections.find((s) => s.section_key === "why");
  const benefits = (whySection?.metadata?.benefits as Array<{ title: string; description: string }>) ?? [];

  const investFAQs = [
    {
      question: "What is the minimum investment with Requity Group?",
      answer: "$50,000 is the typical minimum for deal-by-deal investments, while $100,000 is the typical minimum for fund investments. Fund investments are generally restricted to accredited investors. Deal-by-deal opportunities may be available to non-accredited investors who qualify under Rule 506(b).",
    },
    {
      question: "What returns does Requity Group target?",
      answer: "Net to investor IRR of 14-17% for value-add equity investments, 10-12% for debt. Past performance does not guarantee future results.",
    },
    {
      question: "Are Requity Group investments asset-backed?",
      answer: "Yes. Bridge lending fund investments are secured by first-position liens on real property. Equity investments are backed by the underlying real estate assets. All investments carry risk and are not FDIC insured.",
    },
    {
      question: "How often does Requity Group pay distributions?",
      answer: "All of Requity's investment vehicles target to pay monthly distributions.",
    },
    {
      question: "Does Requity Group invest its own capital alongside investors?",
      answer: "Yes. The general partner maintains a $1,000,000 first-loss position in the lending fund. This means management capital absorbs losses before investor capital is impacted, creating strong alignment of interests.",
    },
    {
      question: "What types of real estate does Requity Group invest in?",
      answer: "Requity Group focuses on value-add real estate including manufactured housing communities, multifamily properties, and commercial assets. The bridge lending fund provides short-term financing secured by commercial and residential real estate.",
    },
    {
      question: "How do I get started investing with Requity Group?",
      answer: "Request investor materials through requitygroup.com/invest/request-access. Our investor relations team will provide fund documentation, track record information, and schedule a call to discuss your investment objectives.",
    },
  ];

  return (
    <main>
      <FAQSchema faqs={investFAQs} />
      {/* Hero */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 20vw, 220px)",
          paddingBottom: "clamp(80px, 10vw, 120px)",
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
          <p
            className="section-eyebrow"
            style={{ animation: "fadeUp 0.8s ease forwards" }}
          >
            {hero?.subheading}
          </p>
          <h1
            className="section-title section-title-light"
            style={{
              fontSize: "clamp(40px, 5.5vw, 60px)",
              maxWidth: 720,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            {renderEmText(hero?.heading)}
          </h1>
          <p
            className="section-desc section-desc-light"
            style={{
              maxWidth: 560,
              animation: "fadeUp 0.8s 0.2s ease both",
            }}
          >
            {hero?.body_text}
          </p>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 44,
              animation: "fadeUp 0.8s 0.3s ease both",
              flexWrap: "wrap",
            }}
          >
            <Link href="/invest/request-access" className="btn-primary">
              Request Access <ArrowRight size={16} />
            </Link>
            <Link href="/invest/syndications" className="btn-secondary">
              Syndications
            </Link>
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* Why Invest */}
      <section className="light-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Why Requity</p>
            <h2 className="section-title">
              {renderEmText(whySection?.heading)}
            </h2>
            <p className="section-desc" style={{ marginBottom: 56 }}>
              {whySection?.body_text}
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 24,
              }}
            >
              {benefits.map((b) => (
                <div key={b.title} className="value-item">
                  <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                    {BENEFIT_ICONS[b.title] ?? <TrendingUp size={22} />}
                  </div>
                  <h4>{b.title}</h4>
                  <p>
                    {b.title === "Proven Track Record"
                      ? "Over $70M in investor capital raised and deployed with zero losses."
                      : b.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Two Pathways */}
      <section className="cream-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Investment Strategies</p>
            <h2 className="section-title" style={{ marginBottom: 56 }}>
              Two pathways to <em>real asset</em> returns
            </h2>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
              className="invest-pathways-grid"
            >
              {/* Income Fund Card */}
              <div className="fund-card" style={{ margin: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 40,
                    color: "var(--gold-muted)",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    opacity: 0.7,
                  }}>01</span>
                  <div style={{ height: 24, width: 1, background: "rgba(255,255,255,0.12)" }} />
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: "var(--gold-muted)",
                  }}>Credit</span>
                </div>
                <h3 className="fund-title" style={{ fontSize: "clamp(24px, 2.5vw, 32px)" }}>Requity Income Fund</h3>
                <p className="fund-desc">
                  A diversified real estate credit fund targeting consistent monthly
                  income backed by tangible assets with conservative underwriting.
                  First-lien bridge loans, zero defaults, $1M GP first-loss.
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1px",
                  background: "var(--border-light)",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 24,
                }}>
                  {[
                    { label: "Target Return", value: "10% Annual" },
                    { label: "Liquidity", value: "Quarterly" },
                    { label: "Minimum", value: "$100,000" },
                    { label: "Distributions", value: "Monthly" },
                  ].map((t, i) => (
                    <div key={i} style={{
                      padding: "14px 16px",
                      background: "var(--white)",
                      textAlign: "center",
                    }}>
                      <p style={{ fontSize: 11, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 500, marginBottom: 4 }}>{t.label}</p>
                      <p style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text)", letterSpacing: "-0.5px" }}>{t.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Link href="/fund" className="btn-primary">
                    View Fund Details <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/lending"
                    className="borrower-cta-link"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: "0.5px",
                      color: "rgba(255,255,255,0.55)",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "color 0.2s ease",
                    }}
                  >
                    Looking for a loan? Apply here <ArrowRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Syndications Card */}
              <div className="fund-card" style={{ margin: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <span style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 40,
                    color: "var(--gold-muted)",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    opacity: 0.7,
                  }}>02</span>
                  <div style={{ height: 24, width: 1, background: "rgba(255,255,255,0.12)" }} />
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color: "var(--gold-muted)",
                  }}>Equity</span>
                </div>
                <h3 className="fund-title" style={{ fontSize: "clamp(24px, 2.5vw, 32px)" }}>Real Estate Syndications</h3>
                <p className="fund-desc">
                  Value-add real estate syndications targeting ~2X investor capital
                  over 5 years with targeted monthly distributions and significant tax advantages
                  through depreciation. MHC and RV park opportunities.
                </p>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1px",
                  background: "var(--border-light)",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 24,
                }}>
                  {[
                    { label: "Target IRR", value: "14-17%" },
                    { label: "Hold Period", value: "3-5 Years" },
                    { label: "Minimum", value: "$50,000" },
                    { label: "Distributions", value: "Monthly" },
                  ].map((t, i) => (
                    <div key={i} style={{
                      padding: "14px 16px",
                      background: "var(--white)",
                      textAlign: "center",
                    }}>
                      <p style={{ fontSize: 11, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 500, marginBottom: 4 }}>{t.label}</p>
                      <p style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text)", letterSpacing: "-0.5px" }}>{t.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Link href="/invest/syndications" className="btn-primary">
                    View Current Offerings <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Individual Debt Deals Callout */}
          <ScrollReveal>
            <div
              style={{
                marginTop: 24,
                padding: "28px 36px",
                background: "var(--white)",
                border: "1px solid var(--border-light)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 32,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 280 }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 8,
                }}>
                  Individual Loan Participations
                </p>
                <p style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "var(--text-mid)",
                  maxWidth: 560,
                }}>
                  Prefer to choose your own deals? We also offer individual loan participations
                  at 11-12% target yield on specific bridge loans. Same asset classes, same
                  underwriting, with the ability to select the deals your capital goes into.
                </p>
              </div>
              <Link
                href="/invest/request-access"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                Learn More <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.filter((t) => t.category === "investor").length > 0 && (
        <section className="light-zone section-gap-lg">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">Testimonials</p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                Trusted by <em>Investors</em>
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                  gap: 24,
                }}
              >
                {testimonials.filter((t) => t.category === "investor").slice(0, 4).map((t) => (
                  <div key={t.id} className="test-card">
                    <div className="big-q">&ldquo;</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{t.author_name}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="light-zone section-pad-lg" style={{ borderTop: "1px solid var(--border-light)" }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 40 }}>
              Frequently asked questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={investFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <FooterCTA
        headline={
          <>
            Ready to <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Invest</em>?
          </>
        }
        body="Request access to learn more about the Requity Income Fund, our syndication opportunities, and how you can start building wealth through real assets."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </Link>
        }
      />

      {/* Responsive overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .borrower-cta-link:hover {
              color: rgba(255,255,255,0.85) !important;
            }
            @media (max-width: 768px) {
              .invest-pathways-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
