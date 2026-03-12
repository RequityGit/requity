import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { Testimonial } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import FooterCTA from "../components/FooterCTA";
import AnimatedLine from "../components/AnimatedLine";
import SectionLabel from "../components/SectionLabel";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  ShieldCheck,
  Clock,
  TrendingUp,
  Building2,
  Landmark,
  RefreshCw,
  Users,
  BarChart3,
  Play,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Requity Income Fund | Consistent Monthly Income from Real Estate",
  description:
    "Invest in the Requity Income Fund â a diversified real estate credit fund targeting 10% annual preferred return with monthly distributions, 90-day liquidity, and first-position liens.",
  openGraph: {
    title: "Requity Income Fund | Requity Group",
    description:
      "A diversified real estate credit fund targeting consistent monthly income backed by tangible assets with conservative underwriting. 10% annual preferred return.",
  },
  twitter: {
    title: "Requity Income Fund | Requity Group",
    description:
      "A diversified real estate credit fund targeting 10% annual preferred return with monthly distributions and 90-day liquidity.",
  },
};

export const revalidate = 300;

const FUND_FEATURES = [
  {
    icon: <RefreshCw size={20} />,
    label: "Evergreen Structure",
  },
  {
    icon: <Landmark size={20} />,
    label: "Tax Advantaged",
  },
  {
    icon: <TrendingUp size={20} />,
    label: "10% Annual Preferred Return",
  },
  {
    icon: <Clock size={20} />,
    label: "90-Day Redemption Liquidity",
  },
];

const FUND_STATS = [
  { value: "10%", label: "Preferred Return" },
  { value: "$70M+", label: "Capital Raised" },
  { value: "90 Day", label: "Redemption Liquidity" },
  { value: "Monthly", label: "Distributions" },
];

