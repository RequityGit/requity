import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import { renderEmText } from "../../lib/renderEmText";
import type { PageSection, SiteStat, Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import FooterCTA from "../components/FooterCTA";
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
    "Invest in value-add real estate with Requity Group. Access institutional-quality investments through our vertically integrated platform.",
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
  { icon: <DollarSign size={20} />, label: "$70M+ Capital Raised" },
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

  return (
    <main>
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
            <a href="#access" className="btn-primary">
              Request Access <ArrowRight size={16} />
            </a>
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
                  <p>{b.description}</p>
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
              <a href="#access" className="btn-primary">
                Request Access <ArrowRight size={16} />
              </a>
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
                    <div className="stars">{"★".repeat(t.rating)}</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{t.author_name}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* CTA */}
      <FooterCTA
        headline={
          <>
            Ready to <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Invest</em>?
          </>
        }
        body="Request access to learn more about the Requity Income Fund and how you can start earning consistent, asset-backed monthly income."
        primaryCta={
          <a href="mailto:invest@requitygroup.com" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </a>
        }
      />
    </main>
  );
}
