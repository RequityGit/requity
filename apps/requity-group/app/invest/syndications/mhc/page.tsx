import type { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "../../../components/ScrollReveal";
import SectionLabel from "../../../components/SectionLabel";
import FooterCTA from "../../../components/FooterCTA";
import FAQSchema from "../../../components/FAQSchema";
import FAQSection from "../../../components/FAQSection";
import {
  ArrowRight,
  ArrowLeft,
  Home,
  TrendingUp,
  Wrench,
  Users,
  Zap,
  Shield,
  DollarSign,
  BarChart3,
  Droplets,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Manufactured Housing Syndications | MHC Investment | Requity Group",
  description:
    "Invest in manufactured housing community (mobile home park) syndications with Requity Group. Affordable housing with recession-resilient demand, lot rent upside, and significant tax advantages. 14-17% target IRR.",
  openGraph: {
    title: "Manufactured Housing Syndications | Requity Group",
    description:
      "Value-add manufactured housing investments. Affordable housing demand, low turnover, lot rent upside. 14-17% target IRR with monthly distributions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manufactured Housing Syndications | Requity Group",
    description:
      "Value-add MHC investments. Affordable housing with recession-resilient demand. Monthly distributions. Tax-advantaged returns.",
  },
};

export const revalidate = 300;

const mhcFAQs = [
  {
    question: "What is a manufactured housing community?",
    answer:
      "A manufactured housing community (MHC) is a property where the operator owns the land and infrastructure (roads, utilities, common areas) and residents either own or rent manufactured homes placed on individual lots. The primary revenue comes from lot rent, which is the fee residents pay for the right to keep their home on the land. This is sometimes called a mobile home park, though modern MHCs are significantly more sophisticated.",
  },
  {
    question: "Why is MHC considered recession-resilient?",
    answer:
      "Manufactured housing is the largest source of unsubsidized affordable housing in the United States. Average lot rents are a fraction of apartment rents, making MHC the last stop before homelessness for many residents. Demand increases during recessions as people downsize from more expensive housing. Additionally, because residents own their homes and would lose significant equity by moving, tenant turnover is extremely low compared to apartments.",
  },
  {
    question: "How does Requity Group increase value in MHC investments?",
    answer:
      "We focus on communities with below-market lot rents, deferred maintenance, vacant lots, and operational inefficiencies. Our value-add strategy includes bringing lot rents to market rates over time, improving infrastructure (roads, water, sewer, electrical), filling vacant lots with new or used homes, submetering utilities to reduce operating expenses, and implementing professional property management. Each of these levers directly increases net operating income.",
  },
  {
    question: "What is the typical hold period for an MHC syndication?",
    answer:
      "Our target hold period is 3-5 years, which provides enough time to execute the value-add business plan, stabilize the property, and exit at a valuation that reflects the improved income. We evaluate exit opportunities continuously and will transact when the returns justify it.",
  },
  {
    question: "What are the risks specific to MHC investing?",
    answer:
      "Key risks include regulatory changes affecting rent increases or zoning, infrastructure failure (aging water and sewer systems can be expensive to replace), difficulty filling vacant lots in certain markets, environmental liabilities, and concentration risk in affordable housing. We mitigate these through thorough due diligence, conservative underwriting, infrastructure inspections, phase I environmental assessments, and market research before every acquisition.",
  },
];

export default function MHCPage() {
  return (
    <main>
      <FAQSchema faqs={mhcFAQs} />

      {/* ════════════════════════════════════════════════════════════
          1. HERO
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
          {/* Back link */}
          <Link
            href="/invest/syndications"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              marginBottom: 32,
              animation: "fadeUp 0.8s ease both",
            }}
          >
            <ArrowLeft size={14} /> All Syndications
          </Link>

          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--gold-muted)",
              marginBottom: 16,
              animation: "fadeUp 0.8s 0.05s ease both",
            }}
          >
            Asset Class
          </p>

          <h1
            className="type-hero"
            style={{
              color: "#fff",
              maxWidth: 800,
              animation: "fadeUp 0.8s 0.1s ease both",
            }}
          >
            Manufactured Housing{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              Communities
            </em>
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 18,
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.5)",
              maxWidth: 560,
              marginTop: 32,
              animation: "fadeUp 0.8s 0.15s ease both",
            }}
          >
            Affordable housing with recession-resilient demand, low tenant
            turnover, and significant lot rent upside in value-add communities.
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
              Request Access <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          2. INVESTMENT THESIS
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 120px)",
                alignItems: "start",
              }}
              className="mhc-pitch-grid"
            >
              <div>
                <SectionLabel>Investment Thesis</SectionLabel>
                <h2
                  className="section-title"
                  style={{ maxWidth: 480, marginBottom: 32 }}
                >
                  America&apos;s largest source of{" "}
                  <em>affordable housing</em>
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
                    Over 22 million Americans live in manufactured housing
                    communities, commonly known as mobile home parks. It is
                    the only large-scale form of unsubsidized affordable housing
                    in the country, and demand is growing as traditional housing
                    costs continue to rise. For investors, MHCs offer a
                    combination of characteristics that are difficult to find in
                    other real estate asset classes.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                      marginBottom: 24,
                    }}
                  >
                    Lot rents remain a fraction of apartment rents in the same
                    markets, creating room for sustained, responsible rent growth.
                    Because residents own their homes and have significant equity
                    at stake, turnover rates are typically under 5% annually,
                    compared to 40-60% in conventional apartments. Lower turnover
                    means lower operating costs and more predictable cash flow.
                  </p>

                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.85,
                      color: "var(--text-mid)",
                    }}
                  >
                    New supply is severely constrained. Zoning restrictions and
                    community opposition make it nearly impossible to build new
                    mobile home parks, which means existing manufactured housing
                    communities are an irreplaceable asset with a natural
                    barrier to competition.
                  </p>
                </div>
              </div>

              {/* Right: key metrics */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 32,
                  paddingTop: 64,
                }}
              >
                {[
                  {
                    value: "22M+",
                    label: "Americans in manufactured housing",
                  },
                  {
                    value: "<5%",
                    label: "Annual tenant turnover (vs. 40-60% apartments)",
                  },
                  {
                    value: "~0",
                    label: "New MHC communities built annually due to zoning",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      borderLeft: "2px solid var(--gold)",
                      paddingLeft: 28,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(40px, 4.5vw, 64px)",
                        color: "var(--text)",
                        letterSpacing: "-2px",
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                    >
                      {stat.value}
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--text-mid)",
                        lineHeight: 1.6,
                        maxWidth: 300,
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. VALUE-ADD PLAYBOOK
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
              <SectionLabel light>Value-Add Playbook</SectionLabel>
              <h2
                className="type-h2"
                style={{
                  color: "#fff",
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                How we create{" "}
                <em
                  style={{ fontStyle: "italic", color: "var(--gold-muted)" }}
                >
                  value
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
              className="mhc-playbook-grid"
            >
              {[
                {
                  icon: <TrendingUp size={22} />,
                  title: "Lot Rent Optimization",
                  body: "Many MHCs charge lot rents well below market. We implement responsible, phased rent increases that bring rents to market level over the hold period, directly increasing NOI and property value.",
                },
                {
                  icon: <Wrench size={22} />,
                  title: "Infrastructure Upgrades",
                  body: "Roads, water systems, sewer lines, electrical panels, and common areas. Capital improvements increase property value, reduce maintenance costs, and justify market rents.",
                },
                {
                  icon: <Home size={22} />,
                  title: "Home Infill",
                  body: "Vacant lots generate zero revenue. We purchase new or used manufactured homes and place them on empty lots, converting idle land into income-producing assets at attractive returns on investment.",
                },
                {
                  icon: <Droplets size={22} />,
                  title: "Utility Submetering",
                  body: "Shifting water, sewer, and electric costs from the park to individual residents through submetering reduces operating expenses and creates immediate NOI improvement.",
                },
                {
                  icon: <Users size={22} />,
                  title: "Professional Management",
                  body: "Many MHCs are acquired from mom-and-pop operators with informal systems. We implement professional property management, accounting, and resident communication from day one.",
                },
                {
                  icon: <Shield size={22} />,
                  title: "Community Standards",
                  body: "Enforcing community rules, improving curb appeal, and maintaining common areas increases resident satisfaction, reduces turnover, and supports premium positioning in the local market.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "clamp(28px, 3vw, 44px)",
                    background: "rgba(12,28,48,0.6)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--gold-muted)",
                      marginBottom: 16,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 20,
                      color: "#fff",
                      marginBottom: 12,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.75,
                      color: "var(--navy-text-mid)",
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="dark-to-light" />

      {/* ════════════════════════════════════════════════════════════
          4. SAMPLE INVESTMENT PROFILE
          ════════════════════════════════════════════════════════════ */}
      <section
        className="cream-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <SectionLabel>Sample Investment Profile</SectionLabel>
              <h2
                className="section-title"
                style={{ margin: "0 auto", maxWidth: 560 }}
              >
                What <em>$100,000</em> could look like
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-light)",
                  fontStyle: "italic",
                  maxWidth: 520,
                  margin: "16px auto 0",
                }}
              >
                The following is a hypothetical illustration, not an actual
                offering or guarantee of returns. Actual results will vary.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              {/* Investment entry */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    Your Investment
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Closing day, Year 0
                  </p>
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 24,
                  color: "var(--text)",
                  letterSpacing: "-1px",
                }}>
                  $100,000
                </div>
              </div>

              {/* Annual cash flow header */}
              <div style={{
                padding: "24px 0 12px",
              }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                }}>
                  Targeted Annual Cash Flow
                </p>
              </div>

              {/* Years 1-5 distributions */}
              {[
                { year: "Year 1", coc: "6%", amount: "$6,000", note: "Pre-stabilization, early value-add phase" },
                { year: "Year 2", coc: "7%", amount: "$7,000", note: "Lot rent increases and infill coming online" },
                { year: "Year 3", coc: "8%", amount: "$8,000", note: "Submetering and occupancy gains" },
                { year: "Year 4", coc: "9%", amount: "$9,000", note: "Near-stabilized operations" },
                { year: "Year 5", coc: "10%", amount: "$10,000", note: "Stabilized, exit preparation" },
              ].map((yr, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr auto",
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom: "1px solid var(--border-light)",
                    gap: 16,
                  }}
                >
                  <p style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text)",
                  }}>
                    {yr.year}
                  </p>
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                      {yr.note}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: 18,
                      color: "var(--text)",
                      letterSpacing: "-0.5px",
                    }}>
                      {yr.amount}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: "var(--text-light)",
                      marginLeft: 8,
                    }}>
                      ({yr.coc} CoC)
                    </span>
                  </div>
                </div>
              ))}

              {/* Total distributions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>
                  Total Distributions (Yrs 1-5)
                </p>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}>
                  $40,000
                </div>
              </div>

              {/* Sale proceeds */}
              <div style={{
                padding: "24px 0 12px",
              }}>
                <p style={{
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                }}>
                  Year 5 Exit
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                    Return of Capital
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Your original investment returned at sale
                  </p>
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}>
                  $100,000
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                    Sale Proceeds (Your Share)
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Profit from property appreciation at exit
                  </p>
                </div>
                <div style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 20,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}>
                  $60,000
                </div>
              </div>

              {/* Total return */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "24px 0",
                  marginTop: 8,
                  background: "var(--white)",
                  borderRadius: 12,
                  paddingLeft: 24,
                  paddingRight: 24,
                  border: "1px solid var(--border-light)",
                }}
              >
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    Total Return
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-light)" }}>
                    Distributions + return of capital + sale proceeds
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 32,
                    color: "var(--gold)",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}>
                    $200,000
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: "var(--text-light)",
                    fontWeight: 500,
                  }}>
                    2.0X Equity Multiple
                  </p>
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 12,
                color: "var(--text-light)",
                fontStyle: "italic",
                textAlign: "center",
                marginTop: 32,
                maxWidth: 600,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              This illustration is for educational purposes only and does not
              represent an actual or projected investment. Targeted returns are
              not guaranteed. Actual results will differ materially. Past
              performance is not indicative of future results. Distributions
              are targeted, not guaranteed, and may vary.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. REQUITY MHC EXPERIENCE
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{ padding: "clamp(80px, 12vw, 160px) 0" }}
      >
        <div className="container">
          <ScrollReveal>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "clamp(48px, 6vw, 120px)",
                alignItems: "start",
              }}
              className="mhc-pitch-grid"
            >
              <div>
                <SectionLabel>Our Experience</SectionLabel>
                <h2
                  className="section-title"
                  style={{ maxWidth: 480, marginBottom: 32 }}
                >
                  We <em>operate</em> what we invest in
                </h2>

                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--text-mid)",
                    maxWidth: 480,
                    marginBottom: 24,
                  }}
                >
                  Requity Group is not a first-time MHC investor. We manage
                  manufactured housing communities (mobile home parks) in our
                  own portfolio and have originated dozens of bridge loans to
                  MHC operators across the
                  Southeast. We know the asset class from the lending side, the
                  ownership side, and the operations side.
                </p>

                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.85,
                    color: "var(--text-mid)",
                    maxWidth: 480,
                  }}
                >
                  This vertical integration gives us an edge in underwriting,
                  due diligence, and execution. When we evaluate an MHC
                  acquisition, we are not relying on pro forma assumptions. We
                  are comparing the opportunity against communities we already
                  run.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  background: "var(--border-light)",
                  borderRadius: 16,
                  overflow: "hidden",
                  marginTop: 32,
                }}
              >
                {[
                  { val: "4,000+", lbl: "Units Managed" },
                  { val: "34%", lbl: "Of Loan Portfolio in MHC" },
                  { val: "0", lbl: "Defaults in MHC Lending" },
                  { val: "9+", lbl: "Properties Operated" },
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
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          6. FAQ
          ════════════════════════════════════════════════════════════ */}
      <section
        className="light-zone"
        style={{
          padding: "clamp(60px, 8vw, 120px) 0",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div className="container">
          <ScrollReveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2
              className="type-h2"
              style={{ color: "var(--text)", marginBottom: 40 }}
            >
              Manufactured housing questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <FAQSection faqs={mhcFAQs} />
          </ScrollReveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          7. CTA
          ════════════════════════════════════════════════════════════ */}
      <FooterCTA
        headline={
          <>
            Invest in{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold-muted)" }}>
              manufactured housing
            </em>
          </>
        }
        body="Request access to learn about upcoming MHC syndication opportunities. We will share our underwriting approach, portfolio track record, and current deal pipeline."
        primaryCta={
          <Link href="/invest/request-access" className="btn-primary">
            Request Access <ArrowRight size={16} />
          </Link>
        }
        secondaryCta={
          <a
            href="mailto:invest@requitygroup.com?subject=MHC Syndication Inquiry"
            className="btn-secondary"
          >
            Email Us
          </a>
        }
      />

      {/* Disclosures */}
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
            Requity Group LLC is not registered as an investment adviser.
            Interests in individual syndications are offered under separate
            offering memoranda pursuant to Regulation D and have not been
            registered under the Securities Act of 1933. Syndication investments
            are speculative, illiquid, and involve risk of loss including total
            loss of capital. Target returns and illustrative economics are not
            guaranteed. Past performance is not indicative of future results.
            Consult your tax, legal, and financial advisors before investing.
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-light)",
              marginTop: 12,
            }}
          >
            Requity Group LLC | 401 E Jackson St, Suite 3300 | Tampa, FL 33602
          </p>
        </div>
      </section>

      {/* Responsive overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .mhc-pitch-grid {
                grid-template-columns: 1fr !important;
                gap: 48px !important;
              }
              .mhc-playbook-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `,
        }}
      />
    </main>
  );
}