export default async function FundPage() {
  const testimonials = await fetchSiteData<Testimonial>("site_testimonials", {
    eq: ["is_published", true],
  });

  return (
    <main>
      {/* âââââââââââââââââ HERO âââââââââââââââââ */}
      <section
        className="dark-zone hero-gradient"
        style={{
          paddingTop: "clamp(160px, 20vw, 240px)",
          paddingBottom: "clamp(80px, 10vw, 140px)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="navy-glow" style={{ top: "10%", right: "15%" }} />
        <div className="navy-bottom-fade" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ animation: "fadeUp 0.8s ease forwards" }}>
            <SectionLabel light>Now Open to Investors</SectionLabel>
          </div>
          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 800,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            Requity <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Income</em> Fund
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 17,
              lineHeight: 1.75,
              color: "var(--navy-text-mid)",
              maxWidth: 560,
              marginTop: 28,
              animation: "fadeUp 0.8s 0.2s ease both",
            }}
          >
            A diversified real estate credit fund targeting consistent monthly income
            backed by tangible assets with conservative underwriting.
          </p>

          {/* Fund Feature Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 40,
              animation: "fadeUp 0.8s 0.3s ease both",
            }}
          >
            {FUND_FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  fontWeight: 400,
                }}
              >
                <span style={{ color: "var(--gold-muted)", flexShrink: 0 }}>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 48,
              animation: "fadeUp 0.8s 0.4s ease both",
              flexWrap: "wrap",
            }}
          >
            <a href="#access" className="btn-primary">
              Request Access <ArrowRight size={16} />
            </a>
            <Link href="/invest" className="btn-secondary">
              All Strategies
            </Link>
          </div>
        </div>
      </section>

      {/* âââââââââââââââââ STATS BAR âââââââââââââââââ */}
      <section className="dark-zone">
        <div style={{ maxWidth: "var(--content-max)", margin: "0 auto" }}>
          <div className="stats-grid on-navy">
            {FUND_STATS.map((s, i) => (
              <div key={i} className="stat-cell">
                <div className="stat-num champagne">{s.value}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* âââââââââââââââââ OFFERING DESCRIPTION âââââââââââââââââ */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>The Fund</SectionLabel>
              </div>
              <div>
                <h2 className="section-title" style={{ maxWidth: 600 }}>
                  Offering <em>Description</em>
                </h2>
                <p className="section-desc" style={{ maxWidth: 640, marginBottom: 36 }}>
                  The objective of Requity Income Fund is to invest in a diverse mix of
                  real estate-backed, first-position bridge loans. Leveraging our operations
                  experience, we underwrite conservatively and undergo thoughtful deal selection
                  to minimize risk while generating consistent, high-yield cash flow for our investors.
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 32,
                    marginBottom: 40,
                  }}
                >
                  {[
                    { icon: <Clock size={18} />, text: "90-Day Liquidity" },
                    { icon: <ShieldCheck size={18} />, text: "First Position Liens" },
                    { icon: <Building2 size={18} />, text: "Experienced Operators" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "var(--text-mid)",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ color: "var(--gold)" }}>{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
                <a href="#access" className="btn-editorial">
                  Access Fund <span className="arrow"><ArrowRight size={14} /></span>
                </a>
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

      {/* âââââââââââââââââ WHY REQUITY âââââââââââââââââ */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <p className="section-eyebrow section-eyebrow-dark">Why Requity</p>
            <h2 className="section-title" style={{ marginBottom: 20, maxWidth: 500 }}>
              Why with <em>Requity</em>?
            </h2>
            <p className="section-desc" style={{ marginBottom: 64 }}>
              We bring operational expertise, aligned capital, and structural advantages
              that benefit our investors at every level.
            </p>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {/* Card 1 */}
              <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <Building2 size={24} />
                </div>
                <h4 className="card-title">Operators with Proven Experience</h4>
                <p className="card-body">
                  Deep operational expertise with a track record of disciplined
                  acquisitions and strong cash-flow performance across our portfolio.
                </p>
                <div style={{ marginTop: "auto", paddingTop: 24 }}>
                  <Link href="/invest" className="btn-editorial" style={{ fontSize: 12 }}>
                    View Portfolio <span className="arrow"><ArrowUpRight size={12} /></span>
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <RefreshCw size={24} />
                </div>
                <h4 className="card-title">Distribution Reinvestment Program</h4>
                <p className="card-body">
                  Automatically reinvest distributions to compound returns over time,
                  increasing long-term capital efficiency without additional action.
                </p>
              </div>

              {/* Card 3 */}
              <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <ShieldCheck size={24} />
                </div>
                <h4 className="card-title">First-Loss Position</h4>
                <p className="card-body">
                  TRG takes the first-loss position in every deal, aligning our capital
                  with investors and reinforcing our commitment to disciplined underwriting
                  and downside protection.
                </p>
              </div>

              {/* Card 4 */}
              <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "var(--gold)", marginBottom: 16 }}>
                  <Landmark size={24} />
                </div>
                <h4 className="card-title">Tax Advantaged through SubREIT*</h4>
                <p className="card-body">
                  The SubREIT structure enhances after-tax returns by generating qualified
                  REIT income while simplifying investor reporting and reducing administrative
                  complexity.
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-light)",
                    marginTop: 16,
                    fontStyle: "italic",
                  }}
                >
                  *Expected to be in effect by 6/1/26
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* âââââââââââââââââ WHY PRIVATE CREDIT (Dark) âââââââââââââââââ */}
      <section
        className="dark-zone section-pad-xl"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="navy-glow" style={{ bottom: "10%", left: "5%" }} />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <SectionLabel light>The Opportunity</SectionLabel>
            <h2
              className="type-h2"
              style={{
                color: "#fff",
                marginBottom: 24,
                maxWidth: 600,
              }}
            >
              Why Real Estate <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Private Credit</em>?
            </h2>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--navy-text-mid)",
                maxWidth: 600,
                marginBottom: 64,
              }}
            >
              We originate and invest in asset-backed private credit designed to generate
              durable cash flow independent of public equity and bond markets.
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
              {/* Benefit 1 */}
              <div className="card-navy" style={{ padding: "clamp(28px, 3vw, 40px)" }}>
                <div style={{ color: "var(--gold-muted)", marginBottom: 20 }}>
                  <Calendar size={24} />
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    color: "#fff",
                    marginBottom: 12,
                    letterSpacing: "-0.3px",
                    lineHeight: 1.25,
                  }}
                >
                  Consistent Monthly Income
                </h4>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "var(--navy-text-mid)",
                  }}
                >
                  Earn above-market yields with real estate as collateral, typically
                  with less volatility than stocks or traditional high-yield strategies.
                  Predictable, recurring cash flow.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="card-navy" style={{ padding: "clamp(28px, 3vw, 40px)" }}>
                <div style={{ color: "var(--gold-muted)", marginBottom: 20 }}>
                  <ShieldCheck size={24} />
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    color: "#fff",
                    marginBottom: 12,
                    letterSpacing: "-0.3px",
                    lineHeight: 1.25,
                  }}
                >
                  Significant Collateral &amp; Downside Protection
                </h4>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "var(--navy-text-mid)",
                  }}
                >
                  Every loan is backed by a first-position lien on real property,
                  offering downside protection through real, often cash-flowing assets
                  with protective covenants and recourse requirements.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="card-navy" style={{ padding: "clamp(28px, 3vw, 40px)" }}>
                <div style={{ color: "var(--gold-muted)", marginBottom: 20 }}>
                  <TrendingUp size={24} />
                </div>
                <h4
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    color: "#fff",
                    marginBottom: 12,
                    letterSpacing: "-0.3px",
                    lineHeight: 1.25,
                  }}
                >
                  High Demand, Limited Supply
                </h4>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "var(--navy-text-mid)",
                  }}
                >
                  With banks pulling back, experienced borrowers still need capital.
                  We fill the gap on our terms, with strong underwriting and pricing power.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* âââââââââââââââââ NON-CORRELATED INCOME BANNER âââââââââââââââââ */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="lending-cta-banner">
              <div>
                <h3>
                  Non-Correlated Income Through{" "}
                  <em>Private Credit</em>.
                </h3>
                <p>
                  Capital is deployed into vetted, first-position opportunities with a
                  focus on downside protection and consistent income â independent of
                  public equity and bond markets.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
                <a href="#access" className="btn-primary">
                  Get Started <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* âââââââââââââââââ OUR EDGE âââââââââââââââââ */}
      <section className="cream-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>Our Edge</SectionLabel>
              </div>
              <div>
                <h2 className="section-title" style={{ maxWidth: 500, marginBottom: 48 }}>
                  Built by <em>Operators</em>, Not Just Lenders
                </h2>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal staggerChildren>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              <div className="card">
                <div className="card-number">01</div>
                <h4 className="card-title">Proven Track Record</h4>
                <p className="card-body">
                  Deep operational expertise with a track record of disciplined
                  acquisitions and strong cash-flow performance across multifamily,
                  manufactured housing, and RV parks.
                </p>
              </div>

              <div className="card">
                <div className="card-number">02</div>
                <h4 className="card-title">Aligned Capital</h4>
                <p className="card-body">
                  TRG takes the first-loss position in every deal, aligning our capital
                  with investors and reinforcing our commitment to disciplined underwriting
                  and downside protection.
                </p>
              </div>

              <div className="card">
                <div className="card-number">03</div>
                <h4 className="card-title">Entrepreneurial Execution</h4>
                <p className="card-body">
                  Niche expertise and execution speed allow us to win off-market deals
                  others overlook. We move decisively, unlocking value where others hesitate.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* âââââââââââââââââ TESTIMONIALS âââââââââââââââââ */}
      {testimonials.length > 0 && (
        <section className="light-zone section-pad-lg">
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
                    <div className="stars">{"â".repeat(t.rating)}</div>
                    <p className="quote-text">&ldquo;{t.quote}&rdquo;</p>
                    <div className="author-name">{t.author_name}</div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* âââââââââââââââââ FUND CARD (Request Access) âââââââââââââââââ */}
      <section className="light-zone section-gap-sm" style={{ paddingBottom: 120 }} id="access">
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
                {[
                  { icon: <Calendar size={20} />, label: "Monthly Distributions" },
                  { icon: <DollarSign size={20} />, label: "$70M+ Capital Raised" },
                  { icon: <Users size={20} />, label: "Accredited Investors Only" },
                  { icon: <BarChart3 size={20} />, label: "Asset-Backed Real Estate" },
                ].map((h, i) => (
                  <div key={i} className="fund-highlight">
                    <span className="fund-highlight-icon">{h.icon}</span>
                    {h.label}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <a href="mailto:invest@requitygroup.com" className="btn-primary">
                  Request Access <ArrowRight size={16} />
                </a>
                <a
                  href="mailto:invest@requitygroup.com"
                  className="btn-editorial-light"
                >
                  Access Fund Materials{" "}
                  <span className="arrow"><ArrowRight size={14} /></span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* âââââââââââââââââ FOOTER CTA âââââââââââââââââ */}
      <FooterCTA
        label="Get Started"
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
        secondaryCta={
          <Link href="/about" className="btn-secondary">
            About Requity
          </Link>
        }
      />
    </main>
  );
}
