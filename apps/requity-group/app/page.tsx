import Link from "next/link";
import { fetchSiteData } from "../lib/supabase";
import { renderEmText } from "../lib/renderEmText";
import type {
  PageSection,
  SiteStat,
  Testimonial,
  SiteValue,
  Insight,
} from "../lib/types";
import StatsBar from "./components/StatsBar";
import ScrollReveal from "./components/ScrollReveal";
import AnimatedLine from "./components/AnimatedLine";
import SectionLabel from "./components/SectionLabel";
import PageHero from "./components/PageHero";
import FooterCTA from "./components/FooterCTA";
import { ArrowRight, Eye, Shield, TrendingUp, Heart } from "lucide-react";

export const revalidate = 300;

const VALUE_ICONS: Record<string, React.ReactNode> = {
  eye: <Eye size={22} />,
  shield: <Shield size={22} />,
  "trending-up": <TrendingUp size={22} />,
  heart: <Heart size={22} />,
};

export default async function HomePage() {
  const [sections, stats, testimonials, values, insights] = await Promise.all([
    fetchSiteData<PageSection>("site_page_sections", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
    fetchSiteData<SiteValue>("site_values", {
      eq: ["is_published", true],
    }),
    fetchSiteData<Insight>("site_insights", {
      eq: ["is_published", true],
    }),
  ]);

  const hero = sections.find((s) => s.section_key === "hero");
  const whatWeDo = sections.find((s) => s.section_key === "what_we_do");
  const bridgeCta = sections.find((s) => s.section_key === "bridge_cta");
  const cards = (whatWeDo?.metadata?.cards as Array<{ title: string; description: string; metric: string }>) ?? [];
  const featuredTestimonials = testimonials.filter((t) => t.is_featured).slice(0, 2);
  const recentInsights = insights.slice(0, 3);

  return (
    <main>
      {/* ══════════════════════════════════════════════════════════
          NEW CONTENT: Hero (bottom-anchored, navy with grid pattern)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- NEW CONTENT: Hero --> */}
      <PageHero
        label="Real Estate Investment &amp; Lending"
        headline={
          <>
            Building value in{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              real estate
            </em>
          </>
        }
        body="A vertically integrated platform for acquiring, operating, and lending on value-add real estate across the United States."
        cta={
          <Link href="/invest" className="btn-editorial-light">
            Explore Offerings <span className="arrow">&rarr;</span>
          </Link>
        }
      />

      {/* ══════════════════════════════════════════════════════════
          NEW CONTENT: Stats Bar (navy, below hero)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- NEW CONTENT: Stats Bar --> */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <AnimatedLine light />
          <div className="stats-grid on-navy">
            <div className="stat-cell">
              <div className="stat-num gold">$150M+</div>
              <div className="stat-lbl">Assets Under Management</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num gold">32</div>
              <div className="stat-lbl">Properties Acquired</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num gold">70+</div>
              <div className="stat-lbl">Loans Originated</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num gold">3,000+</div>
              <div className="stat-lbl">Units Transacted</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          EXISTING CONTENT: Hero (original from Supabase)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- EXISTING CONTENT: Hero --> */}
      <section
        className="dark-zone"
        style={{
          paddingTop: "clamp(120px, 16vw, 180px)",
          paddingBottom: "clamp(80px, 10vw, 120px)",
        }}
      >
        <div className="container">
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
            {hero?.cta_text && hero?.cta_url && (
              <Link href={hero.cta_url} className="btn-primary">
                {hero.cta_text} <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/lending" className="btn-secondary">
              Lending
            </Link>
          </div>
        </div>
      </section>

      {/* <!-- EXISTING CONTENT: Stats --> */}
      <section
        className="dark-zone"
        style={{ paddingTop: 0, paddingBottom: 0 }}
      >
        <div className="container">
          <StatsBar stats={stats} />
        </div>
      </section>

      {/* Curve transition */}
      <div className="dark-to-light" />

      {/* ══════════════════════════════════════════════════════════
          NEW CONTENT: About Section (editorial two-column, cream)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- NEW CONTENT: About Section --> */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>About</SectionLabel>
              </div>
              <div>
                <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 32 }}>
                  We don&apos;t just raise capital.
                </h2>
                <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 680, marginBottom: 24 }}>
                  Requity Group is a vertically integrated real estate firm that acquires, operates, and lends on
                  value-add properties. We apply institutional rigor to small-cap real estate, creating returns in
                  niche markets that larger firms can&apos;t efficiently access.
                </p>
                <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 680, marginBottom: 44 }}>
                  Our principals invest alongside our investors in every transaction. With over $150 million in
                  assets under management, we have the track record and operational depth to deliver.
                </p>
                <Link href="/about" className="btn-editorial">
                  Learn More <span className="arrow">&rarr;</span>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="light-zone" style={{ padding: "0 0 24px" }}>
        <div className="container">
          <AnimatedLine />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          NEW CONTENT: Platform Section (three-column editorial)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- NEW CONTENT: Platform Section --> */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Platform</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 64 }}>
              Two pathways to{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>real asset</em> returns
            </h2>
          </ScrollReveal>

          {/* Offering 1: Equity */}
          <ScrollReveal>
            <div className="editorial-3col" style={{ marginBottom: 64, paddingBottom: 64, borderBottom: "1px solid var(--border)" }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 64,
                    fontWeight: 400,
                    color: "var(--border)",
                    lineHeight: 1,
                    marginBottom: 16,
                    letterSpacing: -2,
                  }}
                >
                  01
                </div>
                <p className="type-label" style={{ color: "var(--gold)" }}>Equity</p>
              </div>
              <div>
                <h3 className="type-h3" style={{ color: "var(--text)", marginBottom: 16 }}>
                  Direct Real Estate Investment
                </h3>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 32, maxWidth: 480 }}>
                  Access institutional-quality real estate through direct equity participation. We source, acquire,
                  renovate, and operate value-add properties across residential and commercial asset classes.
                </p>
                <Link href="/invest" className="btn-editorial">
                  View Current Offerings <span className="arrow">&rarr;</span>
                </Link>
              </div>
              <div className="card" style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span className="type-body-sm" style={{ color: "var(--text-light)" }}>Target IRR</span>
                  <span className="type-body-sm" style={{ color: "var(--text)", fontWeight: 500 }}>15 &ndash; 22%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span className="type-body-sm" style={{ color: "var(--text-light)" }}>Hold Period</span>
                  <span className="type-body-sm" style={{ color: "var(--text)", fontWeight: 500 }}>2 &ndash; 4 Years</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                  <span className="type-body-sm" style={{ color: "var(--text-light)" }}>Minimum</span>
                  <span className="type-body-sm" style={{ color: "var(--text)", fontWeight: 500 }}>$50,000</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Offering 2: Credit */}
          <ScrollReveal>
            <div className="editorial-3col">
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 64,
                    fontWeight: 400,
                    color: "var(--border)",
                    lineHeight: 1,
                    marginBottom: 16,
                    letterSpacing: -2,
                  }}
                >
                  02
                </div>
                <p className="type-label" style={{ color: "var(--gold)" }}>Credit</p>
              </div>
              <div>
                <h3 className="type-h3" style={{ color: "var(--text)", marginBottom: 16 }}>
                  Bridge Lending
                </h3>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 32, maxWidth: 480 }}>
                  Earn consistent, asset-backed income through our bridge lending platform. Every loan is secured
                  by first-lien positions on residential and commercial real estate with conservative underwriting.
                </p>
                <Link href="/lending" className="btn-editorial">
                  Explore Lending <span className="arrow">&rarr;</span>
                </Link>
              </div>
              <div className="card" style={{ padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span className="type-body-sm" style={{ color: "var(--text-light)" }}>Target Yield</span>
                  <span className="type-body-sm" style={{ color: "var(--text)", fontWeight: 500 }}>8 &ndash; 12%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <span className="type-body-sm" style={{ color: "var(--text-light)" }}>Loan Term</span>
                  <span className="type-body-sm" style={{ color: "var(--text)", fontWeight: 500 }}>6 &ndash; 18 Months</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                  <span className="type-body-sm" style={{ color: "var(--text-light)" }}>Average LTV</span>
                  <span className="type-body-sm" style={{ color: "var(--text)", fontWeight: 500 }}>65%</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          EXISTING CONTENT: What We Do
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- EXISTING CONTENT: What We Do --> */}
      <section className="light-zone section-gap-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">What We Do</p>
            <h2 className="section-title">
              {renderEmText(whatWeDo?.heading)}
            </h2>
            <p className="section-desc" style={{ marginBottom: 56 }}>
              {whatWeDo?.body_text}
            </p>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {cards.map((card, i) => (
                <div key={i} className="card">
                  <div className="card-number">0{i + 1}</div>
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-body">{card.description}</p>
                  <div className="card-metric">{card.metric}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          NEW CONTENT: Approach Section (three pillars)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- NEW CONTENT: Approach Section --> */}
      <section className="dark-zone section-pad-lg" style={{ overflow: "hidden" }}>
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <SectionLabel light>Approach</SectionLabel>
            <h2 className="type-h2" style={{ color: "#fff", marginBottom: 64 }}>
              What sets us apart
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              <div style={{ borderTop: "2px solid var(--gold)", paddingTop: 32 }}>
                <h4 className="type-h4" style={{ color: "#fff", marginBottom: 12 }}>
                  Vertically Integrated
                </h4>
                <p className="type-body-sm" style={{ color: "var(--navy-text-mid)", lineHeight: 1.75 }}>
                  We control every stage of the investment lifecycle: sourcing, acquisition, renovation, property
                  management, and disposition. This means tighter oversight and better outcomes.
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--navy-border)", paddingTop: 32 }}>
                <h4 className="type-h4" style={{ color: "#fff", marginBottom: 12 }}>
                  Aligned Capital
                </h4>
                <p className="type-body-sm" style={{ color: "var(--navy-text-mid)", lineHeight: 1.75 }}>
                  Our principals invest significant personal capital alongside our investors in every transaction.
                  We succeed only when our investors succeed.
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--navy-border)", paddingTop: 32 }}>
                <h4 className="type-h4" style={{ color: "#fff", marginBottom: 12 }}>
                  Institutional Standards
                </h4>
                <p className="type-body-sm" style={{ color: "var(--navy-text-mid)", lineHeight: 1.75 }}>
                  Rigorous underwriting, quarterly investor reporting, third-party audits, and full transparency:
                  the standards institutional allocators expect, applied to every deal.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          EXISTING CONTENT: Bridge Loan CTA
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- EXISTING CONTENT: Bridge CTA --> */}
      {bridgeCta && (
        <section className="light-zone section-gap-sm">
          <div className="container">
            <ScrollReveal>
              <div className="lending-cta-banner">
                <div>
                  <h3>{renderEmText(bridgeCta.heading)}</h3>
                  <p>{bridgeCta.body_text}</p>
                </div>
                {bridgeCta.cta_text && bridgeCta.cta_url && (
                  <Link href={bridgeCta.cta_url} className="btn-primary">
                    {bridgeCta.cta_text} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          EXISTING CONTENT: Testimonials
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- EXISTING CONTENT: Testimonials --> */}
      {featuredTestimonials.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">
                Investor Testimonials
              </p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                What Our <em>Investors</em> Say
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
                {featuredTestimonials.map((t) => (
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

      {/* ══════════════════════════════════════════════════════════
          EXISTING CONTENT: Values
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- EXISTING CONTENT: Values --> */}
      {values.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">Our Values</p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                What <em>Drives</em> Us
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 20,
                }}
              >
                {values.map((v) => (
                  <div key={v.id} className="value-item">
                    <div style={{ color: "var(--gold)", marginBottom: 14 }}>
                      {VALUE_ICONS[v.icon_identifier ?? ""] ?? null}
                    </div>
                    <h4>{v.title}</h4>
                    <p>{v.description}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          EXISTING CONTENT: Insights
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- EXISTING CONTENT: Insights --> */}
      {recentInsights.length > 0 && (
        <section className="light-zone section-gap-md">
          <div className="container">
            <ScrollReveal>
              <p className="section-eyebrow section-eyebrow-dark">Insights</p>
              <h2 className="section-title" style={{ marginBottom: 48 }}>
                Recent <em>Insights</em>
              </h2>
            </ScrollReveal>
            <ScrollReveal staggerChildren>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24,
                }}
              >
                {recentInsights.map((insight) => (
                  <div key={insight.id} className="card">
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {insight.tags?.map((tag) => (
                        <span key={tag} className="insight-tag">{tag}</span>
                      ))}
                    </div>
                    <h3 className="card-title" style={{ fontSize: 21 }}>
                      {insight.title}
                    </h3>
                    <p className="card-body">{insight.excerpt}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          NEW CONTENT: CTA Section (navy)
          ══════════════════════════════════════════════════════════ */}
      {/* <!-- NEW CONTENT: CTA --> */}
      <FooterCTA
        headline={
          <>
            Invest with{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>conviction</em>
          </>
        }
        body="Accredited investors can request access to our current equity and credit offerings."
        primaryCta={
          <Link href="/invest" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
