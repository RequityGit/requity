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
      answer: "$50,000 is the minimum investment. Requity Group investment offerings are available to accredited investors only, as defined by SEC regulations.",
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
      answer: "The bridge lending fund pays monthly distributions. Equity deal distributions vary by project and are typically paid quarterly or upon capital events such as refinance or sale.",
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
            <Link href="/about" className="btn-secondary">
              About Requity
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

      {/* Income Fund */}
      <section className="light-zone section-gap-sm">
        <div className="container">
          <ScrollReveal>
            <div className="fund-card">
              <span className="fund-badge">Now Open to Investors</span>
              <h2 className="fund-title">Requity Income Fund</h2>
              <p className="fund-desc">
                A diversified real estate credit fund targeting consistent monthly
                income backed by tangible assets with conservative underwriting.
                The fund deploys capital across bridge loans, manufactured housing,
                RV parks, and multifamily properties.
              </p>
              <div className="fund-highlights">
                {FUND_HIGHLIGHTS.map((h, i) => (
                  <div key={i} className="fund-highlight">
                    <span className="fund-highlight-icon">{h.icon}</span>
                    {h.label}
                  </div>
                ))}
              </div>
              <Link href="/fund" className="btn-primary">
                Learn More <ArrowRight size={16} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
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
                {testimonials.slice(0, 4).map((t) => (
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
        body="Request access to learn more about the Requity Income Fund and how you can start earning consistent, asset-backed monthly income."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
