import type { Metadata } from "next";
import Link from "next/link";
import { fetchSiteData } from "../../lib/supabase";
import type { SiteStat, TeamMember } from "../../lib/types";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedLine from "../components/AnimatedLine";
import SectionLabel from "../components/SectionLabel";
import PageHero from "../components/PageHero";
import FooterCTA from "../components/FooterCTA";
import { ArrowRight, Heart, Compass, Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet the Requity Group team. Founded by Dylan Marma, we apply institutional rigor to small-cap real estate, managing $150M+ in assets across 32 properties and 3,000+ units.",
  openGraph: {
    title: "About Requity Group",
    description:
      "Meet the team behind $150M+ in real estate assets. We operate every property we own — no outsourced management, no third-party sponsors.",
  },
  twitter: {
    title: "About Requity Group",
    description:
      "Meet the team behind $150M+ in real estate assets. We operate every property we own.",
  },
};

export const revalidate = 300;

/** Abbreviate long bios so team cards stay similar length (~5–6 lines like Jet/Grethel). */
function abbreviateBio(bio: string | null, maxLen = 320): string {
  if (!bio) return "";
  if (bio.length <= maxLen) return bio;
  const cut = bio.slice(0, maxLen).trim();
  const lastSpace = cut.lastIndexOf(" ");
  const atWord = lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut;
  return atWord + "\u2026";
}

const DESIGNATIONS_SUFFIX =
  " He has received the designations for CCIM and CPM as an ongoing student of the industry.";

const JET_BIO_SUFFIX =
  " Jet has over 15 years of transaction and asset management experience with various private equity and real estate investment companies.";

/** Strip filler opening for Jet so bio starts with substance. */
const JET_BIO_OPENING_FILLER = /^\s*As Asset Manager with a focus on operations,?\s*/i;

const ESTEFANIA_DISPLAY_NAME = "Estefanía Espinal, MBA";
const ESTEFANIA_BIO =
  "Estefanía is part of the Real Estate Lending and Investing team at Requity, focused on structuring and evaluating debt and equity investments across the U.S. Leveraging her prior experience, she previously served on the Capital Markets team at JLL, working alongside decision makers at some of the world's largest institutions to bring foreign capital into U.S. real estate. Before that, as part of the acquisitions team at EXAN Group, she was directly involved in over $800 million in acquisitions and dispositions across multiple asset types nationwide. Estefanía holds an MBA from Boston College, and a BS of International Business from EAFIT University.";

function isEstefania(name: string): boolean {
  return /Estefan[ií]a/i.test(name) || (name.includes("Espinal") && name.toLowerCase().includes("estefan"));
}

/** Per-member bio display: for Jet, strip filler and append experience; for Estefanía, use full override bio. */
function teamBioDisplay(name: string, bio: string | null): string {
  if (isEstefania(name)) return ESTEFANIA_BIO;
  if (!bio) return "";
  let trimmed = bio.trim();
  if (name.includes("Jet")) {
    trimmed = trimmed.replace(JET_BIO_OPENING_FILLER, "");
    if (!trimmed.includes("15 years of transaction")) {
      trimmed = (trimmed.endsWith(".") ? trimmed : trimmed + ".") + JET_BIO_SUFFIX;
    }
  }
  return trimmed;
}

/** Title override: Jet shows as Managing Director; Estefanía as Lending & Investments. */
function teamTitleDisplay(name: string, title: string): string {
  if (name.includes("Jet")) return "Managing Director";
  if (isEstefania(name)) return "Lending & Investments";
  return title;
}

/** Name override: Estefanía shows as "Estefanía Espinal, MBA". */
function teamNameDisplay(name: string): string {
  return isEstefania(name) ? ESTEFANIA_DISPLAY_NAME : name;
}

/** Display override: leadership bio ($200M, no degree). Returns bio only; add DESIGNATIONS_SUFFIX after abbreviate so it is never cut. */
function leadershipBioDisplay(bio: string | null): string {
  if (!bio) return "";
  let text = bio
    .replace(/\$150 million|150 million/gi, "$200 million")
    .replace(/\$150M|150M/gi, "$200M");
  // Remove degree sentence (attended but did not finish).
  text = text.replace(/\s*Dylan holds a degree in Accounting and Finance from the University at Albany\.?\s*/gi, " ");
  text = text.replace(/\s*He holds a degree in Accounting and Finance from the University at Albany\.?\s*/gi, " ");
  text = text.trim().replace(/\s{2,}/g, " ");
  if (!text.endsWith(".")) text += ".";
  return text;
}

