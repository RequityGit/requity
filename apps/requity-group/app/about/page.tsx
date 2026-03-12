import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type {
  SiteStat,
  TeamMember,
  Testimonial,
} from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedLine from "../components/AnimatedLine";
import SectionLabel from "../components/SectionLabel";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Requity Group, a vertically integrated real estate investment company with deep operational expertise.",
};

export const revalidate = 300;

export default async function AboutPage() {
  const [stats, team, testimonials] = await Promise.all([
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<TeamMember>("site_team_members", {
      eq: ["is_published", true],
    }),
    fetchSiteData<Testimonial>("site_testimonials", {
      eq: ["is_published", true],
    }),
  ]);

  return (
    <main>
      {/* Hero */}
      <PageHero
        label="About Requity Group"
        headline={
          <>
            We build value through{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>ownership</em>
          </>
        }
        body="Requity Group is a vertically integrated real estate firm that acquires, operates, manages, and lends on value-add properties across the United States."
      />

      {/* Stats Bar */}
      <section className="dark-zone" style={{ padding: 0 }}>
        <div className="container">
          <AnimatedLine light />
          <div className="stats-grid on-navy">
            {stats.map((stat) => (
              <div key={stat.id} className="stat-cell">
                <div className="stat-num gold">{stat.display_value}</div>
                <div className="stat-lbl">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Quote */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>Our Mission</SectionLabel>
              </div>
              <div>
                <blockquote
                  className="type-h3"
                  style={{
                    color: "var(--text)",
                    fontStyle: "italic",
                    marginBottom: 40,
                    maxWidth: 680,
                  }}
                >
                  &ldquo;The best real estate returns come from operators who are close to the asset,
                  not from spreadsheets managed three layers removed from the property.&rdquo;
                </blockquote>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--navy)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold-muted)",
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      fontWeight: 400,
                    }}
                  >
                    DM
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 400, color: "var(--text)" }}>
                      Dylan Marma
                    </div>
                    <div className="type-caption" style={{ color: "var(--text-light)", marginTop: 2 }}>
                      Founder &amp; CEO
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Story */}
      <section className="light-zone" style={{ paddingBottom: 120 }}>
        <div className="container">
          <AnimatedLine />
          <ScrollReveal>
            <div className="editorial-grid" style={{ marginTop: 80 }}>
              <div>
                <SectionLabel>Our Story</SectionLabel>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 48px" }}>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 36, maxWidth: 680 }}>
                  Requity Group was founded on a simple thesis: the most compelling risk-adjusted returns in real
                  estate come from hands-on operators working in markets too small for institutional capital to
                  pursue efficiently.
                </p>
                <p className="type-body" style={{ color: "var(--text-mid)", marginBottom: 36, maxWidth: 680 }}>
                  Today, we manage over $150 million in assets across residential and commercial properties. Our
                  lending platform has originated 70+ bridge loans, and our investment arm has acquired 32
                  properties totaling over 3,000 units transacted.
                </p>
                <p className="type-body" style={{ color: "var(--text-mid)", maxWidth: 680, gridColumn: "1 / -1" }}>
                  What makes us different is simple: we operate every asset we own. We don&apos;t outsource
                  property management or rely on third-party sponsors. From sourcing and underwriting to
                  renovation and stabilization, our team executes every stage of the investment lifecycle.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Team */}
      <section className="dark-zone section-pad-lg" style={{ overflow: "hidden" }}>
        <div className="navy-grid-pattern">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="navy-grid-line" style={{ left: `${(i + 1) * 7.14}%` }} />
          ))}
        </div>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <ScrollReveal>
            <SectionLabel light>Leadership</SectionLabel>
            <h2 className="type-h2" style={{ color: "#fff", marginBottom: 64 }}>
              Experienced operators with{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>skin in the game</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {team.map((member) => (
                <div key={member.id} className="card-navy" style={{ padding: "36px 32px" }}>
                  <div className="team-avatar on-navy" style={{ marginBottom: 24 }}>
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="team-name on-navy">{member.name}</div>
                  <p className="team-title">{member.title}</p>
                  <p className="team-bio on-navy">{member.bio}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Principles */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <div className="editorial-grid">
              <div>
                <SectionLabel>Principles</SectionLabel>
              </div>
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 40 }}>
                  {[
                    { num: "01", title: "Operator First", desc: "Every property we own is managed by our team. Real-time visibility and the ability to protect value at the asset level." },
                    { num: "02", title: "Radical Alignment", desc: "Our principals invest meaningful personal capital in every deal. We only succeed when our investors succeed." },
                    { num: "03", title: "Full Transparency", desc: "Quarterly reporting, open communication, and no hidden fees. Investors always know exactly where their capital is." },
                    { num: "04", title: "Disciplined Growth", desc: "We don't chase deals to deploy capital. Every acquisition and every loan is underwritten to our standards." },
                  ].map((p) => (
                    <div key={p.num} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                      <div className="principle-badge">{p.num}</div>
                      <div>
                        <h4 className="type-h4" style={{ color: "var(--text)", marginBottom: 8 }}>{p.title}</h4>
                        <p className="type-body-sm" style={{ color: "var(--text-mid)", lineHeight: 1.75 }}>{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Milestones */}
      <section className="cream-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Milestones</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 64 }}>
              Our trajectory
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 0 }}>
              {[
                { marker: "Founded", title: "Company Launch", desc: "Requity Group established with a focus on value-add real estate in underserved markets.", accent: false },
                { marker: "$25M", title: "First Milestone", desc: "Reached $25M AUM and closed first 10 bridge loans through Requity Lending.", accent: false },
                { marker: "$70M", title: "Capital Raised", desc: "Surpassed $70M in investor capital across equity and credit strategies.", accent: false },
                { marker: "$150M+", title: "Current AUM", desc: "32 properties acquired, 70+ loans originated, 3,000+ units transacted and scaling toward $1B.", accent: true },
              ].map((m) => (
                <div
                  key={m.marker}
                  style={{
                    padding: "0 32px 0 32px",
                    borderLeft: "2px solid var(--border)",
                  }}
                >
                  <div
                    className="type-stat"
                    style={{
                      color: m.accent ? "var(--gold)" : "var(--text)",
                      marginBottom: 8,
                      fontSize: "clamp(24px, 3vw, 36px)",
                    }}
                  >
                    {m.marker}
                  </div>
                  <div className="type-label" style={{ color: "var(--text-light)", marginBottom: 16, letterSpacing: 2, fontSize: 11 }}>
                    {m.title}
                  </div>
                  <p className="type-body-sm" style={{ color: "var(--text-mid)", lineHeight: 1.75 }}>
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="cream-zone section-pad-lg">
          <div className="container">
            <ScrollReveal>
              <SectionLabel>Testimonials</SectionLabel>
              <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
                What our investors say
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
        label="Get Started"
        headline={
          <>
            Partner with{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>Requity</em>
          </>
        }
        body="We're always looking to connect with aligned investors, borrowers, and partners who share our commitment to building real value."
        primaryCta={
          <Link href="/invest" className="btn-primary">
            Invest With Us <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <Link href="/lending" className="btn-secondary">
            Apply for a Loan <ArrowRight size={16} />
          </Link>
        }
      />
    </main>
  );
}