export default async function AboutPage() {
  const [stats, team] = await Promise.all([
    fetchSiteData<SiteStat>("site_stats", {
      filter: { page_slug: "home" },
    }),
    fetchSiteData<TeamMember>("site_team_members", {
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
              <div className="story-grid">
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

      {/* Our Values */}
      <section className="light-zone section-pad-lg">
        <div className="container">
          <ScrollReveal>
            <h2 className="type-h2" style={{ color: "var(--text)", marginBottom: 48 }}>
              Our <span style={{ color: "var(--gold)" }}>Values</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              {[
                { num: "01", title: "Be Caring", desc: "We treat every partner, borrower, and community we touch with respect and integrity. How we do business matters as much as the results.", Icon: Heart },
                { num: "02", title: "Be Honest", desc: "Clear communication, transparent terms, and no hidden agendas. We build trust by saying what we mean and doing what we say.", Icon: Compass },
                { num: "03", title: "Be Excellent", desc: "Excellence to us means constant improvement. We hold ourselves to high standards in underwriting, operations, and reporting, and we keep raising the bar.", Icon: Trophy },
              ].map((v) => {
                const ValueIcon = v.Icon;
                return (
                  <div
                    key={v.num}
                    className="card-navy"
                    style={{
                      background: "var(--navy)",
                      border: "1px solid var(--navy-border)",
                      padding: "32px 28px",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 280,
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500, color: "var(--gold-muted)", letterSpacing: 2, marginBottom: 24 }}>
                      {v.num}
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                      <ValueIcon size={40} strokeWidth={1.5} style={{ color: "#fff" }} />
                    </div>
                    <h4 className="type-h4" style={{ color: "#fff", marginBottom: 12 }}>
                      {v.title}
                    </h4>
                    <p className="type-body-sm" style={{ color: "var(--navy-text-mid)", lineHeight: 1.65, margin: 0 }}>
                      {v.desc}
                    </p>
                  </div>
                );
              })}
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

          {/* Principal */}
          {(() => {
            const principal = team.find((m) => m.department === "leadership");
            if (!principal) return null;
            return (
              <ScrollReveal>
                <div style={{ maxWidth: 640, marginBottom: 64 }}>
                  <div className="card-navy" style={{ padding: "40px 36px" }}>
                    <div className="team-avatar on-navy" style={{ marginBottom: 24, width: 64, height: 64, fontSize: 22 }}>
                      {principal.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                    </div>
                    <div className="team-name on-navy">{principal.name.replace(/,?\s*CCIM\s*/gi, " ").trim()}</div>
                    <p className="team-title">Founder &amp; CEO</p>
                    <p className="team-bio on-navy">{abbreviateBio(leadershipBioDisplay(principal.bio))}{DESIGNATIONS_SUFFIX}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })()}

          {/* Investment & Operations */}
          {(() => {
            const ops = team.filter((m) => m.department === "investment-operations");
            if (!ops.length) return null;
            return (
              <>
                <ScrollReveal>
                  <p className="type-label" style={{ color: "var(--gold)", marginBottom: 24 }}>
                    Investment &amp; Operations
                  </p>
                </ScrollReveal>
                <ScrollReveal staggerChildren>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 64 }}>
                    {ops.map((member) => (
                      <div key={member.id} className="card-navy" style={{ padding: "36px 32px" }}>
                        <div className="team-avatar on-navy" style={{ marginBottom: 24 }}>
                          {teamNameDisplay(member.name).replace(/,.*$/, "").split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div className="team-name on-navy">{teamNameDisplay(member.name)}</div>
                        <p className="team-title">{teamTitleDisplay(member.name, member.title)}</p>
                        <p className="team-bio on-navy">{abbreviateBio(teamBioDisplay(member.name, member.bio), member.name.includes("Jet") ? 600 : isEstefania(member.name) ? 999 : 320)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </>
            );
          })()}

          {/* Lending Team */}
          {(() => {
            const lending = team.filter((m) => m.department === "lending");
            if (!lending.length) return null;
            return (
              <>
                <ScrollReveal>
                  <p className="type-label" style={{ color: "var(--gold)", marginBottom: 24 }}>
                    Lending Team
                  </p>
                </ScrollReveal>
                <ScrollReveal staggerChildren>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                    {lending.map((member) => (
                      <div key={member.id} className="card-navy" style={{ padding: "36px 32px" }}>
                        <div className="team-avatar on-navy" style={{ marginBottom: 24 }}>
                          {teamNameDisplay(member.name).replace(/,.*$/, "").split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div className="team-name on-navy">{teamNameDisplay(member.name)}</div>
                        <p className="team-title">{teamTitleDisplay(member.name, member.title)}</p>
                        <p className="team-bio on-navy">{abbreviateBio(teamBioDisplay(member.name, member.bio), member.name.includes("Jet") ? 600 : isEstefania(member.name) ? 999 : 320)}</p>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </>
            );
          })()}

          {/* Full-width strip: onsite + back office */}
          <ScrollReveal>
            <p
              className="type-body"
              style={{
                color: "var(--navy-text-mid)",
                textAlign: "center",
                maxWidth: 720,
                margin: "48px auto 0",
                padding: "0 var(--page-x)",
                lineHeight: 1.7,
              }}
            >
              …and our 50+ dedicated professionals across onsite property staff and back office operations.
            </p>
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
      <section className="cream-zone section-pad-lg" style={{ paddingTop: 88, paddingBottom: 88 }}>
        <div className="container">
          <ScrollReveal>
            <SectionLabel>Milestones</SectionLabel>
            <h2 className="type-h2" style={{ color: "var(--text)", marginTop: 0, marginBottom: 40 }}>
              Our trajectory
            </h2>
          </ScrollReveal>
          <ScrollReveal staggerChildren>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 0 }}>
              {[
                { marker: "Founded", title: "Company Launch", desc: "Requity Group was founded with our first acquisition in October of 2020, with a focus on value-add real estate in underserved markets.", accent: false },
                { marker: "$70M", title: "Capital Raised", desc: "Surpassed $70M equity cumulatively raised by 2025.", accent: false },
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
